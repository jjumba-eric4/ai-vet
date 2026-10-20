import { db } from "@/lib/db";
import type { HealthReport, TreatmentItem } from "@/lib/types";

export async function PATCH(req: Request, ctx: RouteContext<"/api/reports/[id]/treatment-item">) {
  const { id } = await ctx.params;
  const report = db.prepare("SELECT * FROM health_reports WHERE id = ?").get(id) as unknown as HealthReport | undefined;
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { index: number; done: boolean };
  const items: TreatmentItem[] = report.treatment_plan ? JSON.parse(report.treatment_plan) : [];
  if (!items[body.index]) return Response.json({ error: "Invalid index" }, { status: 400 });

  items[body.index] = { ...items[body.index], done: body.done };
  db.prepare("UPDATE health_reports SET treatment_plan = ? WHERE id = ?").run(JSON.stringify(items), id);

  return Response.json({ treatment_items: items });
}
