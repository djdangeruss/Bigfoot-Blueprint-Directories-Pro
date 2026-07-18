import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Business-owner accounts for the public claim flow. Deliberately separate from the
// admin `users`/`sessions` tables so owner auth can never satisfy admin middleware.
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ownerSessions = pgTable("owner_sessions", {
  token: text("token").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  businessEmail: text("business_email").notNull(),
  phone: text("phone"),
  message: text("message"),
  // "domain-match" = claimant email domain matches the listing website domain
  method: text("method").notNull().default("manual"),
  status: text("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tier upgrade requests — the "no dead buttons" path until billing exists.
// Approving one is a manual admin action that merges subscriptionTier into the entry.
export const upgradeRequests = pgTable("upgrade_requests", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  requestedTier: text("requested_tier").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true, createdAt: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, createdAt: true, reviewedBy: true, reviewedAt: true });

export type Owner = typeof owners.$inferSelect;
export type UpgradeRequest = typeof upgradeRequests.$inferSelect;
export type OwnerSession = typeof ownerSessions.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
