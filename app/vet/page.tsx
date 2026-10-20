"use client";

import Link from "next/link";
import { ClipboardList, CalendarDays } from "lucide-react";
import { useRequireProfile, useReports, useAppointments, useUpdateAvailability } from "@/lib/hooks";
import { Badge, Card, Spinner } from "@/components/ui";
import type { Availability } from "@/lib/types";

function isToday(iso: string | null) {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

const OPTIONS: { value: Availability; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "closed", label: "Closed" },
];

export default function VetHomePage() {
  const { user, isLoading } = useRequireProfile("vet");
  const { data: pending } = useReports({ status: "pending" });
  const { data: appointments } = useAppointments({ vetId: user?.id });
  const updateAvailability = useUpdateAvailability();

  if (isLoading || !user) return <Spinner />;

  const todayAppointments = appointments?.filter((a) => isToday(a.scheduled_at)).length ?? 0;

  return (
    <div className="px-5 pt-6 pb-10 md:px-0 md:pt-0">
      <div className="mb-5 md:mb-8">
        <h1 className="text-lg font-bold text-navy md:text-2xl">Welcome back</h1>
        <p className="text-sm text-muted">{user.name}</p>
      </div>

      <Card className="mb-4 md:max-w-md">
        <p className="mb-2 text-sm font-semibold text-navy">Your availability</p>
        <div className="flex gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                updateAvailability.mutate({
                  id: user.id,
                  availability: opt.value,
                  busy_until: user.busy_until,
                  opens_at: user.opens_at,
                })
              }
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${
                user.availability === opt.value ? "bg-navy text-white" : "border border-border text-navy"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:max-w-md">
        <Link href="/vet/reports">
          <Card className="relative transition-shadow hover:shadow-md">
            {!!pending?.length && (
              <Badge tone="warning">{pending.length} pending</Badge>
            )}
            <div className="mb-6 mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-background text-navy">
              <ClipboardList size={20} strokeWidth={1.9} />
            </div>
            <p className="text-sm font-semibold text-navy">Reports to review</p>
          </Card>
        </Link>
        <Link href="/vet/appointments">
          <Card className="relative transition-shadow hover:shadow-md">
            {todayAppointments > 0 && <Badge tone="teal">{todayAppointments} today</Badge>}
            <div className="mb-6 mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-background text-navy">
              <CalendarDays size={20} strokeWidth={1.9} />
            </div>
            <p className="text-sm font-semibold text-navy">Appointments</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
