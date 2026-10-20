"use client";

import Link from "next/link";
import { useRequireProfile, useReports } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui";
import { urgencyLabel, urgencyTone } from "@/lib/format";

export default function ReportsPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: reports, isLoading: reportsLoading } = useReports({ farmerId: user?.id });

  if (isLoading || !user) return <Spinner />;

  return (
    <div>
      <PageHeader title="Health Records" backHref="/home" />
      <div className="px-5 md:px-0">
        {reportsLoading && <Spinner />}
        {!reportsLoading && reports?.length === 0 && (
          <EmptyState title="No health records yet" body="Reports you submit for your animals will appear here." />
        )}
      </div>
      <div className="space-y-3 px-5 pb-10 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:px-0 lg:grid-cols-3">
        {reports?.map((report) => (
          <Link key={report.id} href={`/reports/${report.id}`}>
            <Card>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy">
                  {report.animal.type}
                  {report.animal.tag ? `, ${report.animal.tag}` : ""}
                </p>
                {report.status === "pending" ? (
                  <Badge tone="warning">Awaiting vet review</Badge>
                ) : (
                  <Badge tone={urgencyTone(report.urgency)}>{urgencyLabel(report.urgency)}</Badge>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-muted">{report.description}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(report.created_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
