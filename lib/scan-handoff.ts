import type { QueryClient } from "@tanstack/react-query";
import type { AiAssessment } from "@/lib/types";

export interface ScanHandoff {
  note?: string;
  photos: File[];
  assessment: AiAssessment;
}

const KEY = ["scanHandoff"];

export function setScanHandoff(queryClient: QueryClient, data: ScanHandoff) {
  queryClient.setQueryData(KEY, data);
}

// Reads and clears in one step so a stale scan doesn't resurface on a later visit.
export function takeScanHandoff(queryClient: QueryClient): ScanHandoff | undefined {
  const data = queryClient.getQueryData<ScanHandoff>(KEY);
  queryClient.removeQueries({ queryKey: KEY });
  return data;
}
