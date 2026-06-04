import { Router } from "express";
import { db } from "@workspace/db";
import { entries, categories } from "@workspace/db";
import { requireAuth, requireEditor, requireAdmin } from "../middlewares/auth.js";
import { eq, ilike, and, or, desc, count, sql } from "drizzle-orm";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const publishedParam = req.query.published as string;

    const featuredParam = req.query.featured as string;

    const conditions = [];
    if (search && search !== "null") {
      const q = `%${search}%`;
      conditions.push(or(
        ilike(entries.title, q),
        ilike(entries.summary, q),
        ilike(entries.description, q),
        ilike(entries.tags, q),
        ilike(entries.location, q),
        ilike(entries.venue, q),
        ilike(entries.eventType, q),
        ilike(entries.category, q),
        ilike(entries.moreDetails, q),
      )!);
    }
    if (category && category !== "null") conditions.push(eq(entries.category, category));
    if (publishedParam === "true") conditions.push(eq(entries.published, true));
    if (publishedParam === "false") conditions.push(eq(entries.published, false));
    if (featuredParam === "true") conditions.push(eq(entries.featured, true));
    if (featuredParam === "false") conditions.push(eq(entries.featured, false));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [total] = await db.select({ count: count() }).from(entries).where(where);
    const rows = await db.select().from(entries).where(where)
      .orderBy(desc(entries.createdAt)).limit(limit).offset(offset);

    res.json({
      entries: rows.map(formatEntry),
      total: Number(total.count),
      page,
      totalPages: Math.ceil(Number(total.count) / limit),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list entries" });
  }
});

router.post("/", requireEditor, async (req, res) => {
  try {
    const { title, ...rest } = req.body;
    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const [entry] = await db.insert(entries).values({ title, ...rest }).returning();
    res.status(201).json(formatEntry(entry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [entry] = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
    if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }
    res.json(formatEntry(entry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get entry" });
  }
});

router.patch("/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [entry] = await db.update(entries).set({ ...req.body, updatedAt: new Date() })
      .where(eq(entries.id, id)).returning();
    if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }
    res.json(formatEntry(entry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

router.delete("/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(entries).where(eq(entries.id, id));
    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

router.patch("/:id/publish", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { published } = req.body;
    const [entry] = await db.update(entries).set({ published, updatedAt: new Date() })
      .where(eq(entries.id, id)).returning();
    if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }
    res.json(formatEntry(entry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

router.patch("/:id/featured", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { featured } = req.body;
    const [entry] = await db.update(entries).set({ featured, updatedAt: new Date() })
      .where(eq(entries.id, id)).returning();
    if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }
    res.json(formatEntry(entry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update featured status" });
  }
});

// DELETE /api/entries — wipe all entries + categories (admin only)
router.delete("/", requireAdmin, async (req, res) => {
  try {
    const deleted = await db.delete(entries).returning({ id: entries.id });
    await db.delete(categories);
    req.log.warn({ entriesDeleted: deleted.length }, "Admin cleared all entries and categories");
    res.json({ success: true, entriesDeleted: deleted.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to clear entries" });
  }
});

function formatEntry(e: typeof entries.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    summary: e.summary,
    description: e.description,
    contactEmail: e.contactEmail,
    contactPhone: e.contactPhone,
    website: e.website,
    location: e.location,
    venue: e.venue,
    eventType: e.eventType,
    startDate: e.startDate,
    endDate: e.endDate,
    tags: e.tags,
    moreDetails: e.moreDetails,
    customFields: e.customFields,
    sourceCsvRow: e.sourceCsvRow,
    published: e.published,
    featured: e.featured,
    slug: e.slug,
    metaTitle: e.metaTitle,
    metaDescription: e.metaDescription,
    ogTitle: e.ogTitle,
    ogDescription: e.ogDescription,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export default router;
