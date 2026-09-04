import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { db } from "@workspace/db";
import { entries, owners, claims, contacts, upgradeRequests, ownerAuditEvents } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import { createOwnerSession, deleteOwnerSession, OWNER_SESSION_COOKIE } from "../lib/ownerAuth.js";
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

const mutationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many changes. Please try again shortly." },
});

function setOwnerCookie(res: import("express").Response, token: string): void {
  res.cookie(OWNER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
}

function sessionPayload(token: string): { authenticated: true; token?: string } {
  return process.env.NODE_ENV === "production" ? { authenticated: true } : { authenticated: true, token };
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function safeText(value: unknown, max: number): string | null {
  if (value == null || value === "") return null;
  return String(value).trim().slice(0, max);
}

function safeHttpsUrl(value: unknown): string | null {
  if (value == null || value === "") return null;
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

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

class ClaimRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ── Claim: creates the owner account (if new) + a pending claim ───────────────
router.post("/claim", authRateLimiter, async (req, res) => {
  try {
    const { entryId, name, email, password, phone, message, company } = req.body ?? {};
    if (company) { res.status(201).json({ accepted: true }); return; }
    if (!entryId || !name || !email || !password) {
      res.status(400).json({ error: "entryId, name, email and password are required" });
      return;
    }
    if (String(password).length < 10 || String(password).length > 200) {
      res.status(400).json({ error: "Password must be between 10 and 200 characters" });
      return;
    }

    const normEmail = String(email).trim().toLowerCase();
    if (!validEmail(normEmail) || !String(name).trim() || String(name).trim().length > 120) {
      res.status(400).json({ error: "Enter a valid name and email address" });
      return;
    }
    const { owner, claim, method } = await db.transaction(async tx => {
      const [entry] = await tx.select().from(entries)
        .where(and(eq(entries.id, Number(entryId)), eq(entries.published, true))).limit(1);
      if (!entry) throw new ClaimRequestError(404, "Listing not found");
      if (getCustomFields(entry).claimStatus === "claimed") throw new ClaimRequestError(409, "This listing is already claimed");

      let [owner] = await tx.select().from(owners).where(eq(owners.email, normEmail)).limit(1);
      if (owner && !verifyPassword(String(password), owner.passwordHash)) {
        throw new ClaimRequestError(401, "An account with this email exists — password does not match");
      }
      if (!owner) {
        [owner] = await tx.insert(owners).values({
          name: String(name).trim(), email: normEmail, passwordHash: hashPassword(String(password)),
        }).returning();
      }

      const [existingClaim] = await tx.select().from(claims)
        .where(and(eq(claims.entryId, entry.id), eq(claims.ownerId, owner.id), eq(claims.status, "pending")))
        .limit(1);
      if (existingClaim) throw new ClaimRequestError(409, "You already have a pending claim for this listing");

      const emailDomain = domainOf(normEmail);
      const siteDomain = domainOf(entry.website);
      const method = emailDomain && siteDomain && emailDomain === siteDomain ? "domain-match" : "manual";
      const [claim] = await tx.insert(claims).values({
        entryId: entry.id, ownerId: owner.id, businessEmail: normEmail,
        phone: safeText(phone, 40), message: safeText(message, 2000), method, status: "pending",
      }).returning();
      await tx.update(entries).set({
        customFields: sql`coalesce(${entries.customFields}, '{}'::jsonb) || '{"claimStatus":"pending"}'::jsonb`,
        updatedAt: new Date(),
      }).where(eq(entries.id, entry.id));
      await tx.insert(ownerAuditEvents).values({ ownerId: owner.id, entryId: entry.id, actorType: "owner", actorId: owner.id, eventType: "claim_submitted", metadata: { method } });
      return { owner, claim, method };
    });

    const token = await createOwnerSession(owner.id);
    setOwnerCookie(res, token);
    res.status(201).json({
      owner: publicOwner(owner),
      ...sessionPayload(token),
      claim: { id: claim.id, entryId: claim.entryId, status: claim.status, method: claim.method },
    });
  } catch (err) {
    if (err instanceof ClaimRequestError) { res.status(err.status).json({ error: err.message }); return; }
    if ((err as { code?: string })?.code === "23505") { res.status(409).json({ error: "A matching claim is already pending" }); return; }
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
    if (!owner || owner.status !== "active" || !verifyPassword(String(password), owner.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = await createOwnerSession(owner.id);
    setOwnerCookie(res, token);
    res.json({ owner: publicOwner(owner), ...sessionPayload(token) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", requireOwner, async (req, res) => {
  const token = (req as any).ownerSessionToken as string | undefined;
  if (token) await deleteOwnerSession(token);
  res.clearCookie(OWNER_SESSION_COOKIE, { path: "/" });
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

router.patch("/listing", mutationRateLimiter, requireOwner, async (req, res) => {
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
        const menuUrl = safeHttpsUrl(val);
        if (val && !menuUrl) { res.status(400).json({ error: "Menu link must be a valid HTTPS URL" }); return; }
        patch.menuUrl = menuUrl;
      } else if (key === "photos") {
        if (!Array.isArray(val)) { res.status(400).json({ error: "Photos must be an array of HTTPS URLs" }); return; }
        const normalized = val.map(safeHttpsUrl);
        if (normalized.some(url => !url)) { res.status(400).json({ error: "Every photo must be a valid HTTPS URL" }); return; }
        const photos = normalized.filter((url): url is string => Boolean(url));
        if (photos.length > limits.photos) {
          res.status(403).json({ error: `Your ${tier} tier allows up to ${limits.photos} photo(s)`, upgradeRequired: TIERS[TIERS.indexOf(tier) + 1] ?? "premium" });
          return;
        }
        patch.photos = photos;
      } else {
        patch[key] = safeText(val, key === "ownerDescription" ? 4000 : 1000);
      }
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "No editable fields in request" });
      return;
    }

    const merged = await mergeCustomFields(entry.id, patch);
    await db.insert(ownerAuditEvents).values({ ownerId, entryId: entry.id, actorType: "owner", actorId: ownerId, eventType: "listing_updated", metadata: { fields: Object.keys(patch) } });
    res.json({ success: true, customFields: stripPrivateCustomFields(merged) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// ── Upgrade request — the real (non-dead) upgrade path until billing exists ───
router.post("/upgrade-request", mutationRateLimiter, requireOwner, async (req, res) => {
  try {
    const ownerId = (req as any).ownerId as number;
    const entry = await findOwnedEntry(ownerId);
    if (!entry) { res.status(404).json({ error: "No claimed listing for this account" }); return; }

    const { requestedTier, message } = req.body ?? {};
    if (!TIERS.includes(requestedTier as SubscriptionTier) || requestedTier === "free") {
      res.status(400).json({ error: "requestedTier must be basic, pro, or premium" });
      return;
    }

    const [existing] = await db.select().from(upgradeRequests)
      .where(and(eq(upgradeRequests.entryId, entry.id), eq(upgradeRequests.ownerId, ownerId), eq(upgradeRequests.status, "pending")))
      .limit(1);
    if (existing) { res.status(409).json({ error: "An upgrade request is already pending" }); return; }

    const [owner] = await db.select().from(owners).where(eq(owners.id, ownerId)).limit(1);
    const [request] = await db.insert(upgradeRequests).values({
      entryId: entry.id,
      ownerId,
      requestedTier: String(requestedTier),
      message: safeText(message, 2000),
    }).returning();

    // Also surface as a contact lead so it appears in the existing admin Contacts view.
    if (owner) {
      await db.insert(contacts).values({
        fullName: `[UPGRADE:${requestedTier}] ${owner.name} — ${entry.title}`,
        phone: entry.contactPhone ?? "Not provided",
        email: owner.email,
      }).catch(() => {});
    }

    await db.insert(ownerAuditEvents).values({ ownerId, entryId: entry.id, actorType: "owner", actorId: ownerId, eventType: "upgrade_requested", metadata: { requestedTier } });

    res.status(201).json({ id: request.id, status: request.status, requestedTier: request.requestedTier });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit upgrade request" });
  }
});

export default router;
