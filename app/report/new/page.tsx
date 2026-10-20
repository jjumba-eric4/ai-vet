"use client";

import { useRequireProfile, useAnimals } from "@/lib/hooks";
import { ReportForm } from "@/components/ReportForm";
import { Spinner } from "@/components/ui";

export default function NewReportPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: animals, isLoading: animalsLoading } = useAnimals(user?.id);

  if (isLoading || !user || animalsLoading) return <Spinner />;

  return <ReportForm farmerId={user.id} animals={animals ?? []} />;
}
