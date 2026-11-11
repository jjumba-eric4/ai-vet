"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRequireProfile, useAnimals } from "@/lib/hooks";
import { ReportForm } from "@/components/ReportForm";
import { Spinner } from "@/components/ui";
import { takeScanHandoff } from "@/lib/scan-handoff";

export default function NewReportPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: animals, isLoading: animalsLoading } = useAnimals(user?.id);
  const queryClient = useQueryClient();
  const [scanHandoff] = useState(() => takeScanHandoff(queryClient));

  if (isLoading || !user || animalsLoading) return <Spinner />;

  return <ReportForm farmerId={user.id} animals={animals ?? []} scanHandoff={scanHandoff} />;
}
