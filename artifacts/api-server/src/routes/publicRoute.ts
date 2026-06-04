import { Router } from "express";
import { db } from "@workspace/db";
import { entries, directorySettings, categories } from "@workspace/db";
import { eq, ilike, and, desc, asc, count, sql, or } from "drizzle-orm";

const router = Router();

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
    slug: e.slug,
    metaTitle: e.metaTitle,
    metaDescription: e.metaDescription,
    ogTitle: e.ogTitle,
    ogDescription: e.ogDescription,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

router.get("/entries", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const sort = (req.query.sort as string) || "newest";

    const conditions = [eq(entries.published, true)];
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

    const where = and(...conditions);
    const orderBy =
      sort === "a-z" ? asc(entries.title) :
      sort === "z-a" ? desc(entries.title) :
      sort === "oldest" ? asc(entries.createdAt) :
      desc(entries.createdAt);

    const [total] = await db.select({ count: count() }).from(entries).where(where);
    const rows = await db.select().from(entries).where(where).orderBy(orderBy).limit(limit).offset(offset);

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

router.get("/entries/:idOrSlug", async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    const numericId = parseInt(param, 10);
    const isNumeric = !isNaN(numericId) && String(numericId) === param;

    const where = isNumeric
      ? and(eq(entries.id, numericId), eq(entries.published, true))
      : and(eq(entries.slug, param), eq(entries.published, true));

    const [entry] = await db.select().from(entries).where(where).limit(1);
    if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }
    res.json(formatEntry(entry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get entry" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [totalEntries] = await db.select({ count: count() }).from(entries).where(eq(entries.published, true));
    const breakdown = await db.select({
      category: entries.category,
      count: count(),
    }).from(entries)
      .where(and(eq(entries.published, true), sql`${entries.category} IS NOT NULL`))
      .groupBy(entries.category)
      .orderBy(desc(count()));

    const cats = await db.select({ name: categories.name, imageUrl: categories.imageUrl }).from(categories);
    const imageMap = new Map(cats.map(c => [c.name, c.imageUrl]));

    res.json({
      totalEntries: Number(totalEntries.count),
      totalCategories: breakdown.length,
      categoryBreakdown: breakdown.map(b => ({
        category: b.category!,
        count: Number(b.count),
        imageUrl: imageMap.get(b.category!) ?? null,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const rows = await db.select().from(entries)
      .where(and(eq(entries.published, true), eq(entries.featured, true)))
      .orderBy(desc(entries.createdAt))
      .limit(6);
    res.json(rows.map(formatEntry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get featured entries" });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const rows = await db.select().from(entries)
      .where(eq(entries.published, true))
      .orderBy(desc(entries.createdAt))
      .limit(8);
    res.json(rows.map(formatEntry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get recent entries" });
  }
});

router.get("/settings", async (req, res) => {
  try {
    const [settings] = await db.select().from(directorySettings).limit(1);
    if (!settings) {
      res.json({
        id: 0,
        siteTitle: "Directory Master",
        logoUrl: null,
        homepageHeadline: null,
        homepageDescription: null,
        themeColor: null,
        calloutSections: null,
        templateSettings: null,
        installed: false,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    res.json({
      id: settings.id,
      siteTitle: settings.siteTitle,
      logoUrl: settings.logoUrl,
      homepageHeadline: settings.homepageHeadline,
      homepageDescription: settings.homepageDescription,
      heroHeadlineColor: settings.heroHeadlineColor,
      heroSubtitleColor: settings.heroSubtitleColor,
      themeColor: settings.themeColor,
      navbarBgColor: settings.navbarBgColor,
      navbarTextColor: settings.navbarTextColor,
      heroSearchPlaceholder: settings.heroSearchPlaceholder,
      heroSearchButtonText: settings.heroSearchButtonText,
      heroSearchButtonColor: settings.heroSearchButtonColor,
      heroSearchButtonTextColor: settings.heroSearchButtonTextColor,
      footerText: settings.footerText,
      privacyPolicyUrl: settings.privacyPolicyUrl,
      termsUrl: settings.termsUrl,
      headScripts: settings.headScripts,
      bodyScripts: settings.bodyScripts,
      calloutSections: settings.calloutSections,
      faviconUrl: settings.faviconUrl,
      homepageMetaTitle: settings.homepageMetaTitle,
      homepageMetaDescription: settings.homepageMetaDescription,
      homepageOgImageUrl: settings.homepageOgImageUrl,
      templateSettings: settings.templateSettings ?? null,
      installed: settings.installed,
      updatedAt: settings.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

export default router;
