import { Router } from "express";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { db, directorySettings, entries } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { getCustomFields, stripPrivateCustomFields } from "../lib/entryCustomFields.js";
import { isIndexableEntry, publicOrigin } from "./sitemapRoute.js";

const router = Router();

type Entry = typeof entries.$inferSelect;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function text(value: string | null | undefined, fallback = ""): string {
  return (value ?? fallback).replace(/\s+/g, " ").trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const sliced = value.slice(0, max - 1);
  return `${sliced.slice(0, Math.max(0, sliced.lastIndexOf(" ")))}…`;
}

function imageOf(entry: Entry): string | undefined {
  const fields = getCustomFields(entry);
  return typeof fields.photoUrl === "string" && /^https:\/\//.test(fields.photoUrl) ? fields.photoUrl : undefined;
}

function addressOf(entry: Entry): Record<string, string> | undefined {
  const venue = text(entry.venue);
  const location = text(entry.location);
  const match = venue.match(/^(.+?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return {
      "@type": "PostalAddress",
      streetAddress: match[1],
      addressLocality: match[2],
      addressRegion: match[3],
      postalCode: match[4],
      addressCountry: "US",
    };
  }
  const locality = location.match(/^([^,]+),\s*([A-Z]{2})$/);
  if (venue && locality) {
    return {
      "@type": "PostalAddress",
      streetAddress: venue,
      addressLocality: locality[1],
      addressRegion: locality[2],
      addressCountry: "US",
    };
  }
  return undefined;
}

function visibleListing(entry: Entry, origin: string): string {
  const url = `${origin}/entry/${escapeHtml(entry.slug || entry.id)}`;
  const description = text(entry.description, entry.summary || "");
  return `<article><h2><a href="${url}">${escapeHtml(entry.title)}</a></h2>${entry.location ? `<p>${escapeHtml(entry.location)}</p>` : ""}${description ? `<p>${escapeHtml(truncate(description, 220))}</p>` : ""}</article>`;
}

function inject(template: string, input: {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  body: string;
  schema: unknown;
  image?: string;
  status?: number;
}): { html: string; status: number } {
  const metadata = [
    `<title>${escapeHtml(input.title)}</title>`,
    `<meta name="description" content="${escapeHtml(input.description)}" />`,
    `<meta name="robots" content="${escapeHtml(input.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(input.canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(input.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(input.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(input.canonical)}" />`,
    ...(input.image ? [`<meta property="og:image" content="${escapeHtml(input.image)}" />`, `<meta name="twitter:card" content="summary_large_image" />`] : [`<meta name="twitter:card" content="summary" />`]),
    `<script type="application/ld+json">${jsonLd(input.schema)}</script>`,
    `<style id="seo-first-paint">.seo-first-paint{max-width:76rem;margin:auto;padding:2rem;font-family:system-ui,sans-serif}.seo-first-paint a{color:inherit}.seo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1rem}</style>`,
  ].join("\n    ");

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, metadata)
    .replace('<div id="root"></div>', `<div id="root"><main class="seo-first-paint">${input.body}</main></div>`)
    .replace('lang="en"', 'lang="en-US"');
  return { html, status: input.status ?? 200 };
}

async function template(): Promise<string> {
  const staticDir = process.env.STATIC_DIR || resolve(__dirname, "../../directory-master/dist/public");
  return readFile(resolve(staticDir, "index.html"), "utf8");
}

router.get("/{*splat}", async (req, res) => {
  try {
    const origin = publicOrigin();
    const rawTemplate = await template();
    const path = req.path.replace(/\/+$/, "") || "/";
    const [settings] = await db.select().from(directorySettings).limit(1);
    const siteName = text(settings?.siteTitle, "Colombian Restaurants Near Me");

    if (path.startsWith("/admin") || path.startsWith("/owner") || path === "/setup" || path.startsWith("/claim/")) {
      const rendered = inject(rawTemplate, {
        title: `${path.startsWith("/owner") ? "Restaurant Owner" : "Account"} | ${siteName}`,
        description: "Secure directory account area.",
        canonical: `${origin}${path}`,
        robots: "noindex,nofollow,noarchive",
        body: "<h1>Secure account area</h1>",
        schema: { "@context": "https://schema.org", "@type": "WebPage", name: "Secure account area" },
      });
      res.status(rendered.status).set("X-Robots-Tag", "noindex, nofollow, noarchive").send(rendered.html);
      return;
    }

    if (path === "/" || path === "/browse") {
      const rows = await db.select().from(entries).where(eq(entries.published, true)).orderBy(asc(entries.title));
      const canonical = `${origin}${path}`;
      const isHome = path === "/";
      const title = isHome ? "Colombian Restaurants Near Me | Miami & South Florida" : "Browse Colombian Restaurants in South Florida";
      const description = isHome
        ? "Discover Colombian restaurants in Miami, Doral, Hialeah and Miami Beach with useful restaurant details and independently attributed reputation signals."
        : `Compare ${rows.length} Colombian restaurants across Miami and South Florida by location, cuisine and verified public details.`;
      const items = rows.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.title,
        url: `${origin}/entry/${entry.slug || entry.id}`,
      }));
      const schema = {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: siteName, description },
          {
            "@type": "CollectionPage",
            "@id": `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            isPartOf: { "@id": `${origin}/#website` },
            mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items },
          },
        ],
      };
      const body = `<h1>${escapeHtml(isHome ? "Every Colombian restaurant, one table" : "Browse Colombian restaurants")}</h1><p>${escapeHtml(description)}</p><p><a href="/browse">Browse all restaurants</a></p><section class="seo-grid">${rows.map((entry) => visibleListing(entry, origin)).join("")}</section>`;
      const rendered = inject(rawTemplate, { title, description, canonical, robots: "index,follow,max-image-preview:large", body, schema, image: settings?.homepageOgImageUrl ?? undefined });
      res.status(rendered.status).set("Cache-Control", "public, max-age=60, stale-while-revalidate=300").send(rendered.html);
      return;
    }

    const entryMatch = path.match(/^\/entry\/([^/]+)$/);
    if (entryMatch) {
      const key = decodeURIComponent(entryMatch[1]);
      const numericId = /^\d+$/.test(key) ? Number(key) : null;
      const [entry] = await db.select().from(entries).where(and(
        numericId == null ? eq(entries.slug, key) : eq(entries.id, numericId),
        eq(entries.published, true),
      )).limit(1);
      if (!entry) {
        const rendered = inject(rawTemplate, {
          title: `Restaurant not found | ${siteName}`,
          description: "This restaurant listing is not available.",
          canonical: `${origin}${path}`,
          robots: "noindex,follow",
          body: `<h1>Restaurant not found</h1><p><a href="/browse">Browse Colombian restaurants</a></p>`,
          schema: { "@context": "https://schema.org", "@type": "WebPage", name: "Restaurant not found" },
          status: 404,
        });
        res.status(404).set("X-Robots-Tag", "noindex, follow").send(rendered.html);
        return;
      }

      const canonical = `${origin}/entry/${entry.slug || entry.id}`;
      const location = text(entry.location);
      const description = truncate(text(entry.metaDescription, entry.description || entry.summary || `Restaurant listing for ${entry.title}${location ? ` in ${location}` : ""}.`), 160);
      const pageTitle = truncate(text(entry.metaTitle, `${entry.title}${location ? ` in ${location}` : ""} | Colombian Restaurants Near Me`), 60);
      const safeFields = stripPrivateCustomFields(getCustomFields(entry)) as Record<string, unknown>;
      const address = addressOf(entry);
      const restaurant: Record<string, unknown> = {
        "@type": "Restaurant",
        "@id": `${canonical}#restaurant`,
        url: canonical,
        name: entry.title,
        description: text(entry.description, entry.summary || undefined),
        servesCuisine: "Colombian",
        ...(address ? { address } : {}),
        ...(entry.contactPhone ? { telephone: entry.contactPhone } : {}),
        ...(entry.website && /^https?:\/\//.test(entry.website) ? { sameAs: [entry.website] } : {}),
        ...(imageOf(entry) ? { image: imageOf(entry) } : {}),
        ...(typeof safeFields.menuUrl === "string" && /^https?:\/\//.test(safeFields.menuUrl) ? { hasMenu: safeFields.menuUrl } : {}),
      };
      const schema = {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebPage", "@id": `${canonical}#webpage`, url: canonical, name: pageTitle, dateModified: entry.updatedAt.toISOString(), mainEntity: { "@id": `${canonical}#restaurant` }, isPartOf: { "@id": `${origin}/#website` } },
          restaurant,
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Browse", item: `${origin}/browse` },
            { "@type": "ListItem", position: 3, name: entry.title },
          ] },
        ],
      };
      const body = `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/browse">Restaurants</a></nav><article><h1>${escapeHtml(entry.title)}</h1>${entry.location ? `<p>${escapeHtml(entry.location)}</p>` : ""}${entry.description || entry.summary ? `<p>${escapeHtml(text(entry.description, entry.summary || ""))}</p>` : ""}${entry.contactPhone ? `<p><a href="tel:${escapeHtml(entry.contactPhone)}">Call ${escapeHtml(entry.contactPhone)}</a></p>` : ""}${entry.website ? `<p><a href="${escapeHtml(entry.website)}" rel="nofollow noopener">Visit restaurant website</a></p>` : ""}</article>`;
      const indexable = isIndexableEntry(entry) && Boolean(address);
      const rendered = inject(rawTemplate, { title: pageTitle, description, canonical, robots: indexable ? "index,follow,max-image-preview:large" : "noindex,follow", body, schema, image: imageOf(entry) });
      if (!indexable) res.set("X-Robots-Tag", "noindex, follow");
      res.status(200).set("Cache-Control", "public, max-age=60, stale-while-revalidate=300").send(rendered.html);
      return;
    }

    const rendered = inject(rawTemplate, {
      title: `Page not found | ${siteName}`,
      description: "The requested page does not exist.",
      canonical: `${origin}${path}`,
      robots: "noindex,follow",
      body: `<h1>Page not found</h1><p><a href="/browse">Browse Colombian restaurants</a></p>`,
      schema: { "@context": "https://schema.org", "@type": "WebPage", name: "Page not found" },
      status: 404,
    });
    res.status(404).set("X-Robots-Tag", "noindex, follow").send(rendered.html);
  } catch (err) {
    req.log.error({ err }, "Failed to render public route");
    res.status(500).type("text/plain").send("Unable to render this page");
  }
});

export default router;
