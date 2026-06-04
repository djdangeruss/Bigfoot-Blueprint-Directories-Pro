import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const importJobs = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  progress: integer("progress"),
  totalRows: integer("total_rows"),
  processedRows: integer("processed_rows"),
  entriesCreated: integer("entries_created"),
  categoriesCreated: integer("categories_created"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertImportJobSchema = createInsertSchema(importJobs).omit({ id: true, createdAt: true, updatedAt: true });
export type ImportJob = typeof importJobs.$inferSelect;
export type InsertImportJob = z.infer<typeof insertImportJobSchema>;
