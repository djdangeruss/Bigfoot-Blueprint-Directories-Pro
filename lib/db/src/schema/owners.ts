import { pgTable, serial, text, integer, timestamp, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("owners_email_unique").on(table.email)]);

export const ownerSessions = pgTable("owner_sessions", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  ownerId: integer("owner_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("owner_sessions_owner_idx").on(table.ownerId), index("owner_sessions_expires_idx").on(table.expiresAt)]);

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  businessEmail: text("business_email").notNull(),
  phone: text("phone"),
  message: text("message"),
  method: text("method").notNull().default("manual"),
  status: text("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("claims_entry_idx").on(table.entryId), index("claims_owner_idx").on(table.ownerId), index("claims_status_idx").on(table.status)]);

export const upgradeRequests = pgTable("upgrade_requests", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  requestedTier: text("requested_tier").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("upgrade_requests_entry_idx").on(table.entryId), index("upgrade_requests_status_idx").on(table.status)]);

export const ownerAuditEvents = pgTable("owner_audit_events", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id"),
  entryId: integer("entry_id"),
  actorType: text("actor_type").notNull(),
  actorId: integer("actor_id"),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("owner_audit_owner_idx").on(table.ownerId), index("owner_audit_entry_idx").on(table.entryId), index("owner_audit_created_idx").on(table.createdAt)]);

export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true, status: true, createdAt: true, updatedAt: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, createdAt: true, updatedAt: true, reviewedBy: true, reviewedAt: true, reviewNote: true });

export type Owner = typeof owners.$inferSelect;
export type UpgradeRequest = typeof upgradeRequests.$inferSelect;
export type OwnerSession = typeof ownerSessions.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
