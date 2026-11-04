import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import type { Urgency } from "@/lib/types";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 82;

async function resizeForGemini(photo: { data: Buffer; mimeType: string }): Promise<{ data: Buffer; mimeType: string }> {
  try {
    const data = await sharp(photo.data)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    return { data, mimeType: "image/jpeg" };
  } catch (err) {
    console.error("Failed to resize photo for AI scan, sending original:", err);
    return photo;
  }
}

export interface AiAssessment {
  summary: string;
  possible_conditions: string[];
  urgency_hint: Urgency;
  notable_observations: string[];
}

const URGENCY_VALUES: Urgency[] = ["monitor", "see_vet_soon", "within_24h"];

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    possible_conditions: { type: "array", items: { type: "string" } },
    urgency_hint: { type: "string", enum: URGENCY_VALUES },
    notable_observations: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "possible_conditions", "urgency_hint", "notable_observations"],
};

const SYSTEM_INSTRUCTION = `You are assisting a veterinarian who reviews livestock health reports submitted by smallholder farmers.
Look at the attached photo(s) of the animal together with the farmer's notes (if any), then give a brief, practical preliminary visual assessment.
This is NOT a diagnosis — a licensed veterinarian will always review the case before any treatment.
Keep it concise: a busy vet should be able to scan your response in seconds before doing their own review.
Respond only with JSON matching the required schema.`;

export interface AnalyzeAnimalPhotosInput {
  animalType: string;
  breed?: string | null;
  description?: string;
  onset?: string;
  eating?: string;
  drinking?: string;
  movement?: string;
  fever?: boolean;
  lessMilk?: boolean;
  photos: { data: Buffer; mimeType: string }[];
}

export interface AnalyzeAnimalPhotosResult {
  assessment: AiAssessment | null;
  /** Human-readable reason, set whenever assessment is null. */
  message?: string;
}

function describeGeminiError(err: unknown): string {
  const statusCode = (err as { statusCode?: number } | undefined)?.statusCode;
  const code = (err as { error?: { code?: string } } | undefined)?.error?.code;
  const retryAfter = (err as { headers?: Headers } | undefined)?.headers?.get?.("retry-after");
  const retrySuffix = retryAfter ? ` Try again in about ${retryAfter} seconds.` : " Please try again shortly.";

  if (statusCode === 503 || code === "service_unavailable") {
    return `Gemini is experiencing high demand right now.${retrySuffix}`;
  }
  if (statusCode === 429 || code === "rate_limit_exceeded") {
    return `AI scan rate limit reached.${retrySuffix}`;
  }
  if (statusCode === 408 || (err instanceof Error && err.name === "APIConnectionTimeoutError")) {
    return "The AI scan took too long to respond and was cancelled. Please try again.";
  }
  if (statusCode === 404) {
    return "The configured AI model is unavailable. Contact the app administrator.";
  }
  return "AI scan failed unexpectedly. Please try again.";
}

export async function analyzeAnimalPhotos(input: AnalyzeAnimalPhotosInput): Promise<AnalyzeAnimalPhotosResult> {
  if (input.photos.length === 0) return { assessment: null };
  const ai = getClient();
  if (!ai) return { assessment: null, message: "AI scanning isn't configured (missing GEMINI_API_KEY)." };

  const reportLines = [
    `- Animal: ${input.breed ? `${input.breed} ` : ""}${input.animalType}`,
    input.description && `- Description: ${input.description}`,
    input.onset && `- Symptom onset: ${input.onset}`,
    input.eating && `- Eating: ${input.eating}`,
    input.drinking && `- Drinking: ${input.drinking}`,
    input.movement && `- Movement: ${input.movement}`,
    input.fever !== undefined && `- Fever or feels hot: ${input.fever ? "yes" : "no"}`,
    input.lessMilk !== undefined && `- Less milk than usual: ${input.lessMilk ? "yes" : "no"}`,
  ].filter(Boolean);

  const promptText = `Farmer's report:\n${reportLines.join("\n")}`;

  try {
    const resizedPhotos = await Promise.all(input.photos.map(resizeForGemini));

    const interaction = await ai.interactions.create(
      {
        model: "gemini-3.8-flash",
        store: false,
        system_instruction: SYSTEM_INSTRUCTION,
        input: [
          { type: "text", text: promptText },
          ...resizedPhotos.map((photo) => ({
            type: "image" as const,
            data: photo.data.toString("base64"),
            mime_type: photo.mimeType,
          })),
        ],
        generation_config: {
          thinking_level: "low",
          max_output_tokens: 512,
        },
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: RESPONSE_SCHEMA,
        },
      },
      {
        timeout_ms: 45_000,
        retries: { strategy: "attempt-count-backoff", maxRetries: 1 },
      }
    );

    const text = interaction.output_text;
    if (!text) return { assessment: null, message: "AI scan returned an empty response. Please try again." };

    const parsed = JSON.parse(text) as AiAssessment;
    if (!URGENCY_VALUES.includes(parsed.urgency_hint)) {
      return { assessment: null, message: "AI scan returned an unexpected response. Please try again." };
    }
    return { assessment: parsed };
  } catch (err) {
    console.error("Gemini image analysis failed:", err);
    return { assessment: null, message: describeGeminiError(err) };
  }
}
