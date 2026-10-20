import { NextRequest } from "next/server";
import { db, newId, nowIso } from "@/lib/db";
import type { Animal } from "@/lib/types";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const rows = ownerId
    ? (db.prepare("SELECT * FROM animals WHERE owner_id = ? ORDER BY created_at DESC").all(ownerId) as unknown as Animal[])
    : (db.prepare("SELECT * FROM animals ORDER BY created_at DESC").all() as unknown as Animal[]);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Animal>;
  if (!body.owner_id || !body.type) {
    return Response.json({ error: "owner_id and type are required" }, { status: 400 });
  }

  const animal: Animal = {
    id: newId(),
    owner_id: body.owner_id,
    type: body.type,
    breed: body.breed ?? null,
    age: body.age ?? null,
    sex: body.sex ?? null,
    tag: body.tag ?? null,
    farm_location: body.farm_location ?? null,
    created_at: nowIso(),
  };

  db.prepare(
    `INSERT INTO animals (id, owner_id, type, breed, age, sex, tag, farm_location, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    animal.id,
    animal.owner_id,
    animal.type,
    animal.breed,
    animal.age,
    animal.sex,
    animal.tag,
    animal.farm_location,
    animal.created_at
  );

  return Response.json(animal, { status: 201 });
}
