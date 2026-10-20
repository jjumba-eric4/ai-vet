"use client";

import { use } from "react";
import Link from "next/link";
import { useRequireProfile, useAnimal } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
import { urgencyLabel, urgencyTone } from "@/lib/format";

export default function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: animal, isLoading: animalLoading } = useAnimal(id);

  if (isLoading || !user || animalLoading || !animal) return <Spinner />;

  return (
    <div>
      <PageHeader title={`${animal.type}${animal.tag ? `, ${animal.tag}` : ""}`} backHref="/animals" />
      <div className="space-y-4 px-5 pb-10 md:max-w-2xl md:px-0">
        <Card className="space-y-3">
          <Row label="Breed" value={animal.breed} />
          <Row label="Age" value={animal.age} />
          <Row label="Sex" value={animal.sex} />
          <Row label="Farm location" value={animal.farm_location} />
        </Card>

        <Link href={`/report/new/${animal.id}`}>
          <Button variant="secondary" className="w-full">
            Report a health problem
          </Button>
        </Link>

        <div>
          <h2 className="mb-2 px-1 text-sm font-semibold text-navy">Health history</h2>
          {animal.reports.length === 0 ? (
            <EmptyState title="No reports yet" body="Health reports for this animal will show up here." />
          ) : (
            <div className="space-y-3">
              {animal.reports.map((report) => (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <Card>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-navy">
                        {new Date(report.created_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {report.status === "pending" ? (
                        <Badge tone="warning">Awaiting vet review</Badge>
                      ) : (
                        <Badge tone={urgencyTone(report.urgency)}>{urgencyLabel(report.urgency)}</Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted">{report.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-navy">{value}</span>
    </div>
  );
}
