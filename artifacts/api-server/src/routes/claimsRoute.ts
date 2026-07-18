import { Router } from "express";
import { db } from "@workspace/db";
import { claims, entries, owners, upgradeRequests } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";
import { mergeCustomFields, getCustomFields, TIERS, type SubscriptionTier } from "../lib/entryCustomFields.js";

const router = Router();

// Admin review queue for ownership claims and tier upgrade requests.

router.get("/", requireAdmin, async (req, res) => {
  try {
    const status = (req.query.status as string) || "pending";
    const rows = await db.select({
      claim: claims,
      entryTitle: entries.title,
      entryWebsite: entries.website,
      ownerName: owners.name,
      ownerEmail: owners.email,
    })
      .from(claims)
      .leftJoin(entries, eq(claims.entryId, entries.id))
      .leftJoin(owners, eq(claims.ownerId, owners.id))
      .where(status === "all" ? undefined : eq(claims.status, status))
      .orderBy(desc(claims.createdAt));

    res.json(rows.map(r => ({
      id: r.claim.id,
      entryId: r.claim.entryId,
      entryTitle: r.entryTitle,
      entryWebsite: r.entryWebsite,
      ownerId: r.claim.ownerId,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
      businessEmail: r.claim.businessEmail,
      phone: r.claim.phone,
      message: r.claim.message,
      method: r.claim.method,
      status: r.claim.status,
      createdAt: r.claim.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list claims" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { action } = req.body ?? {};
    if (action !== "approve" && action !== "reject") {
      res.status(400).json({ error: 'action must be "approve" or "reject"' });
      return;
    }

    const [claim] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
    if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }
    if (claim.status !== "pending") {
      res.status(409).json({ error: `Claim is already ${claim.status}` });
      return;
    }

    const adminId = (req as any).userId as number;
    const newStatus = action === "approve" ? "approved" : "rejected";
    await db.update(claims)
      .set({ status: newStatus, reviewedBy: adminId, reviewedAt: new Date() })
      .where(eq(claims.id, id));

    if (action === "approve") {
      const [entry] = await db.select().from(entries).where(eq(entries.id, claim.entryId)).limit(1);
      const existingTier = entry ? getCustomFields(entry).subscriptionTier : undefined;
      await mergeCustomFields(claim.entryId, {
        claimStatus: "claimed",
        subscriptionTier: existingTier ?? "free",
        _ownerId: claim.ownerId,
        _claimedAt: new Date().toISOString(),
      });
    } else {
      // Only reset to unclaimed if no other pending/approved claim exists for the entry.
      const remaining = await db.select().from(claims).where(eq(claims.entryId, claim.entryId));
      const stillActive = remaining.some(c => c.id !== id && (c.status === "pending" || c.status === "approved"));
      if (!stillActive) await mergeCustomFields(claim.entryId, { claimStatus: "unclaimed" });
    }

    res.json({ success: true, id, status: newStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update claim" });
  }
});

// ── Upgrade requests queue ────────────────────────────────────────────────────
router.get("/upgrade-requests", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select({
      request: upgradeRequests,
      entryTitle: entries.title,
      ownerName: owners.name,
      ownerEmail: owners.email,
    })
      .from(upgradeRequests)
      .leftJoin(entries, eq(upgradeRequests.entryId, entries.id))
      .leftJoin(owners, eq(upgradeRequests.ownerId, owners.id))
      .orderBy(desc(upgradeRequests.createdAt));
    res.json(rows.map(r => ({
      id: r.request.id,
      entryId: r.request.entryId,
      entryTitle: r.entryTitle,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
      requestedTier: r.request.requestedTier,
      message: r.request.message,
      status: r.request.status,
      createdAt: r.request.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list upgrade requests" });
  }
});

router.patch("/upgrade-requests/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { action } = req.body ?? {};
    if (action !== "approve" && action !== "reject") {
      res.status(400).json({ error: 'action must be "approve" or "reject"' });
      return;
    }
    const [request] = await db.select().from(upgradeRequests).where(eq(upgradeRequests.id, id)).limit(1);
    if (!request) { res.status(404).json({ error: "Upgrade request not found" }); return; }
    if (request.status !== "pending") {
      res.status(409).json({ error: `Request is already ${request.status}` });
      return;
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    await db.update(upgradeRequests).set({ status: newStatus }).where(eq(upgradeRequests.id, id));

    if (action === "approve" && TIERS.includes(request.requestedTier as SubscriptionTier)) {
      await mergeCustomFields(request.entryId, { subscriptionTier: request.requestedTier });
      // Premium tier drives the public featured treatment.
      if (request.requestedTier === "premium") {
        await db.update(entries).set({ featured: true, updatedAt: new Date() }).where(eq(entries.id, request.entryId));
      }
    }

    res.json({ success: true, id, status: newStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update upgrade request" });
  }
});

export default router;
