import { Router } from "express";
import { db } from "@workspace/db";
import { entries } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";
import { getGeminiClient } from "../lib/gemini.js";
import { eq, isNull, or, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger.js";

const router = Router();

type SeoJobStatus = {
  status: "running" | "complete" | "error";
  total: number;
  processed: number;
  progress: number;
  message: string;
  error?: string;
};

const seoJobs = new Map<string, SeoJobStatus>();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/^```(?:json)?\s*/im, "").replace(/\s*```$/im, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("No valid JSON found in Gemini response");
}

const SEO_BATCH = 20;

async function generateSeoBatch(
  batch: Array<{ id: number; title: string; category: string | null; summary: string | null; description: string | null }>
): Promise<Map<number, { metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string }>> {
  const prompt = `You are an SEO expert. For each directory entry below, generate SEO metadata.

Rules:
- metaTitle: 50–60 characters, include the entry title naturally, avoid keyword stuffing
- metaDescription: 140–160 characters, compelling, describes the entry, includes a call to action
- ogTitle: same as metaTitle or slightly more engaging for social sharing
- ogDescription: same as metaDescription or slightly more conversational for social media

Return ONLY valid JSON, no markdown fences:
{
  "results": [
    { "id": <number>, "metaTitle": "...", "metaDescription": "...", "ogTitle": "...", "ogDescription": "..." }
  ]
}

Entries:
${batch.map(e => `[${e.id}] Title: "${e.title}" | Category: ${e.category || "General"} | Summary: ${(e.summary || "").slice(0, 200)} | Description: ${(e.description || "").slice(0, 300)}`).join("\n")}`;

  const aiClient = await getGeminiClient();
  const response = await aiClient.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 16384 },
  });

  const text = response.text ?? "";
  if (!text) return new Map();

  const parsed = extractJson(text);
  const result = new Map<number, { metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string }>();
  for (const r of parsed.results ?? []) {
    if (r.id && r.metaTitle) {
      result.set(r.id, {
        metaTitle: (r.metaTitle || "").slice(0, 60),
        metaDescription: (r.metaDescription || "").slice(0, 160),
        ogTitle: (r.ogTitle || r.metaTitle || "").slice(0, 60),
        ogDescription: (r.ogDescription || r.metaDescription || "").slice(0, 160),
      });
    }
  }
  return result;
}

async function runBulkSeo(jobId: string, overwrite: boolean) {
  const job = seoJobs.get(jobId)!;
  try {
    const allEntries = overwrite
      ? await db.select({ id: entries.id, title: entries.title, category: entries.category, summary: entries.summary, description: entries.description, slug: entries.slug }).from(entries)
      : await db.select({ id: entries.id, title: entries.title, category: entries.category, summary: entries.summary, description: entries.description, slug: entries.slug })
          .from(entries)
          .where(or(isNull(entries.metaTitle), isNull(entries.slug)));

    job.total = allEntries.length;
    job.message = `Processing ${allEntries.length} entries...`;

    if (allEntries.length === 0) {
      Object.assign(job, { status: "complete", progress: 100, message: "All entries already have SEO data." });
      return;
    }

    // Step 1: Generate slugs deterministically and ensure uniqueness
    const existingSlugs = await db.select({ id: entries.id, slug: entries.slug }).from(entries).where(isNull(entries.slug));
    const usedSlugs = new Set<string>();

    // Pre-load existing non-null slugs to avoid collisions
    const allSlugs = await db.select({ slug: entries.slug }).from(entries);
    for (const row of allSlugs) {
      if (row.slug) usedSlugs.add(row.slug);
    }

    const slugMap = new Map<number, string>();
    for (const entry of allEntries) {
      if (!overwrite && entry.slug) {
        slugMap.set(entry.id, entry.slug);
        continue;
      }
      let base = slugify(entry.title);
      if (!base) base = `entry-${entry.id}`;
      let slug = base;
      let counter = 2;
      while (usedSlugs.has(slug)) {
        slug = `${base}-${counter++}`;
      }
      usedSlugs.add(slug);
      slugMap.set(entry.id, slug);
    }

    job.progress = 10;
    job.message = "Slugs generated, calling Gemini for meta content...";

    // Step 2: Generate meta titles/descriptions in batches via Gemini
    const totalBatches = Math.ceil(allEntries.length / SEO_BATCH);
    const seoMap = new Map<number, { metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string }>();

    for (let b = 0; b < totalBatches; b++) {
      const batchSlice = allEntries.slice(b * SEO_BATCH, (b + 1) * SEO_BATCH);
      job.progress = 10 + Math.round((b / totalBatches) * 70);
      job.message = `Generating SEO metadata via Gemini: batch ${b + 1} of ${totalBatches}...`;

      try {
        const batchResult = await generateSeoBatch(batchSlice);
        for (const [id, seo] of batchResult) {
          seoMap.set(id, seo);
        }
        logger.info({ jobId, batch: b, enrichedCount: batchResult.size }, "SEO batch done");
      } catch (err) {
        logger.warn({ jobId, batch: b, err }, "SEO batch failed — using fallbacks");
        for (const entry of batchSlice) {
          seoMap.set(entry.id, {
            metaTitle: entry.title.slice(0, 60),
            metaDescription: (entry.summary || entry.description || entry.title).slice(0, 160),
            ogTitle: entry.title.slice(0, 60),
            ogDescription: (entry.summary || entry.description || entry.title).slice(0, 160),
          });
        }
      }
    }

    // Step 3: Write all updates to DB
    job.progress = 85;
    job.message = "Saving SEO data to database...";

    let saved = 0;
    for (const entry of allEntries) {
      const seo = seoMap.get(entry.id);
      const slug = slugMap.get(entry.id)!;
      await db.update(entries).set({
        slug,
        metaTitle: seo?.metaTitle || entry.title.slice(0, 60),
        metaDescription: seo?.metaDescription || (entry.summary || "").slice(0, 160),
        ogTitle: seo?.ogTitle || entry.title.slice(0, 60),
        ogDescription: seo?.ogDescription || (entry.summary || "").slice(0, 160),
        updatedAt: new Date(),
      }).where(eq(entries.id, entry.id));
      saved++;
      job.processed = saved;
      if (saved % 10 === 0 || saved === allEntries.length) {
        job.progress = 85 + Math.round((saved / allEntries.length) * 15);
      }
    }

    Object.assign(job, {
      status: "complete",
      progress: 100,
      processed: saved,
      message: `SEO data generated for ${saved} entries.`,
    });
    logger.info({ jobId, saved }, "Bulk SEO complete");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ jobId, err }, "Bulk SEO failed");
    Object.assign(job, { status: "error", error: errMsg, message: "SEO generation failed." });
  }
}

// GET /api/seo/summary
router.get("/summary", requireAdmin, async (req, res) => {
  try {
    const [totalRow] = await db.select({ count: count() }).from(entries);
    const [missingSeoRow] = await db
      .select({ count: count() })
      .from(entries)
      .where(or(isNull(entries.slug), isNull(entries.metaTitle), isNull(entries.metaDescription)));

    const totalCount = Number(totalRow?.count ?? 0);
    const missingSeo = Number(missingSeoRow?.count ?? 0);

    res.json({
      total: totalCount,
      withSeo: totalCount - missingSeo,
      missingSeo,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get SEO summary" });
  }
});

// POST /api/seo/bulk
router.post("/bulk", requireAdmin, async (req, res) => {
  try {
    const { overwrite = false } = req.body as { overwrite?: boolean };

    // Reject if a bulk SEO job is already running to prevent resource exhaustion
    for (const [, job] of seoJobs) {
      if (job.status === "running") {
        res.status(409).json({ error: "A bulk SEO job is already in progress. Wait for it to finish before starting a new one." });
        return;
      }
    }

    // Prune finished/errored jobs so the map does not grow without bound
    for (const [id, job] of seoJobs) {
      if (job.status !== "running") seoJobs.delete(id);
    }

    const jobId = randomUUID();
    const initialStatus: SeoJobStatus = {
      status: "running",
      total: 0,
      processed: 0,
      progress: 0,
      message: "Starting SEO generation...",
    };
    seoJobs.set(jobId, initialStatus);

    runBulkSeo(jobId, overwrite).catch(err =>
      logger.error(err, "runBulkSeo unhandled error")
    );

    res.json({ jobId, ...initialStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to start SEO job" });
  }
});

// GET /api/seo/status/:jobId
router.get("/status/:jobId", requireAdmin, async (req, res) => {
  const job = seoJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json({ jobId: req.params.jobId, ...job });
});

export default router;
