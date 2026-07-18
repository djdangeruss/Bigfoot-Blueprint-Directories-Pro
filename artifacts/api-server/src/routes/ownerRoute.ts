import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { db } from "@workspace/db";
import { entries, owners, claims, contacts, upgradeRequests } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import { createOwnerSession, deleteOwnerSession } from "../lib/ownerAuth.js";
import { requireOwner } from "../middlewares/ownerAuth.js";
import {
  getCustomFields, getTier, mergeCustomFields, stripPrivateCustomFields,
  TIER_LIMITS, TIERS, OWNER_EDITABLE_KEYS, type SubscriptionTier,
} from "../lib/entryCustomFields.js";

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

function domainOf(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const url = input.includes("@")
      ? `https://${input.split("@")[1]}`
      : (input.startsWith("http") ? input : `https://${input}`);
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch { return null; }
}

function publicOwner(o: { id: number; name: string; email: string; createdAt: Date }) {
  return { id: o.id, name: o.name, email: o.email, createdAt: o.createdAt.toISOString() };
}

// ── Claim: creates the owner account (if new) + a pending claim ───────────────
router.post("/claim", authRateLimiter, async (req, res) => {
  try {
    const { entryId, name, email, password, phone, message } = req.body ?? {};
    if (!entryId || !name || !email || !password) {
      res.status(400).json({ error: "entryId, name, email and password are required" });
      return;
    }
    if (String(password).length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const [entry] = await db.select().from(entries)
      .where(and(eq(entries.id, Number(entryId)), eq(entries.published, true))).limit(1);
    if (!entry) { res.status(404).json({ error: "Listing not found" }); return; }

    const cf = getCustomFields(entry);
    if (cf.claimStatus === "claimed") {
      res.status(409).json({ error: "This listing is already claimed" });
      return;
    }

    // Reuse the owner account if this email already exists (must present the right password).
    const normEmail = String(email).trim().toLowerCase();
    let [owner] = await db.select().from(owners).where(eq(owners.email, normEmail)).limit(1);
    if (owner) {
      if (!verifyPassword(String(password), owner.passwordHash)) {
        res.status(401).json({ error: "An account with this email exists — password does not match" });
        return;
      }
    } else {
      [owner] = await db.insert(owners).values({
        name: String(name).trim(),
        email: normEmail,
        passwordHash: hashPassword(String(password)),
      }).returning();
    }

    const [existingClaim] = await db.select().from(claims)
      .where(and(eq(claims.entryId, entry.id), eq(claims.ownerId, owner.id), eq(claims.status, "pending")))
      .limit(1);
    if (existingClaim) {
      res.status(409).json({ error: "You already have a pending claim for this listing" });
      return;
    }

    const emailDomain = domainOf(normEmail);
    const siteDomain = domainOf(entry.website);
    const method = emailDomain && siteDomain && emailDomain === siteDomain ? "domain-match" : "manual";

    const [claim] = await db.insert(claims).values({
      entryId: entry.id,
      ownerId: owner.id,
      businessEmail: normEmail,
      phone: phone ? String(phone) : null,
      message: message ? String(message) : null,
      method,
      status: "pending",
    }).returning();

    await mergeCustomFields(entry.id, { claimStatus: "pending" });

    const token = await createOwnerSession(owner.id);
    res.status(201).json({
      owner: publicOwner(owner),
      token,
      claim: { id: claim.id, entryId: claim.entryId, status: claim.status, method: claim.method },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

// ── Session ───────────────────────────────────────────────────────────────────
router.post("/login", authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }
    const [owner] = await db.select().from(owners)
      .where(eq(owners.email, String(email).trim().toLowerCase())).limit(1);
    if (!owner || !verifyPassword(String(password), owner.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = await createOwnerSession(owner.id);
    res.json({ owner: publicOwner(owner), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", requireOwner, async (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) await deleteOwnerSession(token);
  res.json({ success: true });
});

router.get("/me", requireOwner, async (req, res) => {
  try {
    const ownerId = (req as any).ownerId as number;
    const [owner] = await db.select().from(owners).where(eq(owners.id, ownerId)).limit(1);
    if (!owner) { res.status(401).json({ error: "Owner not found" }); return; }
    res.json(publicOwner(owner));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get owner" });
  }
});

// ── Listing management ────────────────────────────────────────────────────────
async function findOwnedEntry(ownerId: number) {
  // The approved link lives in customFields._ownerId (merged at claim approval).
  const [entry] = await db.select().from(entries)
    .where(sql`${entries.customFields}->>'_ownerId' = ${String(ownerId)} AND ${entries.customFields}->>'claimStatus' = 'claimed'`)
    .limit(1);
  return entry ?? null;
}

router.get("/listing", requireOwner, async (req, res) => {
  try {
    const ownerId = (req as any).ownerId as number;
    const entry = await findOwnedEntry(ownerId);
    if (!entry) {
      // Surface pending claims so the dashboard can show status instead of a dead end.
      const pending = await db.select().from(claims)
        .where(and(eq(claims.ownerId, ownerId), eq(claims.status, "pending")))
        .orderBy(desc(claims.createdAt));
      res.json({ listing: null, pendingClaims: pending.map(c => ({ id: c.id, entryId: c.entryId, status: c.status, method: c.method, createdAt: c.createdAt.toISOString() })) });
      return;
    }
    const cf = getCustomFields(entry);
    const tier = getTier(cf);
    res.json({
      listing: {
        id: entry.id,
        title: entry.title,
        category: entry.category,
        location: entry.location,
        venue: entry.venue,
        contactPhone: entry.contactPhone,
        website: entry.website,
        slug: entry.slug,
        published: entry.published,
        featured: entry.featured,
        customFields: stripPrivateCustomFields(cf),
        updatedAt: entry.updatedAt.toISOString(),
      },
      tier,
      limits: TIER_LIMITS[tier],
      pendingClaims: [],
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get listing" });
  }
});

router.patch("/listing", requireOwner, async (req, res) => {
  try {
    const ownerId = (req as any).ownerId as number;
    const entry = await findOwnedEntry(ownerId);
    if (!entry) { res.status(404).json({ error: "No claimed listing for this account" }); return; }

    const tier = getTier(getCustomFields(entry));
    const limits = TIER_LIMITS[tier];
    const body = (req.body ?? {}) as Record<string, unknown>;

    // Whitelisted customFields keys only, tier-capped server-side.
    const patch: Record<string, unknown> = {};
    for (const key of OWNER_EDITABLE_KEYS) {
      if (!(key in body)) continue;
      const val = body[key];
      if (key === "menuUrl") {
        if (!limits.menuUrl) { res.status(403).json({ error: "Menu link requires the Basic tier or higher", upgradeRequired: "basic" }); return; }
        patch.menuUrl = val == null ? null : String(val);
      } else if (key === "photos") {
        const photos = Array.isArray(val) ? val.map(String) : [];
        if (photos.length > limits.photos) {
          res.status(403).json({ error: `Your ${tier} tier allows up to ${limits.photos} photo(s)`, upgradeRequired: TIERS[TIERS.indexOf(tier) + 1] ?? "premium" });
          return;
        }
        patch.photos = photos;
      } else {
        patch[key] = val == null ? null : String(val);
      }
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "No editable fields in request" });
      return;
    }

    const merged = await mergeCustomFields(entry.id, patch);
    res.json({ success: true, customFields: stripPrivateCustomFields(merged) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// ── Upgrade request — the real (non-dead) upgrade path until billing exists ───
router.post("/upgrade-request", requireOwner, async (req, res) => {
  try {
    const ownerId = (req as any).ownerId as number;
    const entry = await findOwnedEntry(ownerId);
    if (!entry) { res.status(404).json({ error: "No claimed listing for this account" }); return; }

    const { requestedTier, message } = req.body ?? {};
    if (!TIERS.includes(requestedTier as SubscriptionTier) || requestedTier === "free") {
      res.status(400).json({ error: "requestedTier must be basic, pro, or premium" });
      return;
    }

    const [owner] = await db.select().from(owners).where(eq(owners.id, ownerId)).limit(1);
    const [request] = await db.insert(upgradeRequests).values({
      entryId: entry.id,
      ownerId,
      requestedTier: String(requestedTier),
      message: message ? String(message) : null,
    }).returning();

    // Also surface as a contact lead so it appears in the existing admin Contacts view.
    if (owner) {
      await db.insert(contacts).values({
        fullName: `[UPGRADE:${requestedTier}] ${owner.name} — ${entry.title}`,
        phone: entry.contactPhone ?? "-",
        email: owner.email,
      }).catch(() => {});
    }

    res.status(201).json({ id: request.id, status: request.status, requestedTier: request.requestedTier });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit upgrade request" });
  }
});

export default router;
