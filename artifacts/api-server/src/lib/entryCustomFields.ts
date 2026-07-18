import { db } from "@workspace/db";
import { entries } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

// entries.customFields is the flexible store for listing data (ratings, claim state,
// tier, owner-edited content). The public PATCH /api/entries contract replaces
// customFields wholesale, so every server-side write here MUST read-merge-write.

export type SubscriptionTier = "free" | "basic" | "pro" | "premium";
export const TIERS: SubscriptionTier[] = ["free", "basic", "pro", "premium"];

// Feature caps per tier — enforced in the API, mirrored in the dashboard UI.
export const TIER_LIMITS: Record<SubscriptionTier, { photos: number; menuUrl: boolean; analytics: boolean; featured: boolean }> = {
  free:    { photos: 1,  menuUrl: false, analytics: false, featured: false },
  basic:   { photos: 5,  menuUrl: true,  analytics: false, featured: false },
  pro:     { photos: 15, menuUrl: true,  analytics: true,  featured: false },
  premium: { photos: 30, menuUrl: true,  analytics: true,  featured: true },
};

// customFields keys owners may edit through PATCH /api/owner/listing.
export const OWNER_EDITABLE_KEYS = ["hours", "ownerDescription", "photos", "menuUrl"] as const;

// Keys prefixed with "_" are server-private and stripped from all public responses.
export function stripPrivateCustomFields(cf: unknown): unknown {
  if (!cf || typeof cf !== "object" || Array.isArray(cf)) return cf;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cf as Record<string, unknown>)) {
    if (!k.startsWith("_")) out[k] = v;
  }
  return out;
}

export function getCustomFields(entry: { customFields: unknown }): Record<string, unknown> {
  const cf = entry.customFields;
  return cf && typeof cf === "object" && !Array.isArray(cf) ? { ...(cf as Record<string, unknown>) } : {};
}

export function getTier(cf: Record<string, unknown>): SubscriptionTier {
  const t = cf.subscriptionTier;
  return TIERS.includes(t as SubscriptionTier) ? (t as SubscriptionTier) : "free";
}

// Atomic JSONB merge. This prevents concurrent owner/admin writes from silently
// replacing unrelated keys in the flexible listing state.
export async function mergeCustomFields(
  entryId: number,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const [updated] = await db.update(entries)
    .set({
      customFields: sql`coalesce(${entries.customFields}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, entryId))
    .returning({ customFields: entries.customFields });
  return updated ? getCustomFields(updated) : null;
}
