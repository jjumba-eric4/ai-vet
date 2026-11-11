import sharp from "sharp";
import type { IdentificationConfidence, Urgency } from "@/lib/types";

// Measured directly against the server: prompt_eval_count is identical (1058 tokens) whether
// photos are resized to 896px, 640px, or 256px — llama.cpp's Qwen3-VL vision path resizes to a
// fixed canonical size internally, so downscaling further buys no speed, only loses detail.
const MAX_DIMENSION = 896;
const JPEG_QUALITY = 78;
// Each extra photo adds its own ~75-80s prefill chunk to the same request (measured). One photo
// takes ~90-100s total, safely under the timeout below; two already risks exceeding it. All
// uploaded photos still get stored/shown to the vet — this only limits what the AI call analyzes.
const MAX_AI_PHOTOS = 1;
// CPU-hosted vision models are slow, especially on a cold model load — give it real room.
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 180_000;

async function resizeForVisionModel(photo: { data: Buffer; mimeType: string }): Promise<{ data: Buffer; mimeType: string }> {
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
  identified_animal: {
    species: string;
    breed: string | null;
    confidence: IdentificationConfidence;
  };
}

const URGENCY_VALUES: Urgency[] = ["monitor", "see_vet_soon", "within_24h"];
const CONFIDENCE_VALUES: IdentificationConfidence[] = ["low", "medium", "high"];

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    possible_conditions: { type: "array", items: { type: "string" } },
    urgency_hint: { type: "string", enum: URGENCY_VALUES },
    notable_observations: { type: "array", items: { type: "string" } },
    identified_animal: {
      type: "object",
      properties: {
        species: { type: "string" },
        breed: { type: ["string", "null"] },
        confidence: { type: "string", enum: CONFIDENCE_VALUES },
      },
      required: ["species", "breed", "confidence"],
    },
  },
  required: ["summary", "possible_conditions", "urgency_hint", "notable_observations", "identified_animal"],
};

// Validates and re-constructs a client-supplied assessment (e.g. carried over from an earlier
// /api/scan call) into a clean object, rather than trusting arbitrary JSON from the request body.
export function sanitizeClientAssessment(raw: unknown): AiAssessment | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const identified = r.identified_animal as Record<string, unknown> | undefined;

  if (
    typeof r.summary !== "string" ||
    !Array.isArray(r.possible_conditions) ||
    !r.possible_conditions.every((c) => typeof c === "string") ||
    typeof r.urgency_hint !== "string" ||
    !URGENCY_VALUES.includes(r.urgency_hint as Urgency) ||
    !Array.isArray(r.notable_observations) ||
    !r.notable_observations.every((o) => typeof o === "string") ||
    typeof identified !== "object" ||
    identified === null ||
    typeof identified.species !== "string" ||
    (identified.breed !== null && typeof identified.breed !== "string") ||
    typeof identified.confidence !== "string" ||
    !CONFIDENCE_VALUES.includes(identified.confidence as IdentificationConfidence)
  ) {
    return null;
  }

  return {
    summary: r.summary,
    possible_conditions: r.possible_conditions as string[],
    urgency_hint: r.urgency_hint as Urgency,
    notable_observations: r.notable_observations as string[],
    identified_animal: {
      species: identified.species,
      breed: identified.breed as string | null,
      confidence: identified.confidence as IdentificationConfidence,
    },
  };
}

const SYSTEM_INSTRUCTION = `You are assisting a veterinarian who reviews livestock health reports submitted by smallholder farmers.
Look at the attached photo(s) of the animal together with the farmer's notes (if any), then give a brief, practical preliminary visual assessment.
Also identify the animal species (and breed if you can tell) purely from what you see in the photo — this helps catch cases where the farmer picked the wrong animal record.
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

function describeOllamaError(err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") {
    return "The AI scan took too long to respond and was cancelled. Please try again.";
  }
  if (err instanceof TypeError) {
    return "Couldn't reach the AI model server. Contact the app administrator.";
  }
  return "AI scan failed unexpectedly. Please try again.";
}

export async function analyzeAnimalPhotos(input: AnalyzeAnimalPhotosInput): Promise<AnalyzeAnimalPhotosResult> {
  if (input.photos.length === 0) return { assessment: null };

  const baseUrl = process.env.OLLAMA_URL;
  const model = process.env.OLLAMA_MODEL;
  if (!baseUrl || !model) {
    return { assessment: null, message: "AI scanning isn't configured (missing OLLAMA_URL or OLLAMA_MODEL)." };
  }

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resizedPhotos = await Promise.all(input.photos.slice(0, MAX_AI_PHOTOS).map(resizeForVisionModel));

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: promptText,
            images: resizedPhotos.map((photo) => photo.data.toString("base64")),
          },
        ],
        format: RESPONSE_SCHEMA,
        // Use the "-instruct" tag, not "-thinking" — the thinking variant burns
        // num_predict (and CPU time) on hidden reasoning before emitting JSON,
        // which was causing empty responses and request timeouts. think: false
        // is kept as a guard in case OLLAMA_MODEL ever points at a thinking build.
        think: false,
        // Keep the model resident between requests — otherwise Ollama's default
        // 5-minute idle unload forces a full reload from disk on every scan.
        keep_alive: "30m",
        options: {
          num_predict: 1024,
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Ollama request failed (${res.status}): ${body}`);
      return { assessment: null, message: "AI scan failed unexpectedly. Please try again." };
    }

    const data = (await res.json()) as { message?: { content?: string; thinking?: string }; done_reason?: string };
    const text = data.message?.content;
    if (!text) {
      console.error(
        `Ollama returned empty content (done_reason=${data.done_reason ?? "unknown"}); thinking=${data.message?.thinking?.slice(0, 500) ?? "none"}`
      );
      return { assessment: null, message: "AI scan returned an empty response. Please try again." };
    }

    const parsed = JSON.parse(text) as AiAssessment;
    if (!URGENCY_VALUES.includes(parsed.urgency_hint)) {
      return { assessment: null, message: "AI scan returned an unexpected response. Please try again." };
    }
    return { assessment: parsed };
  } catch (err) {
    console.error("Ollama image analysis failed:", err);
    return { assessment: null, message: describeOllamaError(err) };
  } finally {
    clearTimeout(timeout);
  }
}

// Pings Ollama with no prompt so it loads (and keeps resident) the configured model, avoiding
// the cold-load penalty on a farmer's first scan after the server has been idle a while.
// This does NOT shorten the dominant cost of a scan (CPU image-encoding time) — only the load step.
export async function warmModel(): Promise<{ ok: boolean; message?: string }> {
  const baseUrl = process.env.OLLAMA_URL;
  const model = process.env.OLLAMA_MODEL;
  if (!baseUrl || !model) {
    return { ok: false, message: "AI scanning isn't configured (missing OLLAMA_URL or OLLAMA_MODEL)." };
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, keep_alive: "30m" }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, message: `Warm-up failed (${res.status}): ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Warm-up request failed" };
  }
}
