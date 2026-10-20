"use client";

import { useState } from "react";
import { useRequireProfile, useUsers } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { VetCard } from "@/components/VetCard";
import { Spinner } from "@/components/ui";

export default function VetsPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: vets, isLoading: vetsLoading } = useUsers("vet");
  const [tab, setTab] = useState<"available" | "all">("available");

  if (isLoading || !user) return <Spinner />;

  const availableCount = vets?.filter((v) => v.availability === "available").length ?? 0;
  const list = tab === "available" ? vets?.filter((v) => v.availability === "available") : vets;

  return (
    <div>
      <PageHeader title="Contact a Veterinarian" backHref="/home" />
      <div className="px-5 md:px-0">
        <div className="mb-4 flex rounded-full bg-border/60 p-1 md:max-w-sm">
          <TabButton active={tab === "available"} onClick={() => setTab("available")}>
            Available now ({availableCount})
          </TabButton>
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            All near me ({vets?.length ?? 0})
          </TabButton>
        </div>

        {vetsLoading && <Spinner />}
        <div className="space-y-3 pb-10 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
          {list?.map((vet) => (
            <VetCard key={vet.id} vet={vet} farmerId={user.id} />
          ))}
        </div>

        <p className="pb-10 text-center text-xs text-muted">
          Availability is set by each veterinarian and updated live. Only veterinarians shown as available can take a call right now.
        </p>
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
