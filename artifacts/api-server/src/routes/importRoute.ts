import { Router } from "express";
import { db } from "@workspace/db";
import { importJobs, entries, categories } from "@workspace/db";
import { requireEditor } from "../middlewares/auth.js";
import { getGeminiClient } from "../lib/gemini.js";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger.js";

const router = Router();

// All target fields available for mapping
const AVAILABLE_FIELDS = [
  { value: "title",         label: "Title / Name",        description: "The main name or title of the entry" },
  { value: "category",      label: "Category",            description: "Primary category for grouping entries" },
  { value: "summary",       label: "Short Summary",       description: "1-2 sentence summary shown in cards" },
  { value: "description",   label: "Full Description",    description: "Detailed description of the entry" },
  { value: "website",       label: "Website URL",         description: "Primary website or link" },
  { value: "contactEmail",  label: "Contact Email",       description: "Email address" },
  { value: "contactPhone",  label: "Contact Phone",       description: "Phone number" },
  { value: "location",      label: "Location (full)",     description: "Full location string (city, state, country)" },
  { value: "location_city", label: "Location – City",     description: "City part — combined with state/country into Location" },
  { value: "location_state",label: "Location – State/Region", description: "State or region part of the location" },
  { value: "location_country",label:"Location – Country", description: "Country part of the location" },
  { value: "venue",         label: "Venue",               description: "Venue or facility name" },
  { value: "eventType",     label: "Event Type",          description: "Type of event (conference, expo, summit…)" },
  { value: "startDate",     label: "Start Date",          description: "Start date of the event or listing" },
  { value: "endDate",       label: "End Date",            description: "End date of the event or listing" },
  { value: "tags",          label: "Tags / Keywords",     description: "Comma-separated tags" },
  { value: "moreDetails",   label: "More Details",        description: "Additional information (stored as text)" },
  { value: "skip",          label: "Skip (don't import)", description: "This column will not be imported" },
];

// Heuristic rules for auto-suggesting mappings from column names
const HEURISTIC_RULES: Array<{ patterns: RegExp[]; target: string; confidence: number }> = [
  { patterns: [/^name$/i, /^title$/i, /^event_name$/i, /^listing_name$/i], target: "title", confidence: 0.95 },
  { patterns: [/^slug$/i, /^id$/i, /^identifier$/i, /^uid$/i, /^uuid$/i, /^code$/i, /^key$/i, /^ref$/i], target: "skip", confidence: 0.9 },
  { patterns: [/^source_url$/i, /^source$/i, /^origin$/i, /^reference$/i], target: "skip", confidence: 0.85 },
  { patterns: [/^category$/i, /^type$/i, /^section$/i, /^genre$/i, /^topic$/i], target: "category", confidence: 0.9 },
  { patterns: [/^event_type$/i, /^event_format$/i, /^format$/i, /^kind$/i], target: "eventType", confidence: 0.9 },
  { patterns: [/^start_date$/i, /^start$/i, /^begins$/i, /^date_start$/i, /^from_date$/i, /^opens$/i], target: "startDate", confidence: 0.9 },
  { patterns: [/^end_date$/i, /^end$/i, /^until$/i, /^date_end$/i, /^to_date$/i, /^closes$/i], target: "endDate", confidence: 0.9 },
  { patterns: [/^city$/i, /^town$/i], target: "location_city", confidence: 0.95 },
  { patterns: [/^state$/i, /^region$/i, /^province$/i, /^territory$/i, /^state_region$/i], target: "location_state", confidence: 0.92 },
  { patterns: [/^country$/i, /^nation$/i, /^country_code$/i], target: "location_country", confidence: 0.95 },
  { patterns: [/^location$/i, /^address$/i, /^place$/i, /^where$/i], target: "location", confidence: 0.9 },
  { patterns: [/^venue$/i, /^venue_name$/i, /^facility$/i, /^hall$/i, /^building$/i], target: "venue", confidence: 0.95 },
  { patterns: [/^description$/i, /^desc$/i, /^about$/i, /^details$/i, /^info$/i, /^bio$/i, /^overview$/i, /^body$/i], target: "description", confidence: 0.9 },
  { patterns: [/^summary$/i, /^excerpt$/i, /^brief$/i, /^abstract$/i, /^short_description$/i], target: "summary", confidence: 0.9 },
  { patterns: [/^email$/i, /^contact_email$/i, /^e_mail$/i, /^mailto$/i], target: "contactEmail", confidence: 0.95 },
  { patterns: [/^phone$/i, /^telephone$/i, /^mobile$/i, /^contact_phone$/i, /^tel$/i], target: "contactPhone", confidence: 0.95 },
  { patterns: [/^website$/i, /^url$/i, /^web$/i, /^link$/i, /^homepage$/i, /^site$/i], target: "website", confidence: 0.9 },
  { patterns: [/^tags$/i, /^tag$/i, /^keywords$/i, /^keyword$/i, /^labels$/i], target: "tags", confidence: 0.9 },
  { patterns: [/^notes$/i, /^additional$/i, /^extra$/i, /^more_details$/i, /^remarks$/i], target: "moreDetails", confidence: 0.85 },
];

function suggestMapping(columnName: string): { target: string; confidence: number } {
  for (const rule of HEURISTIC_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(columnName)) {
        return { target: rule.target, confidence: rule.confidence };
      }
    }
  }
  // Default to moreDetails with low confidence for unrecognized columns
  return { target: "moreDetails", confidence: 0.3 };
}

// Full CSV parser that correctly handles quoted fields containing embedded newlines and commas.
// Returns an array of rows, each row being an array of field strings.
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  // Normalise line endings
  const text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          currentField += '"';   // escaped double-quote
          i++;
        } else {
          inQuotes = false;       // closing quote
        }
      } else {
        currentField += ch;      // newlines inside quotes are kept as-is
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (ch === '\n') {
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.length > 0 && currentRow.some(f => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += ch;
      }
    }
  }

  // Flush last field / row
  currentRow.push(currentField.trim());
  if (currentRow.length > 0 && currentRow.some(f => f !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function extractJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/^```(?:json)?\s*/im, "").replace(/\s*```$/im, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("No valid JSON found in Gemini response");
}

// Build an entry object from a CSV row using confirmed field mappings
interface FieldMapping {
  csvColumn: string;
  targetField: string;
  approved: boolean;
}

function applyMappings(headers: string[], rowValues: string[], mappings: FieldMapping[]): Record<string, string | null> {
  const entry: Record<string, string | null> = {};
  const locationParts: { city?: string; state?: string; country?: string } = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const value = (rowValues[i] ?? "").trim() || null;
    const mapping = mappings.find(m => m.csvColumn === header);

    if (!mapping || !mapping.approved || mapping.targetField === "skip") continue;

    const target = mapping.targetField;

    if (target === "location_city") { locationParts.city = value ?? undefined; }
    else if (target === "location_state") { locationParts.state = value ?? undefined; }
    else if (target === "location_country") { locationParts.country = value ?? undefined; }
    else { entry[target] = value; }
  }

  // Combine location parts if any were mapped
  if (locationParts.city || locationParts.state || locationParts.country) {
    const parts = [locationParts.city, locationParts.state, locationParts.country].filter(Boolean);
    entry["location"] = entry["location"] || parts.join(", ") || null;
  }

  return entry;
}

// Gemini enrichment: generate summary + tags for entries missing them
const ENRICH_BATCH = 50;      // entries per Gemini call
const ENRICH_PARALLEL = 3;    // concurrent Gemini calls at a time
const INSERT_CHUNK = 250;     // rows per bulk DB insert

// Resource-exhaustion guards
const IMPORT_CSV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB hard cap on raw CSV content
const IMPORT_MAX_ROWS = 10_000;               // max data rows per import
const IMPORT_MAX_CONCURRENT = 3;              // max simultaneous in-flight import jobs

let activeImportJobs = 0;

async function enrichBatch(batch: Array<{ index: number; data: Record<string, string | null> }>): Promise<Map<number, { summary: string; tags: string }>> {
  const needsEnrich = batch.filter(b => !b.data.summary || !b.data.tags);
  if (needsEnrich.length === 0) return new Map();

  const prompt = `For each of these directory entries, generate a concise 1-2 sentence summary and 3-5 comma-separated tags. Return ONLY JSON (no markdown):
{
  "results": [
    { "index": <number>, "summary": "...", "tags": "tag1, tag2, tag3" }
  ]
}

Entries:
${needsEnrich.map(b => `[${b.index}] Title: ${b.data.title || "Unknown"} | Category: ${b.data.category || ""} | Description: ${(b.data.description || "").slice(0, 300)} | Location: ${b.data.location || ""} | EventType: ${b.data.eventType || ""}`).join("\n")}`;

  const aiClient = await getGeminiClient();
  const response = await aiClient.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 16384 },
  });

  const text = response.text ?? "";
  if (!text) return new Map();

  const parsed = extractJson(text);
  const result = new Map<number, { summary: string; tags: string }>();
  for (const r of parsed.results ?? []) {
    result.set(r.index, { summary: r.summary || "", tags: r.tags || "" });
  }
  return result;
}

async function processImport(jobId: string, csvContent: string, fieldMappings: FieldMapping[]) {
  try {
    logger.info({ jobId, csvBytes: csvContent.length, mappings: fieldMappings.length }, "processImport started");

    const allRows = parseCSV(csvContent);
    if (allRows.length < 2) throw new Error("CSV must have at least a header row and one data row.");

    const headers = allRows[0];
    const dataRows = allRows.slice(1);
    const totalRows = dataRows.length;

    if (totalRows > IMPORT_MAX_ROWS) {
      throw new Error(`CSV exceeds the maximum of ${IMPORT_MAX_ROWS} rows. This import had ${totalRows} rows. Split the file and re-import.`);
    }

    const approvedMappings = fieldMappings.filter(m => m.approved && m.targetField !== "skip");
    const needsEnrichment = !approvedMappings.some(m => m.targetField === "summary") ||
                            !approvedMappings.some(m => m.targetField === "tags");

    await db.update(importJobs).set({
      status: "processing",
      totalRows,
      processedRows: 0,
      progress: 5,
      message: `Mapping ${totalRows} rows using confirmed field mappings...`,
      updatedAt: new Date(),
    }).where(eq(importJobs.jobId, jobId));

    // Step 1: Parse all rows using confirmed mappings
    const parsedEntries: Array<{ rowIndex: number; data: Record<string, string | null> }> = [];

    for (let i = 0; i < dataRows.length; i++) {
      const rowValues = dataRows[i];
      const data = applyMappings(headers, rowValues, fieldMappings);
      if (data.title) {
        parsedEntries.push({ rowIndex: i, data });
      }
    }

    logger.info({ jobId, parsedCount: parsedEntries.length, needsEnrichment }, "Rows parsed");

    // Step 2: Gemini enrichment for summary/tags if not mapped (optional)
    // Runs ENRICH_PARALLEL concurrent Gemini calls, each covering ENRICH_BATCH entries.
    if (needsEnrichment && parsedEntries.length > 0) {
      const totalBatches = Math.ceil(parsedEntries.length / ENRICH_BATCH);

      for (let groupStart = 0; groupStart < totalBatches; groupStart += ENRICH_PARALLEL) {
        const groupEnd = Math.min(groupStart + ENRICH_PARALLEL, totalBatches);
        const groupBatches = Array.from({ length: groupEnd - groupStart }, (_, i) => groupStart + i);

        const doneEntries = groupStart * ENRICH_BATCH;
        const progress = 10 + Math.round((doneEntries / parsedEntries.length) * 50);
        await db.update(importJobs).set({
          progress,
          message: `AI enriching entries ${Math.min(doneEntries + 1, parsedEntries.length)}–${Math.min(groupEnd * ENRICH_BATCH, parsedEntries.length)} of ${parsedEntries.length} (summaries & tags)...`,
          updatedAt: new Date(),
        }).where(eq(importJobs.jobId, jobId));

        const results = await Promise.allSettled(
          groupBatches.map(async (b) => {
            const batchSlice = parsedEntries.slice(b * ENRICH_BATCH, (b + 1) * ENRICH_BATCH);
            const batchItems = batchSlice.map((e, i) => ({ index: b * ENRICH_BATCH + i, data: e.data }));
            const enriched = await enrichBatch(batchItems);
            return { b, enriched };
          })
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            const { b, enriched } = result.value;
            for (const [idx, enrichment] of enriched) {
              const entry = parsedEntries[idx];
              if (entry) {
                if (!entry.data.summary && enrichment.summary) entry.data.summary = enrichment.summary;
                if (!entry.data.tags && enrichment.tags) entry.data.tags = enrichment.tags;
              }
            }
            logger.info({ jobId, batch: b, enrichedCount: enriched.size }, "Enrichment batch done");
          } else {
            logger.warn({ jobId, groupStart, err: result.reason }, "Enrichment batch failed — continuing without summaries for this batch");
          }
        }
      }
    }

    // Step 3: Bulk-upsert categories (single round-trip instead of N individual queries)
    const allCategoryNames = [
      ...new Set(parsedEntries.map(({ data }) => data.category?.trim()).filter(Boolean) as string[]),
    ];

    await db.update(importJobs).set({
      progress: 65,
      message: `Creating ${allCategoryNames.length} categories...`,
      updatedAt: new Date(),
    }).where(eq(importJobs.jobId, jobId));

    let categoriesCreated = 0;
    if (allCategoryNames.length > 0) {
      const existingRows = await db
        .select({ name: categories.name })
        .from(categories)
        .where(inArray(categories.name, allCategoryNames));
      const existingSet = new Set(existingRows.map(r => r.name));
      const newCats = allCategoryNames.filter(n => !existingSet.has(n));
      if (newCats.length > 0) {
        await db
          .insert(categories)
          .values(newCats.map(name => ({ name, slug: slugify(name) })))
          .onConflictDoNothing();
        categoriesCreated = newCats.length;
      }
    }

    // Step 4: Bulk-insert entries in chunks of INSERT_CHUNK rows
    let entriesCreated = 0;
    const totalEntries = parsedEntries.length;

    await db.update(importJobs).set({
      progress: 70,
      message: `Saving ${totalEntries} entries to database...`,
      updatedAt: new Date(),
    }).where(eq(importJobs.jobId, jobId));

    for (let chunkStart = 0; chunkStart < parsedEntries.length; chunkStart += INSERT_CHUNK) {
      const chunk = parsedEntries.slice(chunkStart, chunkStart + INSERT_CHUNK);

      const rows = chunk.map(({ data }) => {
        const customFields: Record<string, string> = {};
        const customKeys = Object.keys(data).filter(k => k.startsWith("custom_"));
        for (const k of customKeys) {
          if (data[k]) customFields[k.replace("custom_", "")] = data[k]!;
          delete data[k];
        }
        return {
          title: String(data.title || "Untitled").slice(0, 500),
          category: data.category?.slice(0, 200) ?? null,
          summary: data.summary?.slice(0, 1000) ?? null,
          description: data.description ?? null,
          contactEmail: data.contactEmail?.slice(0, 200) ?? null,
          contactPhone: data.contactPhone?.slice(0, 50) ?? null,
          website: data.website?.slice(0, 500) ?? null,
          location: data.location?.slice(0, 200) ?? null,
          venue: data.venue?.slice(0, 300) ?? null,
          eventType: data.eventType?.slice(0, 100) ?? null,
          startDate: data.startDate?.slice(0, 50) ?? null,
          endDate: data.endDate?.slice(0, 50) ?? null,
          tags: data.tags?.slice(0, 500) ?? null,
          moreDetails: data.moreDetails ?? null,
          customFields: Object.keys(customFields).length > 0 ? customFields : null,
          sourceCsvRow: null,
          published: true,
        };
      });

      await db.insert(entries).values(rows);
      entriesCreated += chunk.length;

      const insertProgress = 70 + Math.round((entriesCreated / totalEntries) * 30);
      await db.update(importJobs).set({
        processedRows: entriesCreated,
        progress: insertProgress,
        message: `Saving entries... (${entriesCreated}/${totalEntries})`,
        updatedAt: new Date(),
      }).where(eq(importJobs.jobId, jobId));
    }

    await db.update(importJobs).set({
      status: "complete",
      message: `Import complete! Created ${entriesCreated} entries across ${categoriesCreated} new categories.`,
      processedRows: entriesCreated,
      entriesCreated,
      categoriesCreated,
      progress: 100,
      updatedAt: new Date(),
    }).where(eq(importJobs.jobId, jobId));

    logger.info({ jobId, entriesCreated, categoriesCreated }, "Import complete");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ jobId, err }, "Import failed");
    await db.update(importJobs).set({
      status: "error",
      error: errMsg,
      message: "Import failed. See error details below.",
      updatedAt: new Date(),
    }).where(eq(importJobs.jobId, jobId));
  } finally {
    activeImportJobs--;
  }
}

// POST /api/import/ai-map — use Gemini to intelligently map CSV columns to fields
router.post("/ai-map", requireEditor, async (req, res) => {
  try {
    const { headers, sampleRows } = req.body as { headers: string[]; sampleRows: string[][] };
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      res.status(400).json({ error: "headers array is required" });
      return;
    }

    const standardFieldList = AVAILABLE_FIELDS
      .filter(f => f.value !== "skip")
      .map(f => `  - "${f.value}": ${f.label} — ${f.description}`)
      .join("\n");

    const columnInfo = headers.map((col, i) => {
      const samples = (sampleRows ?? [])
        .slice(0, 3)
        .map(row => (row[i] ?? "").trim())
        .filter(Boolean)
        .slice(0, 2);
      return `  - Column: "${col}" | Samples: ${samples.length ? samples.join(" | ") : "(empty)"}`;
    }).join("\n");

    const prompt = `You are mapping CSV column headers to directory entry fields for a business directory web app.

STANDARD FIELDS AVAILABLE:
${standardFieldList}

RULES:
1. Map each column to the best-matching standard field when a clear match exists.
2. For columns that don't clearly fit any standard field, use exactly the string "custom" as the targetField. The system will automatically use the original CSV column name as the section heading.
3. CRITICAL: Exactly ONE column must be mapped to "category". If no column is obviously a category, pick the most suitable grouping column.
4. Use "skip" only for clearly internal/useless columns (IDs, row numbers, source URLs, internal codes).
5. Set approved: false only for skipped columns.

CSV COLUMNS TO MAP:
${columnInfo}

Respond with ONLY this JSON (no markdown fences, no explanation):
{
  "mappings": [
    {
      "csvColumn": "<exact column header>",
      "targetField": "<standard field value, OR 'custom', OR 'skip'>",
      "confidence": <0.0 to 1.0>,
      "approved": <true or false>
    }
  ]
}`;

    const aiClient = await getGeminiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text ?? "";
    if (!text) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    const parsed = extractJson(text);
    const mappings: any[] = parsed.mappings ?? [];

    // Convert "custom" → custom_<slug_of_csv_column_name>, label = original column name
    for (const m of mappings) {
      if (m.targetField === "custom") {
        const slug = slugify(m.csvColumn);
        m.targetField = `custom_${slug}`;
        m.customLabel = m.csvColumn; // use the original CSV column name as the display label
      } else {
        m.customLabel = null;
      }
    }

    // Ensure sampleValues are included (AI doesn't return these)
    for (let i = 0; i < headers.length; i++) {
      const m = mappings.find(x => x.csvColumn === headers[i]);
      if (m) {
        m.sampleValues = (sampleRows ?? [])
          .slice(0, 3)
          .map(row => (row[i] ?? "").trim())
          .filter(Boolean);
      }
    }

    // Guarantee category is assigned
    const hasCategoryMapping = mappings.some(m => m.targetField === "category" && m.approved !== false);
    if (!hasCategoryMapping && mappings.length > 0) {
      const candidate = mappings.find(m =>
        m.targetField !== "title" &&
        m.targetField !== "skip" &&
        m.approved !== false
      );
      if (candidate) {
        candidate.targetField = "category";
        candidate.customLabel = null;
      }
    }

    // Build custom field definitions from resolved custom_* mappings
    const customFieldDefs: Array<{ value: string; label: string; description: string }> = [];
    for (const m of mappings) {
      if (typeof m.targetField === "string" && m.targetField.startsWith("custom_") && m.customLabel) {
        if (!customFieldDefs.find(d => d.value === m.targetField)) {
          customFieldDefs.push({
            value: m.targetField,
            label: m.customLabel,
            description: `Custom section: ${m.customLabel}`,
          });
        }
      }
    }

    req.log.info({ headers: headers.length, customFields: customFieldDefs.length }, "AI map complete");
    res.json({ mappings, customFieldDefs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to run AI mapping" });
  }
});

// POST /api/import/analyze — parse headers + suggest mappings
router.post("/analyze", requireEditor, async (req, res) => {
  try {
    const { headers, sampleRows } = req.body as { headers: string[]; sampleRows: string[][] };
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      res.status(400).json({ error: "headers array is required" });
      return;
    }

    const mappings = headers.map((col, i) => {
      const { target, confidence } = suggestMapping(col);
      const sampleValues = (sampleRows ?? [])
        .slice(0, 3)
        .map(row => (row[i] ?? "").trim())
        .filter(Boolean);

      return {
        csvColumn: col,
        targetField: target,
        sampleValues,
        confidence,
        approved: target !== "skip",
      };
    });

    res.json({ mappings, availableFields: AVAILABLE_FIELDS });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to analyze CSV" });
  }
});

// POST /api/import/csv — start import with confirmed field mappings
router.post("/csv", requireEditor, async (req, res) => {
  try {
    const { csvContent, fieldMappings } = req.body as { csvContent: string; fieldMappings: FieldMapping[] };

    if (!csvContent || typeof csvContent !== "string" || !csvContent.trim()) {
      res.status(400).json({ error: "CSV content is required" });
      return;
    }

    if (Buffer.byteLength(csvContent, "utf8") > IMPORT_CSV_MAX_BYTES) {
      res.status(413).json({ error: `CSV content exceeds the ${IMPORT_CSV_MAX_BYTES / (1024 * 1024)} MB limit. Split the file and re-import.` });
      return;
    }

    if (!fieldMappings || !Array.isArray(fieldMappings) || fieldMappings.length === 0) {
      res.status(400).json({ error: "fieldMappings array is required" });
      return;
    }
    const hasTitleMapping = fieldMappings.some(m => m.approved && m.targetField === "title");
    if (!hasTitleMapping) {
      res.status(400).json({ error: "At least one column must be mapped to Title / Name" });
      return;
    }

    if (activeImportJobs >= IMPORT_MAX_CONCURRENT) {
      res.status(429).json({ error: `Too many imports in progress (max ${IMPORT_MAX_CONCURRENT}). Wait for an existing import to finish before starting a new one.` });
      return;
    }

    // Reserve the slot synchronously (before any await) so concurrent requests
    // that pass the check above cannot also start — no race window.
    activeImportJobs++;

    try {
      const jobId = randomUUID();
      const [job] = await db.insert(importJobs).values({
        jobId,
        status: "pending",
        message: "Import job queued",
      }).returning();

      processImport(jobId, csvContent, fieldMappings).catch(err =>
        logger.error(err, "processImport unhandled error")
      );

      res.json({
        jobId: job.jobId,
        status: job.status,
        message: job.message,
        progress: null,
        totalRows: null,
        processedRows: null,
        entriesCreated: null,
        categoriesCreated: null,
        error: null,
      });
    } catch (innerErr) {
      // processImport never started — release the reserved slot
      activeImportJobs--;
      throw innerErr;
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to start import" });
  }
});

// GET /api/import/status/:jobId
router.get("/status/:jobId", requireEditor, async (req, res) => {
  try {
    const [job] = await db.select().from(importJobs).where(eq(importJobs.jobId, req.params.jobId)).limit(1);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json({
      jobId: job.jobId,
      status: job.status,
      message: job.message,
      progress: job.progress,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      entriesCreated: job.entriesCreated,
      categoriesCreated: job.categoriesCreated,
      error: job.error,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get import status" });
  }
});

export default router;
