import { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db, newId, nowIso } from "@/lib/db";
import { withExtras } from "@/lib/reports";
import { analyzeAnimalPhotos, sanitizeClientAssessment } from "@/lib/ollama";
import type { Animal, HealthReport } from "@/lib/types";

export const maxDuration = 180;

export async function GET(req: NextRequest) {
  const farmerId = req.nextUrl.searchParams.get("farmerId");
  const vetId = req.nextUrl.searchParams.get("vetId");
  const status = req.nextUrl.searchParams.get("status");

  let sql = "SELECT * FROM health_reports WHERE 1 = 1";
  const params: string[] = [];
  if (farmerId) {
    sql += " AND farmer_id = ?";
    params.push(farmerId);
  }
  if (vetId) {
    sql += " AND vet_id = ?";
    params.push(vetId);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params) as unknown as HealthReport[];
  return Response.json(rows.map(withExtras));
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
}

export async function POST(req: Request) {
  const form = await req.formData();

  const animal_id = form.get("animal_id");
  const farmer_id = form.get("farmer_id");
  const description = form.get("description");
  const onset = form.get("onset");
  const eating = form.get("eating");
  const drinking = form.get("drinking");
  const movement = form.get("movement");
  const fever = form.get("fever") === "true" ? 1 : 0;
  const less_milk = form.get("less_milk") === "true" ? 1 : 0;

  if (
    typeof animal_id !== "string" ||
    typeof farmer_id !== "string" ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof onset !== "string" ||
    typeof eating !== "string" ||
    typeof drinking !== "string" ||
    typeof movement !== "string"
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const reportId = newId();
  const created = nowIso();

  db.prepare(
    `INSERT INTO health_reports
      (id, animal_id, farmer_id, description, onset, eating, drinking, movement, fever, less_milk, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(reportId, animal_id, farmer_id, description, onset, eating, drinking, movement, fever, less_milk, created);

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photoBuffers: { data: Buffer; mimeType: string }[] = [];
  if (files.length > 0) {
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const insertPhoto = db.prepare(
      "INSERT INTO report_photos (id, report_id, filename, created_at) VALUES (?, ?, ?, ?)"
    );

    for (const file of files) {
      const filename = `${newId()}-${sanitizeFilename(file.name || "photo.jpg")}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(join(uploadDir, filename), bytes);
      insertPhoto.run(newId(), reportId, filename, nowIso());
      photoBuffers.push({ data: bytes, mimeType: file.type || "image/jpeg" });
    }
  }

  if (photoBuffers.length > 0) {
    // If the farmer already ran /api/scan on these exact photos, reuse that result instead of
    // paying for a second (slow, CPU-bound) AI pass.
    const carriedOver = sanitizeClientAssessment(
      (() => {
        try {
          const raw = form.get("ai_assessment");
          return typeof raw === "string" ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })()
    );

    if (carriedOver) {
      db.prepare("UPDATE health_reports SET ai_summary = ? WHERE id = ?").run(JSON.stringify(carriedOver), reportId);
    } else {
      const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(animal_id) as unknown as Animal | undefined;
      const result = await analyzeAnimalPhotos({
        animalType: animal?.type ?? "animal",
        breed: animal?.breed ?? null,
        description,
        onset,
        eating,
        drinking,
        movement,
        fever: fever === 1,
        lessMilk: less_milk === 1,
        photos: photoBuffers,
      });
      if (result.assessment) {
        db.prepare("UPDATE health_reports SET ai_summary = ? WHERE id = ?").run(
          JSON.stringify(result.assessment),
          reportId
        );
      } else if (result.message) {
        console.error(`AI scan skipped for report ${reportId}: ${result.message}`);
      }
    }
  }

  const report = db.prepare("SELECT * FROM health_reports WHERE id = ?").get(reportId) as unknown as HealthReport;
  return Response.json(withExtras(report), { status: 201 });
}
