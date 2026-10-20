"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useRequireProfile, useAnimals } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";

const ICONS: Record<string, string> = {
  Cow: "🐄",
  Goat: "🐐",
  Sheep: "🐑",
  Pig: "🐖",
  Poultry: "🐓",
};

export default function AnimalsPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: animals, isLoading: animalsLoading } = useAnimals(user?.id);

  if (isLoading || !user) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="My Livestock"
        right={
          <Link href="/animals/new">
            <Button className="!flex !items-center !gap-1 !px-4 !py-2 text-xs">
              <Plus size={14} /> Add Animal
            </Button>
          </Link>
        }
      />
      <div className="px-5 md:px-0">
        {animalsLoading && <Spinner />}
        {!animalsLoading && animals?.length === 0 && (
          <EmptyState title="No animals yet" body="Add your first animal to start keeping health records." />
        )}
      </div>
      <div className="space-y-3 px-5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:px-0 lg:grid-cols-3">
        {animals?.map((animal) => (
          <Link key={animal.id} href={`/animals/${animal.id}`}>
            <Card className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-background text-2xl">
                {ICONS[animal.type] ?? "🐾"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-navy">
                  {animal.type}
                  {animal.tag ? `, ${animal.tag}` : ""}
                </p>
                <p className="text-sm text-muted">
                  {[animal.breed, animal.sex, animal.age].filter(Boolean).join(", ")}
                </p>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
