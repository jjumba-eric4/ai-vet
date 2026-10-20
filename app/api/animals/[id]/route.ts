import { db } from "@/lib/db";
import type { Animal, HealthReport } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/animals/[id]">) {
  const { id } = await ctx.params;
  const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(id) as unknown as Animal | undefined;
  if (!animal) return Response.json({ error: "Not found" }, { status: 404 });

  const reports = db
    .prepare("SELECT * FROM health_reports WHERE animal_id = ? ORDER BY created_at DESC")
    .all(id) as unknown as HealthReport[];

  return Response.json({ ...animal, reports });
}
