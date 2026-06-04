import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const directorySettings = pgTable("directory_settings", {
  id: serial("id").primaryKey(),
  siteTitle: text("site_title").notNull().default("Directory Master"),
  logoUrl: text("logo_url"),
  homepageHeadline: text("homepage_headline"),
  homepageDescription: text("homepage_description"),
  heroHeadlineColor: text("hero_headline_color"),
  heroSubtitleColor: text("hero_subtitle_color"),
  themeColor: text("theme_color"),
  navbarBgColor: text("navbar_bg_color"),
  navbarTextColor: text("navbar_text_color"),
  heroSearchPlaceholder: text("hero_search_placeholder"),
  heroSearchButtonText: text("hero_search_button_text"),
  heroSearchButtonColor: text("hero_search_button_color"),
  heroSearchButtonTextColor: text("hero_search_button_text_color"),
  footerText: text("footer_text"),
  privacyPolicyUrl: text("privacy_policy_url"),
  termsUrl: text("terms_url"),
  headScripts: text("head_scripts"),
  bodyScripts: text("body_scripts"),
  calloutSections: text("callout_sections"),
  faviconUrl: text("favicon_url"),
  homepageMetaTitle: text("homepage_meta_title"),
  homepageMetaDescription: text("homepage_meta_description"),
  homepageOgImageUrl: text("homepage_og_image_url"),
  templateSettings: jsonb("template_settings"),
  geminiApiKey: text("gemini_api_key"),
  installed: boolean("installed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDirectorySettingsSchema = createInsertSchema(directorySettings).omit({ id: true, updatedAt: true });
export type DirectorySettings = typeof directorySettings.$inferSelect;
export type InsertDirectorySettings = z.infer<typeof insertDirectorySettingsSchema>;
