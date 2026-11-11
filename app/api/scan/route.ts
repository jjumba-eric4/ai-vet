import { analyzeAnimalPhotos } from "@/lib/ollama";

export const maxDuration = 180;

export async function POST(req: Request) {
  const form = await req.formData();

  const note = form.get("note");
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return Response.json({ error: "Add at least one photo to scan" }, { status: 400 });
  }

  const photos = await Promise.all(
    files.map(async (file) => ({
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type || "image/jpeg",
    }))
  );

  const result = await analyzeAnimalPhotos({
    animalType: "animal",
    breed: null,
    description: typeof note === "string" && note.trim() ? note.trim() : undefined,
    photos,
  });

  if (!result.assessment) {
    return Response.json({ error: result.message ?? "AI scan failed. Please try again." }, { status: 503 });
  }

  return Response.json({ assessment: result.assessment });
}
