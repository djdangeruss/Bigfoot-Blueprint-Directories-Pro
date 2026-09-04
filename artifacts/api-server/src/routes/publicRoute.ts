import { Router } from "express";
import { db } from "@workspace/db";
import { entries, directorySettings, categories, contacts } from "@workspace/db";
import { rateLimit } from "express-rate-limit";
import { eq, ilike, and, desc, asc, count, sql, or } from "drizzle-orm";
import { stripPrivateCustomFields } from "../lib/entryCustomFields.js";

const router = Router();

const correctionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const placePhotoLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 240,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many photo requests. Please try again later." },
});

router.post("/corrections", correctionLimiter, async (req, res) => {
  try {
    const input = req.body as Record<string, unknown>;
    // Honeypot: bots that fill hidden website fields receive a neutral success
    // without creating operational noise.
    if (String(input.website ?? "").trim()) {
      res.status(202).json({ accepted: true });
      return;
    }
    const requestType = String(input.requestType ?? "Correction").trim().slice(0, 80);
    const listingUrl = String(input.listingUrl ?? "").trim().slice(0, 500);
    const fullName = String(input.fullName ?? "").trim().slice(0, 120);
    const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200);
    const phone = String(input.phone ?? "").trim().slice(0, 60) || "Not provided";
    const message = String(input.message ?? "").trim().slice(0, 3000);
    if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !/^https:\/\//i.test(listingUrl) || message.length < 20) {
      res.status(400).json({ error: "Name, valid email, HTTPS page URL, and a detailed message are required." });
      return;
    }
    const [record] = await db.insert(contacts).values({
      fullName,
      email,
      phone,
      subject: `[${requestType}] ${listingUrl}`,
      message,
    }).returning({ id: contacts.id });
    res.status(201).json({ accepted: true, id: record.id });
  } catch (err) {
    req.log.error({ err }, "Failed to submit correction request");
    res.status(500).json({ error: "Failed to submit request" });
  }
});

function formatEntry(e: typeof entries.$inferSelect) {
  const publicCustomFields = stripPrivateCustomFields(e.customFields) as Record<string, unknown> | null;
  if (publicCustomFields?.googlePlaceId && publicCustomFields.claimStatus !== "claimed") {
    delete publicCustomFields.photoUrl;
  }
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
    customFields: publicCustomFields,
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
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
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
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const param = String(req.params.idOrSlug);
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

router.get("/entries/:idOrSlug/photo", placePhotoLimiter, async (req, res) => {
  res.set("Cache-Control", "private, no-store, max-age=0");
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "Restaurant photos are not configured" });
      return;
    }

    const param = String(req.params.idOrSlug);
    const numericId = parseInt(param, 10);
    const isNumeric = !Number.isNaN(numericId) && String(numericId) === param;
    const where = isNumeric
      ? and(eq(entries.id, numericId), eq(entries.published, true))
      : and(eq(entries.slug, param), eq(entries.published, true));
    const [entry] = await db.select({ customFields: entries.customFields }).from(entries).where(where).limit(1);
    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    const customFields = entry.customFields && typeof entry.customFields === "object"
      ? entry.customFields as Record<string, unknown>
      : {};
    const placeId = typeof customFields.googlePlaceId === "string" ? customFields.googlePlaceId.trim() : "";
    if (!/^ChI[A-Za-z0-9_-]+$/.test(placeId)) {
      res.status(404).json({ error: "No source photo is available" });
      return;
    }

    const placeResponse = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "photos",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!placeResponse.ok) {
      req.log.warn({ status: placeResponse.status, entry: param }, "Google Places photo lookup failed");
      res.status(502).json({ error: "Restaurant photo is temporarily unavailable" });
      return;
    }

    const place = await placeResponse.json() as {
      photos?: Array<{
        name?: string;
        googleMapsUri?: string;
        flagContentUri?: string;
        authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }>;
      }>;
    };
    const photo = place.photos?.find(item => item.name && item.googleMapsUri);
    if (!photo?.name || !photo.googleMapsUri) {
      res.status(404).json({ error: "No source photo is available" });
      return;
    }

    const mediaResponse = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1200&maxHeightPx=900&skipHttpRedirect=true`, {
      headers: { "X-Goog-Api-Key": apiKey },
      signal: AbortSignal.timeout(8_000),
    });
    if (!mediaResponse.ok) {
      res.status(502).json({ error: "Restaurant photo is temporarily unavailable" });
      return;
    }
    const media = await mediaResponse.json() as { photoUri?: string };
    if (!media.photoUri || !/^https:\/\//i.test(media.photoUri)) {
      res.status(502).json({ error: "Restaurant photo is temporarily unavailable" });
      return;
    }

    res.json({
      imageUrl: media.photoUri,
      sourceUrl: photo.googleMapsUri,
      flagContentUrl: photo.flagContentUri ?? null,
      authorAttributions: (photo.authorAttributions ?? []).map(author => ({
        displayName: author.displayName ?? null,
        uri: author.uri ?? null,
        photoUri: author.photoUri ?? null,
      })),
    });
  } catch (err) {
    req.log.warn({ err, entry: req.params.idOrSlug }, "Failed to resolve Google Places photo");
    res.status(502).json({ error: "Restaurant photo is temporarily unavailable" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
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
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
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
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
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
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
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
