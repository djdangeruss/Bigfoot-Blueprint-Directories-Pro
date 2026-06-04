import { Router } from "express";
import { requireAdmin } from "../middlewares/auth.js";
import { getGeminiClient } from "../lib/gemini.js";
import { db } from "@workspace/db";
import { categories as categoriesTable } from "@workspace/db";

const router = Router();

function extractJsonArray(text: string): any[] | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenceMatch ? fenceMatch[1] : text).trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

// POST /api/builder/ai-enhance — Gemini-powered homepage redesign
router.post("/ai-enhance", requireAdmin, async (req, res) => {
  try {
    const { sections, siteTitle } = req.body as {
      sections: any[];
      siteTitle?: string;
    };

    if (!sections || !Array.isArray(sections)) {
      res.status(400).json({ error: "sections array is required" });
      return;
    }

    const cats = await db.select({ name: categoriesTable.name }).from(categoriesTable).limit(20);
    const categoryNames = cats.map(c => c.name);
    const categoriesStr = categoryNames.length > 0
      ? categoryNames.join(", ")
      : "General, Business, Services, Technology";
    const title = siteTitle || "Directory";

    const prompt = `You are a world-class web designer and SEO copywriter redesigning a directory website's homepage for maximum visual impact and search engine optimization.

DIRECTORY CONTEXT:
- Site Title: "${title}"
- Categories: ${categoriesStr}

CURRENT HOMEPAGE SECTIONS (JSON):
${JSON.stringify(sections, null, 2)}

YOUR TASK: Return an enhanced JSON array replacing those sections with a sophisticated, modern design.

ENHANCEMENT RULES:

1. HERO SECTION (id: "hero") — Bold & eye-catching:
   - Write a powerful headline directly referencing what "${title}" offers
   - Write a 1-sentence SEO subtitle explaining who the directory serves
   - backgroundColor: pick a rich dark tone (e.g. deep navy "#0f172a", dark slate "#1e293b", deep indigo "#312e81") — NOT white or light grey
   - headingFontSize: "2.25rem" or larger
   - headingColor: "#ffffff"
   - textColor: "#e2e8f0"
   - textAlignment: "center"
   - padding: "lg"
   - overlayOpacity: 0 (no overlay since no image)
   - Add a CTA: buttonText "Explore Listings", buttonUrl "/browse", buttonColor "#6366f1"

2. SECTION HEADINGS — Replace all generic headings with specific, compelling copy:
   - categories: "Explore by Category" (or more specific based on the site title)
   - featured: "Editor's Picks" (or "Top-Rated Listings")
   - recent: "Just Added" (or "Newly Listed")
   Set headingFontSize: "1.5rem" on each.

3. INTRO TEXT SECTION — Insert one custom-text section immediately AFTER the hero:
   - id: "custom-text-intro"
   - type: "custom-text"
   - label: "Intro Text"
   - enabled: true
   - heading: a short H2 heading about the directory purpose
   - props.richBodyText: 2–3 paragraphs of HTML (<p> tags) explaining what "${title}" is, who it serves, and why it's valuable — naturally weaving in keywords from the category list
   - props.backgroundColor: "#f8fafc"
   - props.textAlignment: "center"
   - props.headingFontSize: "1.875rem"
   - props.headingColor: "#0f172a"
   - props.bodyFontSize: "1rem"
   - props.textColor: "#475569"

4. CTA SECTION — Insert one custom-text section at the VERY END (after recent):
   - id: "custom-text-cta"
   - type: "custom-text"
   - label: "Call to Action"
   - enabled: true
   - heading: an inviting headline to submit or explore more
   - props.richBodyText: 1–2 sentences of HTML encouraging the user to browse or submit a listing
   - props.backgroundColor: "#0f172a"
   - props.textAlignment: "center"
   - props.headingFontSize: "1.875rem"
   - props.headingColor: "#ffffff"
   - props.textColor: "#94a3b8"
   - props.bodyFontSize: "1rem"

FINAL SECTION ORDER: hero → custom-text-intro → categories → featured → recent → custom-text-cta

RULES:
- Preserve the exact IDs "hero", "categories", "featured", "recent"
- custom-text sections MUST include BOTH "type": "custom-text" AND a unique "id"
- Every section must have "enabled": true
- richBodyText must be a valid HTML string (no unescaped quotes inside the JSON)
- Return ONLY a raw JSON array — no markdown, no explanation, no extra text

Respond with ONLY the valid JSON array of SectionConfig objects.`;

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

    const parsed = extractJsonArray(text);
    if (!parsed) {
      req.log.error({ text: text.slice(0, 500) }, "AI returned invalid JSON array");
      res.status(500).json({ error: "AI returned an invalid response — please try again" });
      return;
    }

    req.log.info({ sectionCount: parsed.length }, "AI homepage enhancement complete");
    res.json({ sections: parsed });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "AI enhancement failed" });
  }
});

export default router;
