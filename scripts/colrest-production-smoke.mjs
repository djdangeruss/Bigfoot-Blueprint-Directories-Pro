import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

const baseUrl = (process.env.COLREST_BASE_URL || "https://colombianrestaurantnear.me").replace(/\/$/, "");
const canonicalOrigin = (process.env.COLREST_CANONICAL_ORIGIN || baseUrl).replace(/\/$/, "");
const expectedListings = Number(process.env.COLREST_EXPECTED_LISTINGS || 31);
const routes = [
  "/",
  "/browse",
  "/about",
  "/methodology",
  "/corrections",
  "/privacy",
  "/terms",
  "/owner-terms",
  "/accessibility",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectResponse(request, path, expectedStatus = 200) {
  const response = await request.get(`${baseUrl}${path}`);
  assert(response.status() === expectedStatus, `${path}: expected ${expectedStatus}, received ${response.status()}`);
  return response;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

try {
  await expectResponse(context.request, "/api/healthz");
  await expectResponse(context.request, "/robots.txt");
  const sitemap = await expectResponse(context.request, "/sitemap.xml");
  const sitemapBody = await sitemap.text();
  for (const path of routes) assert(sitemapBody.includes(`${canonicalOrigin}${path === "/" ? "" : path}`), `sitemap missing ${path}`);

  const publicEntries = await expectResponse(context.request, "/api/public/entries?limit=100");
  const entriesBody = await publicEntries.json();
  const entries = Array.isArray(entriesBody) ? entriesBody : entriesBody.entries;
  assert(Array.isArray(entries), "public entries response is not an array");
  assert(entries.length === expectedListings, `expected ${expectedListings} public listings, received ${entries.length}`);
  assert(!JSON.stringify(entries).includes('"_ownerId"'), "private owner data leaked through the public API");
  assert(!JSON.stringify(entries).includes("lh3.googleusercontent.com"), "unattributed queue photo URL leaked through the public API");

  let photoEntry = null;
  let photoResponse = null;
  for (const entry of entries) {
    if (!entry.slug) continue;
    const response = await context.request.get(`${baseUrl}/api/public/entries/${entry.slug}/photo`);
    if (response.status() === 200) {
      photoEntry = entry;
      photoResponse = response;
      break;
    }
    assert(response.status() === 404, `${entry.slug}/photo: expected 200 or 404, received ${response.status()}`);
  }
  assert(photoEntry && photoResponse, "no published listing returned a compliant source photo");
  assert((photoResponse.headers()["cache-control"] || "").includes("no-store"), "place photo response is cacheable");
  const photoBody = await photoResponse.json();
  assert(/^https:\/\//.test(photoBody.imageUrl || ""), "place photo media URL is missing");
  assert(/^https:\/\//.test(photoBody.sourceUrl || ""), "place photo source URL is missing");

  for (const route of routes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    assert(response?.status() === 200, `${route}: browser navigation failed`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert(!overflow, `${route}: horizontal overflow detected`);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const severe = results.violations.filter((item) => ["serious", "critical"].includes(item.impact || ""));
    assert(severe.length === 0, `${route}: ${severe.length} serious/critical accessibility violation(s)`);
  }

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  assert((await page.locator("h1").first().textContent())?.includes("Colombian table"), "new discovery hero is not active");
  assert((await page.locator("[data-dm-head], [data-dm-body]").count()) === 0, "optional scripts loaded before consent");
  await page.getByRole("button", { name: /Accept analytics/i }).click();
  await page.waitForTimeout(500);
  assert((await page.locator("[data-dm-head], [data-dm-body]").count()) > 0, "optional scripts did not load after consent");
  await page.getByRole("button", { name: /Cookie preferences/i }).click();
  await page.getByRole("button", { name: /Essential only/i }).click();
  await page.waitForLoadState("domcontentloaded");
  assert((await page.locator("[data-dm-head], [data-dm-body]").count()) === 0, "optional scripts remained after consent withdrawal");
  await page.getByRole("button", { name: /ES/ }).click();
  assert((await page.locator("h1").first().textContent())?.includes("mesa colombiana"), "Spanish locale did not activate");

  await page.goto(`${baseUrl}/browse`, { waitUntil: "networkidle" });
  assert((await page.locator("article").count()) === expectedListings, "browse card count does not match the public dataset");
  const photoCard = page.locator(`article:has(a[href="/entry/${photoEntry.slug}"])`).first();
  await photoCard.scrollIntoViewIfNeeded();
  await photoCard.locator('a[aria-label*="Google Maps"]').waitFor({ state: "visible" });

  console.log(`PASS ${baseUrl}: ${routes.length} routes, ${entries.length} listings, mobile WCAG smoke, bilingual UI`);
} finally {
  await browser.close();
}
