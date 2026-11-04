"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequireProfile, useAnimals, useScanPhotos } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, Field, Spinner, inputClass } from "@/components/ui";
import { urgencyLabel, urgencyTone } from "@/lib/format";

export default function ScanPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const { data: animals } = useAnimals(user?.id);
  const scan = useScanPhotos();

  const [animalId, setAnimalId] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  if (isLoading || !user) return <Spinner />;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length === 0) return;
    scan.mutate({ animal_id: animalId || undefined, note: note.trim() || undefined, photos });
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
          {animals && animals.length > 0 && (
            <Field label="Which animal? (optional)">
              <select className={inputClass} value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
                <option value="">Not sure / general</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type}
                    {a.tag ? `, ${a.tag}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Photo">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {photos.length > 0 && <p className="mt-1 text-xs text-muted">{photos.length} photo(s) selected</p>}
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
            <Link href="/report/new">
              <Button variant="outline" className="mt-2 w-full">
                Send Full Report to a Vet
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
