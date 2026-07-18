import { GoogleGenAI } from "@google/genai";

// The directory must boot without an optional AI provider. Routes that need AI
// fail closed at invocation time with a configuration error.
const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

export const ai: GoogleGenAI | null = baseUrl && apiKey
  ? new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "", baseUrl } })
  : null;
