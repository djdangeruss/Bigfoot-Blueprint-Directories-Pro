import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { directorySettings } from "@workspace/db";
import { ai as defaultAi } from "@workspace/integrations-gemini-ai";

/**
 * Returns a GoogleGenAI client.
 * If the admin has stored their own Gemini API key in the DB, that key is used
 * (direct Google AI endpoint, no Replit proxy). Otherwise the default Replit
 * integration client is returned.
 */
export async function getGeminiClient(): Promise<GoogleGenAI> {
  try {
    const [settings] = await db
      .select({ geminiApiKey: directorySettings.geminiApiKey })
      .from(directorySettings)
      .limit(1);
    if (settings?.geminiApiKey) {
      return new GoogleGenAI({ apiKey: settings.geminiApiKey });
    }
  } catch {
    // Fall through to default
  }
  return defaultAi;
}
