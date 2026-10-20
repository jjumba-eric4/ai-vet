"use client";

import { PhoneCall, TriangleAlert } from "lucide-react";
import { useRequireProfile } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Card, Spinner } from "@/components/ui";

export default function EmergencyPage() {
  const { user, isLoading } = useRequireProfile("farmer");

  if (isLoading || !user) return <Spinner />;

  return (
    <div>
      <PageHeader title="Emergency Help" backHref="/home" />
      <div className="space-y-4 px-5 pb-10 md:max-w-xl md:px-0">
        <Card className="border-danger/30 bg-danger-bg">
          <div className="mb-2 flex items-center gap-2 text-danger">
            <TriangleAlert size={18} />
            <p className="font-semibold">If an animal has collapsed, is bleeding heavily, or can&apos;t stand</p>
          </div>
          <p className="text-sm text-danger/80">
            Keep the animal calm and in the shade. Do not force it to move. Call the District Veterinary Office or
            the nearest available veterinarian immediately.
          </p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-navy">Emergency contacts</h2>
          <a href="tel:+256414000111" className="flex items-center justify-between border-b border-border pb-3">
            <span className="flex items-center gap-2 text-sm text-navy">
              <PhoneCall size={16} className="text-teal-dark" />
              District Veterinary Office
            </span>
            <span className="text-sm font-semibold text-teal-dark">+256 414 000 111</span>
          </a>
          <p className="text-sm text-muted">
            Or go to <span className="font-medium text-navy">Contact a Veterinarian</span> to call whoever is
            available near you right now.
          </p>
        </Card>
      </div>
    </div>
  );
}
