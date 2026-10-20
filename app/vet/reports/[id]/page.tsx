"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireProfile, useReport, useReviewReport } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, Field, Spinner, inputClass } from "@/components/ui";
import { formatDate, urgencyLabel, urgencyTone } from "@/lib/format";
import type { Urgency } from "@/lib/types";

const URGENCIES: { value: Urgency; label: string }[] = [
  { value: "monitor", label: "Monitor" },
  { value: "see_vet_soon", label: "See vet soon" },
  { value: "within_24h", label: "Within 24 hours" },
];

export default function VetReportReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading } = useRequireProfile("vet");
  const { data: report, isLoading: reportLoading } = useReport(id);
  const reviewReport = useReviewReport();

  const [diagnosis, setDiagnosis] = useState("");
  const [vetNotes, setVetNotes] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("see_vet_soon");
  const [items, setItems] = useState<string[]>([""]);
  const [nextCheck, setNextCheck] = useState("");

  if (isLoading || !user || reportLoading || !report) return <Spinner />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !diagnosis.trim()) return;
    await reviewReport.mutateAsync({
      id,
      input: {
        vet_id: user.id,
        diagnosis: diagnosis.trim(),
        vet_notes: vetNotes.trim() || undefined,
        urgency,
        treatment_plan: items.filter((t) => t.trim()).map((t) => ({ text: t.trim(), done: false })),
        next_check_date: nextCheck || null,
      },
    });
    router.push("/vet/reports");
  }

  return (
    <div>
      <PageHeader
        title={`${report.animal.type}${report.animal.tag ? `, ${report.animal.tag}` : ""}`}
        subtitle={`Reported ${formatDate(report.created_at)}`}
        backHref="/vet/reports"
      />
      <div className="space-y-4 px-5 pb-10 md:max-w-2xl md:px-0">
        <Card className="space-y-2 text-sm">
          <Row label="Breed" value={[report.animal.breed, report.animal.sex, report.animal.age].filter(Boolean).join(", ")} />
          <Row label="Farm location" value={report.animal.farm_location} />
        </Card>

        {report.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {report.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={`/uploads/${photo.filename}`} alt="Reported animal" className="h-28 w-28 flex-none rounded-xl object-cover" />
            ))}
          </div>
        )}

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-navy">Reported symptoms</h2>
          <p className="text-sm text-muted">{report.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted">
            <span>Onset: {report.onset}</span>
            <span>Eating: {report.eating}</span>
            <span>Drinking: {report.drinking}</span>
            <span>Movement: {report.movement}</span>
            {report.fever === 1 && <span>Fever or feels hot</span>}
            {report.less_milk === 1 && <span>Less milk than usual</span>}
          </div>
        </Card>

        {report.status === "reviewed" ? (
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">Your assessment</p>
              <Badge tone={urgencyTone(report.urgency)}>{urgencyLabel(report.urgency)}</Badge>
            </div>
            <p className="text-sm font-bold text-navy">{report.diagnosis}</p>
            {report.vet_notes && <p className="text-sm text-muted">{report.vet_notes}</p>}
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {report.treatment_items.map((item, i) => (
                <li key={i}>• {item.text}</li>
              ))}
            </ul>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Diagnosis">
              <input
                className={inputClass}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Lumpy skin disease"
              />
            </Field>

            <Field label="Urgency">
              <div className="flex gap-2">
                {URGENCIES.map((u) => (
                  <button
                    type="button"
                    key={u.value}
                    onClick={() => setUrgency(u.value)}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium ${
                      urgency === u.value ? "bg-navy text-white" : "border border-border text-navy"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Notes for the farmer">
              <textarea
                className={`${inputClass} min-h-20 resize-none`}
                value={vetNotes}
                onChange={(e) => setVetNotes(e.target.value)}
                placeholder="e.g. Keep the animal apart from the herd."
              />
            </Field>

            <Field label="Treatment plan">
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={inputClass}
                      value={item}
                      onChange={(e) => setItems(items.map((it, idx) => (idx === i ? e.target.value : it)))}
                      placeholder="e.g. Oxytetracycline 20mg/kg, morning and evening for 5 days"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                        className="text-muted"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setItems([...items, ""])}
                  className="text-sm font-medium text-teal-dark"
                >
                  + Add step
                </button>
              </div>
            </Field>

            <Field label="Next check date (optional)">
              <input type="date" className={inputClass} value={nextCheck} onChange={(e) => setNextCheck(e.target.value)} />
            </Field>

            <Button type="submit" variant="secondary" className="w-full" disabled={!diagnosis.trim() || reviewReport.isPending}>
              {reviewReport.isPending ? "Submitting…" : "Submit Review"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}
