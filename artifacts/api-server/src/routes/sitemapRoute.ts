import { Router } from "express";
import { db, entries } from "@workspace/db";
import { eq } from "drizzle-orm";
import { directoryProfile } from "../lib/directoryProfile.js";

const router = Router();

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function publicOrigin(): string {
  if (process.env.NODE_ENV === "production" && !process.env.PUBLIC_ORIGIN) {
    throw new Error("PUBLIC_ORIGIN is required in production");
  }
  const url = new URL(process.env.PUBLIC_ORIGIN || "http://localhost:3000");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("PUBLIC_ORIGIN must use HTTPS in production");
  }
  return url.origin;
}

export function isIndexableEntry(entry: { slug: string | null; summary: string | null; description: string | null }): boolean {
  return Boolean(entry.slug && `${entry.summary ?? ""} ${entry.description ?? ""}`.trim().length >= 120);
}

router.get("/robots.txt", (_req, res) => {
  const origin = publicOrigin();
  res.type("text/plain; charset=utf-8");
  res.set("Cache-Control", "public, max-age=300");
  res.send([
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /owner/",
    "Disallow: /setup",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n"));
});

router.get("/sitemap.xml", async (req, res) => {
  try {
    const origin = publicOrigin();
    const profile = directoryProfile(origin);
    const rows = await db
      .select({ slug: entries.slug, summary: entries.summary, description: entries.description, updatedAt: entries.updatedAt })
      .from(entries)
      .where(eq(entries.published, true));

    const editorialPages = profile.hasEditorialInfoPages
      ? ["/about", "/methodology", "/privacy", "/terms", "/owner-terms", "/accessibility", "/corrections"]
      : [];
    const pages: Array<{ loc: string; lastmod?: string }> = [
      { loc: "/" },
      { loc: "/browse" },
      ...editorialPages.map((loc) => ({ loc })),
      ...rows
        .filter(isIndexableEntry)
        .map((entry) => ({
          loc: `/entry/${entry.slug}`,
          lastmod: entry.updatedAt.toISOString().slice(0, 10),
        }))
        .sort((a, b) => a.loc.localeCompare(b.loc)),
    ];

    const body = pages.map((page) => [
      "  <url>",
      `    <loc>${escapeXml(origin + page.loc)}</loc>`,
      ...(page.lastmod ? [`    <lastmod>${page.lastmod}</lastmod>`] : []),
      "  </url>",
    ].join("\n")).join("\n");

    res.type("application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
  } catch (err) {
    req.log.error({ err }, "Failed to generate sitemap");
    res.status(500).type("text/plain").send("Failed to generate sitemap");
  }
});

export default router;
