import { db } from "@/lib/db";
import { analyzeAnimalPhotos } from "@/lib/gemini";
import type { Animal } from "@/lib/types";

export async function POST(req: Request) {
  const form = await req.formData();

  const animalId = form.get("animal_id");
  const note = form.get("note");
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return Response.json({ error: "Add at least one photo to scan" }, { status: 400 });
  }

  let animal: Animal | undefined;
  if (typeof animalId === "string" && animalId) {
    animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(animalId) as unknown as Animal | undefined;
  }

  const photos = await Promise.all(
    files.map(async (file) => ({
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type || "image/jpeg",
    }))
  );

  const result = await analyzeAnimalPhotos({
    animalType: animal?.type ?? "animal",
    breed: animal?.breed ?? null,
    description: typeof note === "string" && note.trim() ? note.trim() : undefined,
    photos,
  });

  if (!result.assessment) {
    return Response.json({ error: result.message ?? "AI scan failed. Please try again." }, { status: 503 });
  }

  return Response.json({ assessment: result.assessment });
}
