import { Router } from "express";
import { db } from "@workspace/db";
import { directorySettings } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";
import { eq } from "drizzle-orm";

const router = Router();

function formatSettings(s: typeof directorySettings.$inferSelect) {
  return {
    id: s.id,
    siteTitle: s.siteTitle,
    logoUrl: s.logoUrl,
    homepageHeadline: s.homepageHeadline,
    homepageDescription: s.homepageDescription,
    heroHeadlineColor: s.heroHeadlineColor,
    heroSubtitleColor: s.heroSubtitleColor,
    themeColor: s.themeColor,
    navbarBgColor: s.navbarBgColor,
    navbarTextColor: s.navbarTextColor,
    heroSearchPlaceholder: s.heroSearchPlaceholder,
    heroSearchButtonText: s.heroSearchButtonText,
    heroSearchButtonColor: s.heroSearchButtonColor,
    heroSearchButtonTextColor: s.heroSearchButtonTextColor,
    footerText: s.footerText,
    privacyPolicyUrl: s.privacyPolicyUrl,
    termsUrl: s.termsUrl,
    headScripts: s.headScripts,
    bodyScripts: s.bodyScripts,
    calloutSections: s.calloutSections,
    faviconUrl: s.faviconUrl,
    homepageMetaTitle: s.homepageMetaTitle,
    homepageMetaDescription: s.homepageMetaDescription,
    homepageOgImageUrl: s.homepageOgImageUrl,
    templateSettings: s.templateSettings ?? null,
    installed: s.installed,
    updatedAt: s.updatedAt.toISOString(),
    // Never expose the raw key — return only whether it is set and a masked hint
    geminiApiKeySet: !!s.geminiApiKey,
    geminiApiKeyHint: s.geminiApiKey
      ? `${"•".repeat(Math.max(0, s.geminiApiKey.length - 4))}${s.geminiApiKey.slice(-4)}`
      : null,
  };
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const [settings] = await db.select().from(directorySettings).limit(1);
    if (!settings) { res.status(404).json({ error: "Settings not found" }); return; }
    res.json(formatSettings(settings));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.patch("/", requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.select().from(directorySettings).limit(1);
    if (!existing) { res.status(404).json({ error: "Settings not found" }); return; }

    const dbUpdates: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.siteTitle !== undefined)           dbUpdates.siteTitle = req.body.siteTitle;
    if (req.body.logoUrl !== undefined)             dbUpdates.logoUrl = req.body.logoUrl;
    if (req.body.homepageHeadline !== undefined)    dbUpdates.homepageHeadline = req.body.homepageHeadline;
    if (req.body.homepageDescription !== undefined) dbUpdates.homepageDescription = req.body.homepageDescription;
    if (req.body.heroHeadlineColor !== undefined)   dbUpdates.heroHeadlineColor = req.body.heroHeadlineColor;
    if (req.body.heroSubtitleColor !== undefined)   dbUpdates.heroSubtitleColor = req.body.heroSubtitleColor;
    if (req.body.themeColor !== undefined)          dbUpdates.themeColor = req.body.themeColor;
    if (req.body.navbarBgColor !== undefined)           dbUpdates.navbarBgColor = req.body.navbarBgColor;
    if (req.body.navbarTextColor !== undefined)         dbUpdates.navbarTextColor = req.body.navbarTextColor;
    if (req.body.heroSearchPlaceholder !== undefined)       dbUpdates.heroSearchPlaceholder = req.body.heroSearchPlaceholder;
    if (req.body.heroSearchButtonText !== undefined)        dbUpdates.heroSearchButtonText = req.body.heroSearchButtonText;
    if (req.body.heroSearchButtonColor !== undefined)       dbUpdates.heroSearchButtonColor = req.body.heroSearchButtonColor;
    if (req.body.heroSearchButtonTextColor !== undefined)   dbUpdates.heroSearchButtonTextColor = req.body.heroSearchButtonTextColor;
    if (req.body.footerText !== undefined)              dbUpdates.footerText = req.body.footerText;
    if (req.body.privacyPolicyUrl !== undefined)        dbUpdates.privacyPolicyUrl = req.body.privacyPolicyUrl;
    if (req.body.termsUrl !== undefined)                dbUpdates.termsUrl = req.body.termsUrl;
    if (req.body.headScripts !== undefined)             dbUpdates.headScripts = req.body.headScripts;
    if (req.body.bodyScripts !== undefined)             dbUpdates.bodyScripts = req.body.bodyScripts;
    if (req.body.calloutSections !== undefined)             dbUpdates.calloutSections = req.body.calloutSections;
    if (req.body.faviconUrl !== undefined)                  dbUpdates.faviconUrl = req.body.faviconUrl || null;
    if (req.body.homepageMetaTitle !== undefined)           dbUpdates.homepageMetaTitle = req.body.homepageMetaTitle || null;
    if (req.body.homepageMetaDescription !== undefined)     dbUpdates.homepageMetaDescription = req.body.homepageMetaDescription || null;
    if (req.body.homepageOgImageUrl !== undefined)          dbUpdates.homepageOgImageUrl = req.body.homepageOgImageUrl || null;
    if (req.body.templateSettings !== undefined)            dbUpdates.templateSettings = req.body.templateSettings;
    // geminiApiKey: null/empty clears the key; non-empty string stores it
    if (req.body.geminiApiKey !== undefined) {
      dbUpdates.geminiApiKey = req.body.geminiApiKey || null;
    }

    const [updated] = await db.update(directorySettings).set(dbUpdates).where(eq(directorySettings.id, existing.id)).returning();
    res.json(formatSettings(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
