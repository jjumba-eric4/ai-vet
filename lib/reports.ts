import { db } from "@/lib/db";
import type { Animal, HealthReport, HealthReportWithExtras, ReportPhoto, TreatmentItem } from "@/lib/types";

export function withExtras(report: HealthReport): HealthReportWithExtras {
  const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(report.animal_id) as unknown as Animal;
  const photos = db
    .prepare("SELECT * FROM report_photos WHERE report_id = ? ORDER BY created_at")
    .all(report.id) as unknown as ReportPhoto[];
  const treatment_items: TreatmentItem[] = report.treatment_plan
    ? (JSON.parse(report.treatment_plan) as TreatmentItem[])
    : [];

  return { ...report, animal, photos, treatment_items };
}
