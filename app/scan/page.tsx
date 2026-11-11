"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRequireProfile, useScanPhotos } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { AiProgress, Badge, Button, Card, Field, Spinner, inputClass } from "@/components/ui";
import { urgencyLabel, urgencyTone } from "@/lib/format";
import { setScanHandoff } from "@/lib/scan-handoff";

const SCAN_MESSAGES = [
  "Uploading photo…",
  "Looking closely at the photo…",
  "Identifying the animal…",
  "Checking for visible signs of illness or injury…",
  "Comparing with common livestock conditions…",
  "Finishing up the assessment…",
];

export default function ScanPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const router = useRouter();
  const queryClient = useQueryClient();
  const scan = useScanPhotos();

  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  if (isLoading || !user) return <Spinner />;

  const identified = scan.data?.assessment.identified_animal;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length === 0) return;
    scan.mutate({ note: note.trim() || undefined, photos });
  }

  function handleSendToVet() {
    if (!scan.data) return;
    setScanHandoff(queryClient, {
      note: note.trim() || undefined,
      photos,
      assessment: scan.data.assessment,
    });
    router.push("/report/new");
  }

  return (
    <div>
      <PageHeader title="AI Photo Scan" backHref="/home" />
      <div className="space-y-6 px-5 pb-10 md:max-w-xl md:px-0">
        <p className="text-sm text-muted">
          Upload a photo of the animal and get an instant AI read while you decide what to do next. This is not a
          diagnosis — for treatment, send a full report to a veterinarian.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Photo">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {photos.length > 0 && (
              <p className="mt-1 text-xs text-muted">
                {photos.length} photo(s) selected{photos.length > 1 ? " — only the first is analyzed" : ""}
              </p>
            )}
          </Field>

          <Field label="Anything you've noticed? (optional)">
            <textarea
              className={`${inputClass} min-h-20 resize-none`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Round lumps on the neck, not eating well"
            />
          </Field>

          <Button type="submit" variant="secondary" className="w-full" disabled={photos.length === 0 || scan.isPending}>
            {scan.isPending ? "Scanning…" : "Scan with AI"}
          </Button>
        </form>

        {scan.isPending && <AiProgress messages={SCAN_MESSAGES} />}

        {scan.isError && (
          <Card className="border-danger/30 bg-danger-bg">
            <p className="text-sm text-danger">{(scan.error as Error).message}</p>
          </Card>
        )}

        {scan.data && (
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">AI preliminary scan</p>
              <Badge tone={urgencyTone(scan.data.assessment.urgency_hint)}>
                {urgencyLabel(scan.data.assessment.urgency_hint)}
              </Badge>
            </div>
            {identified && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted">AI identified:</span>
                <Badge tone="muted">
                  {identified.species}
                  {identified.breed ? `, ${identified.breed}` : ""}
                </Badge>
                {identified.confidence !== "high" && (
                  <span className="text-xs text-muted">({identified.confidence} confidence)</span>
                )}
              </div>
            )}
            <p className="text-sm text-muted">{scan.data.assessment.summary}</p>
            {scan.data.assessment.possible_conditions.length > 0 && (
              <p className="text-xs text-muted">Possible: {scan.data.assessment.possible_conditions.join(", ")}</p>
            )}
            {scan.data.assessment.notable_observations.length > 0 && (
              <ul className="space-y-1 text-xs text-muted">
                {scan.data.assessment.notable_observations.map((o, i) => (
                  <li key={i}>• {o}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted">Not a diagnosis. For treatment, send a full report to a vet.</p>
            <Button variant="outline" className="mt-2 w-full" onClick={handleSendToVet}>
              Send Full Report to a Vet
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
