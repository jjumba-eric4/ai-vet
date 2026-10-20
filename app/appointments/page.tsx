"use client";

import { useRequireProfile, useAppointments, useUpdateAppointmentStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
import { appointmentKindLabel, formatDateTime } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

function statusTone(status: AppointmentStatus) {
  if (status === "confirmed") return "teal" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "completed") return "muted" as const;
  return "warning" as const;
}

export default function AppointmentsPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: appointments, isLoading: apptsLoading } = useAppointments({ farmerId: user?.id });
  const updateStatus = useUpdateAppointmentStatus();

  if (isLoading || !user) return <Spinner />;

  return (
    <div>
      <PageHeader title="Appointments" backHref="/home" />
      <div className="px-5 md:px-0">
        {apptsLoading && <Spinner />}
        {!apptsLoading && appointments?.length === 0 && (
          <EmptyState title="No appointments yet" body="Requests you send to a veterinarian will show up here." />
        )}
      </div>
      <div className="space-y-3 px-5 pb-10 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:px-0 lg:grid-cols-3">
        {appointments?.map((appt) => (
          <Card key={appt.id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="font-semibold text-navy">{appt.vet.name}</p>
              <Badge tone={statusTone(appt.status)}>{appt.status}</Badge>
            </div>
            <p className="text-sm text-muted">{appointmentKindLabel(appt.kind)}</p>
            {appt.scheduled_at && <p className="text-sm text-muted">{formatDateTime(appt.scheduled_at)}</p>}
            {appt.message && <p className="mt-1 text-sm text-muted">&ldquo;{appt.message}&rdquo;</p>}
            {appt.status === "requested" && (
              <Button
                variant="outline"
                className="mt-3 !px-3 !py-1.5 text-xs"
                onClick={() => updateStatus.mutate({ id: appt.id, status: "cancelled" })}
              >
                Cancel
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
