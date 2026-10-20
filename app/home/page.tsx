"use client";

import Link from "next/link";
import { Camera, Stethoscope, PawPrint, ClipboardList, CalendarDays, PhoneCall, type LucideIcon } from "lucide-react";
import { useRequireProfile, useAppointments } from "@/lib/hooks";
import { Card, Spinner } from "@/components/ui";
import { Logo } from "@/components/Logo";

function isToday(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function FarmerHomePage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: appointments } = useAppointments({ farmerId: user?.id });

  if (isLoading || !user) return <Spinner />;

  const todayCount = appointments?.filter((a) => isToday(a.scheduled_at)).length ?? 0;

  return (
    <div className="px-5 pt-6 md:px-0 md:pt-0">
      <div className="mb-5 flex items-center gap-3 md:mb-8">
        <Logo size={44} />
        <div>
          <h1 className="text-lg font-bold text-navy md:text-2xl">Welcome to VetConnect</h1>
          <p className="text-sm text-muted">Hello, {user.name}</p>
        </div>
      </div>

      <Link href="/report/new">
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-navy p-5 text-white md:mb-6 md:p-7">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-teal text-navy md:h-14 md:w-14">
            <Camera size={24} strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold md:text-lg">Report an Animal Health Problem</p>
            <p className="text-sm text-white/60">Add photos and describe what you see</p>
          </div>
        </div>
      </Link>

      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:grid-cols-4 md:gap-4">
        <DashCard href="/vets" Icon={Stethoscope} label="Contact a Veterinarian" />
        <DashCard href="/animals" Icon={PawPrint} label="My Livestock" />
        <DashCard href="/reports" Icon={ClipboardList} label="Health Records" />
        <DashCard href="/appointments" Icon={CalendarDays} label="Appointments" badge={todayCount > 0 ? `${todayCount} today` : undefined} />
      </div>

      <Link href="/emergency">
        <Card className="flex items-center gap-3 border-danger/30 bg-danger-bg md:max-w-md">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-danger text-white">
            <PhoneCall size={18} />
          </div>
          <div>
            <p className="font-semibold text-danger">Emergency Help</p>
            <p className="text-sm text-danger/80">Animal collapsed, bleeding or can&apos;t stand</p>
          </div>
        </Card>
      </Link>
    </div>
  );
}

function DashCard({ href, Icon, label, badge }: { href: string; Icon: LucideIcon; label: string; badge?: string }) {
  return (
    <Link href={href}>
      <Card className="relative h-full transition-shadow hover:shadow-md">
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-semibold text-teal-dark">
            {badge}
          </span>
        )}
        <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-background text-navy">
          <Icon size={20} strokeWidth={1.9} />
        </div>
        <p className="text-sm font-semibold text-navy">{label}</p>
      </Card>
    </Link>
  );
}
