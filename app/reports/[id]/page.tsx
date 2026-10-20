"use client";

import { use } from "react";
import Link from "next/link";
import { useRequireProfile, useReport, useToggleTreatmentItem } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { formatDate, urgencyLabel, urgencyTone } from "@/lib/format";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: report, isLoading: reportLoading } = useReport(id);
  const toggleItem = useToggleTreatmentItem();

  if (isLoading || !user || reportLoading || !report) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={`${report.animal.type}${report.animal.tag ? `, ${report.animal.tag}` : ""}`}
        subtitle={`Reported ${formatDate(report.created_at)}`}
        backHref="/reports"
      />
      <div className="space-y-4 px-5 pb-10 md:max-w-2xl md:px-0">
        {report.status === "pending" ? (
          <Card className="border-warning/30 bg-warning-bg">
            <p className="font-semibold text-warning">Awaiting vet review</p>
            <p className="mt-1 text-sm text-warning/80">
              A veterinarian will review your photos and symptoms and get back to you here.
            </p>
          </Card>
        ) : (
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">Urgency</p>
              <Badge tone={urgencyTone(report.urgency)}>{urgencyLabel(report.urgency)}</Badge>
            </div>
            <p className="text-sm font-bold text-navy">{report.diagnosis}</p>
            {report.vet_notes && <p className="text-sm text-muted">{report.vet_notes}</p>}
          </Card>
        )}

        {report.photos.length > 0 && (
          <div>
            <h2 className="mb-2 px-1 text-sm font-semibold text-navy">Photos</h2>
            <div className="flex gap-2 overflow-x-auto">
              {report.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={`/uploads/${photo.filename}`}
                  alt="Reported animal"
                  className="h-24 w-24 flex-none rounded-xl object-cover"
                />
              ))}
            </div>
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

        {report.status === "reviewed" && (
          <div>
            <h2 className="mb-2 px-1 text-sm font-semibold text-navy">Treatment plan</h2>
            <Card className="divide-y divide-border p-0">
              {report.treatment_items.map((item, index) => (
                <label key={index} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => toggleItem.mutate({ reportId: report.id, index, done: e.target.checked })}
                    className="h-4 w-4 accent-teal"
                  />
                  <span className={`text-sm ${item.done ? "text-muted line-through" : "text-navy"}`}>{item.text}</span>
                </label>
              ))}
            </Card>
          </div>
        )}

        {report.status === "reviewed" && report.next_check_date && (
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-navy">Next check</p>
              <p className="text-sm text-muted">{report.next_check_date}</p>
            </div>
          </Card>
        )}

        <Link href="/vets">
          <Button variant="secondary" className="w-full">
            Contact a Veterinarian
          </Button>
        </Link>
      </div>
    </div>
  );
}
