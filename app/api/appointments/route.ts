import { NextRequest } from "next/server";
import { db, newId, nowIso } from "@/lib/db";
import type { Animal, Appointment, AppointmentWithExtras, User } from "@/lib/types";

function withExtras(appt: Appointment): AppointmentWithExtras {
  const vet = db.prepare("SELECT * FROM users WHERE id = ?").get(appt.vet_id) as unknown as User;
  const farmer = db.prepare("SELECT * FROM users WHERE id = ?").get(appt.farmer_id) as unknown as User;
  const animal = appt.animal_id
    ? (db.prepare("SELECT * FROM animals WHERE id = ?").get(appt.animal_id) as unknown as Animal | undefined) ?? null
    : null;
  return { ...appt, vet, farmer, animal };
}

export async function GET(req: NextRequest) {
  const farmerId = req.nextUrl.searchParams.get("farmerId");
  const vetId = req.nextUrl.searchParams.get("vetId");

  let sql = "SELECT * FROM appointments WHERE 1 = 1";
  const params: string[] = [];
  if (farmerId) {
    sql += " AND farmer_id = ?";
    params.push(farmerId);
  }
  if (vetId) {
    sql += " AND vet_id = ?";
    params.push(vetId);
  }
  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params) as unknown as Appointment[];
  return Response.json(rows.map(withExtras));
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Appointment>;
  if (!body.farmer_id || !body.vet_id || !body.kind) {
    return Response.json({ error: "farmer_id, vet_id and kind are required" }, { status: 400 });
  }

  const appt: Appointment = {
    id: newId(),
    farmer_id: body.farmer_id,
    vet_id: body.vet_id,
    animal_id: body.animal_id ?? null,
    kind: body.kind,
    message: body.message ?? null,
    status: "requested",
    scheduled_at: body.scheduled_at ?? null,
    created_at: nowIso(),
  };

  db.prepare(
    `INSERT INTO appointments (id, farmer_id, vet_id, animal_id, kind, message, status, scheduled_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    appt.id,
    appt.farmer_id,
    appt.vet_id,
    appt.animal_id,
    appt.kind,
    appt.message,
    appt.status,
    appt.scheduled_at,
    appt.created_at
  );

  return Response.json(withExtras(appt), { status: 201 });
}
