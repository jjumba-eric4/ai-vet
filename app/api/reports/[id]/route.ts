import { db, nowIso } from "@/lib/db";
import { withExtras } from "@/lib/reports";
import type { HealthReport, TreatmentItem, Urgency } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/reports/[id]">) {
  const { id } = await ctx.params;
  const report = db.prepare("SELECT * FROM health_reports WHERE id = ?").get(id) as unknown as HealthReport | undefined;
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(withExtras(report));
}

interface ReviewBody {
  vet_id: string;
  diagnosis: string;
  vet_notes?: string;
  urgency: Urgency;
  treatment_plan: TreatmentItem[];
  next_check_date?: string | null;
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/reports/[id]">) {
  const { id } = await ctx.params;
  const existing = db.prepare("SELECT * FROM health_reports WHERE id = ?").get(id) as unknown as HealthReport | undefined;
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as Partial<ReviewBody>;

  if (body.treatment_plan !== undefined || body.diagnosis !== undefined) {
    if (!body.vet_id || !body.diagnosis || !body.urgency) {
      return Response.json({ error: "vet_id, diagnosis and urgency are required" }, { status: 400 });
    }
    db.prepare(
      `UPDATE health_reports
       SET status = 'reviewed', vet_id = ?, diagnosis = ?, vet_notes = ?, urgency = ?, treatment_plan = ?, next_check_date = ?, reviewed_at = ?
       WHERE id = ?`
    ).run(
      body.vet_id,
      body.diagnosis,
      body.vet_notes ?? null,
      body.urgency,
      JSON.stringify(body.treatment_plan ?? []),
      body.next_check_date ?? null,
      nowIso(),
      id
    );
  }

  const updated = db.prepare("SELECT * FROM health_reports WHERE id = ?").get(id) as unknown as HealthReport;
  return Response.json(withExtras(updated));
}
