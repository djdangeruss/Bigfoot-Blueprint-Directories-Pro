import { Router } from "express";
import { db } from "@workspace/db";
import { entries } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const baseUrl = `${protocol}://${host}`;

    const publishedEntries = await db
      .select({ id: entries.id, slug: entries.slug, updatedAt: entries.updatedAt })
      .from(entries)
      .where(eq(entries.published, true));

    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily", lastmod: now },
      { loc: "/browse", priority: "0.8", changefreq: "daily", lastmod: now },
    ];

    const entryPages = publishedEntries.map((e) => ({
      loc: `/entry/${e.slug || e.id}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: e.updatedAt ? new Date(e.updatedAt).toISOString().split("T")[0] : now,
    }));

    const allPages = [...staticPages, ...entryPages];

    const urlElements = allPages
      .map(
        (p) => `  <url>
    <loc>${escapeXml(baseUrl + p.loc)}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    req.log.error({ err }, "Failed to generate sitemap");
    res.status(500).send("Failed to generate sitemap");
  }
});

export default router;
