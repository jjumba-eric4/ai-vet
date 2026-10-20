import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { User } from "@/lib/types";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  const rows = role
    ? (db.prepare("SELECT * FROM users WHERE role = ? ORDER BY name").all(role) as unknown as User[])
    : (db.prepare("SELECT * FROM users ORDER BY role, name").all() as unknown as User[]);
  return Response.json(rows);
}
