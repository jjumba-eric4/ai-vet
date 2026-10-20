import { db } from "@/lib/db";
import type { Appointment, AppointmentStatus } from "@/lib/types";

export async function PATCH(req: Request, ctx: RouteContext<"/api/appointments/[id]">) {
  const { id } = await ctx.params;
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as unknown as Appointment | undefined;
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { status?: AppointmentStatus; scheduled_at?: string | null };

  db.prepare("UPDATE appointments SET status = ?, scheduled_at = ? WHERE id = ?").run(
    body.status ?? existing.status,
    body.scheduled_at !== undefined ? body.scheduled_at : existing.scheduled_at,
    id
  );

  const updated = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as unknown as Appointment;
  return Response.json(updated);
}
