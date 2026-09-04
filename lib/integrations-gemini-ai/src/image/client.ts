import { GoogleGenAI, Modality } from "@google/genai";

const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

export const ai: GoogleGenAI | null = baseUrl && apiKey
  ? new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "", baseUrl } })
  : null;

export async function generateImage(
  prompt: string
): Promise<{ b64_json: string; mimeType: string }> {
  if (!ai) throw new Error("Gemini image integration is not configured");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  return {
    b64_json: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}
