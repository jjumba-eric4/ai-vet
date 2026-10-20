"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequireProfile, useReports } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui";
import { urgencyLabel, urgencyTone } from "@/lib/format";

export default function VetReportsPage() {
  const { user, isLoading } = useRequireProfile("vet");
  const [tab, setTab] = useState<"pending" | "reviewed">("pending");
  const { data: pending, isLoading: pendingLoading } = useReports({ status: "pending" });
  const { data: reviewed, isLoading: reviewedLoading } = useReports({ vetId: user?.id, status: "reviewed" });

  if (isLoading || !user) return <Spinner />;

  const list = tab === "pending" ? pending : reviewed;
  const listLoading = tab === "pending" ? pendingLoading : reviewedLoading;

  return (
    <div>
      <PageHeader title="Reports" />
      <div className="px-5 md:px-0">
        <div className="mb-4 flex rounded-full bg-border/60 p-1 md:max-w-sm">
          <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
            Pending ({pending?.length ?? 0})
          </TabButton>
          <TabButton active={tab === "reviewed"} onClick={() => setTab("reviewed")}>
            Reviewed by you
          </TabButton>
        </div>

        <div className="space-y-3 pb-10 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
          {listLoading && <Spinner />}
          {!listLoading && list?.length === 0 && (
            <EmptyState title="Nothing here" body={tab === "pending" ? "No reports are waiting for review." : "You haven't reviewed any reports yet."} />
          )}
          {list?.map((report) => (
            <Link key={report.id} href={`/vet/reports/${report.id}`}>
              <Card>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">
                    {report.animal.type}
                    {report.animal.tag ? `, ${report.animal.tag}` : ""}
                  </p>
                  {report.status === "pending" ? (
                    <Badge tone="warning">Pending</Badge>
                  ) : (
                    <Badge tone={urgencyTone(report.urgency)}>{urgencyLabel(report.urgency)}</Badge>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-muted">{report.description}</p>
                <p className="mt-2 text-xs text-muted">
                  {new Date(report.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-xs font-semibold ${active ? "bg-card text-navy shadow-sm" : "text-muted"}`}
    >
      {children}
    </button>
  );
}
