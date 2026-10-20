"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSubmitReport } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Button, Field, inputClass } from "@/components/ui";
import type { Animal, Level, Movement, Onset } from "@/lib/types";

const ONSETS: { value: Onset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "2-3 days", label: "2–3 days" },
  { value: "a week", label: "A week" },
  { value: "longer", label: "Longer" },
];

const LEVELS: { value: Level; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "less", label: "Less" },
  { value: "not at all", label: "Not at all" },
];

const MOVEMENTS: { value: Movement; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "limping", label: "Limping" },
  { value: "can't stand", label: "Can't stand" },
];

export function ReportForm({
  farmerId,
  animals,
  initialAnimalId,
}: {
  farmerId: string;
  animals: Animal[];
  initialAnimalId?: string;
}) {
  const router = useRouter();
  const submitReport = useSubmitReport();

  const [animalId, setAnimalId] = useState(initialAnimalId ?? animals[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [onset, setOnset] = useState<Onset>("today");
  const [eating, setEating] = useState<Level>("normal");
  const [drinking, setDrinking] = useState<Level>("normal");
  const [movement, setMovement] = useState<Movement>("normal");
  const [fever, setFever] = useState(false);
  const [lessMilk, setLessMilk] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  const selectedAnimal = animals.find((a) => a.id === animalId);
  const canSubmit = animalId && description.trim().length > 0 && !submitReport.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const report = await submitReport.mutateAsync({
      animal_id: animalId,
      farmer_id: farmerId,
      description: description.trim(),
      onset,
      eating,
      drinking,
      movement,
      fever,
      less_milk: lessMilk,
      photos,
    });
    router.push(`/reports/${report.id}`);
  }

  if (animals.length === 0) {
    return (
      <div>
        <PageHeader title="Report an Animal Health Problem" backHref="/home" />
        <div className="px-5 md:max-w-xl md:px-0">
          <p className="text-sm text-muted">
            Add an animal first so you can report a health problem for it.
          </p>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => router.push("/animals/new")}>
            Add Animal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Report an Animal Health Problem" backHref="/home" />
      <form onSubmit={handleSubmit} className="space-y-6 px-5 pb-10 md:max-w-xl md:px-0">
        <Field label="1. Select the affected animal">
          <select className={inputClass} value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.type}
                {a.tag ? `, ${a.tag}` : ""} — {[a.breed, a.sex, a.age].filter(Boolean).join(", ")}
              </option>
            ))}
          </select>
          {selectedAnimal && (
            <p className="mt-1 text-xs text-muted">{selectedAnimal.farm_location}</p>
          )}
        </Field>

        <Field label="2. Add photos (optional)">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {photos.length > 0 && <p className="mt-1 text-xs text-muted">{photos.length} photo(s) selected</p>}
        </Field>

        <Field label="3. Describe the symptoms">
          <textarea
            className={`${inputClass} min-h-24 resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Round lumps on the skin of the neck and back. Not eating well."
          />
        </Field>

        <Field label="4. When did the symptoms start?">
          <div className="flex flex-wrap gap-2">
            {ONSETS.map((o) => (
              <ChoiceButton key={o.value} active={onset === o.value} onClick={() => setOnset(o.value)}>
                {o.label}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        <Field label="5. A few questions">
          <div className="space-y-4">
            <QuestionRow label="Eating" value={eating} options={LEVELS} onChange={setEating} />
            <QuestionRow label="Drinking" value={drinking} options={LEVELS} onChange={setDrinking} />
            <QuestionRow label="Movement" value={movement} options={MOVEMENTS} onChange={setMovement} />
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm text-navy">Fever or feels hot</span>
              <input type="checkbox" checked={fever} onChange={(e) => setFever(e.target.checked)} className="h-4 w-4 accent-teal" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm text-navy">Less milk than usual</span>
              <input type="checkbox" checked={lessMilk} onChange={(e) => setLessMilk(e.target.checked)} className="h-4 w-4 accent-teal" />
            </label>
          </div>
        </Field>

        <Button type="submit" variant="secondary" className="w-full" disabled={!canSubmit}>
          {submitReport.isPending ? "Sending…" : "Send to a Veterinarian"}
        </Button>
        <p className="text-center text-xs text-muted">
          A veterinarian will review your photos and answers and get back to you.
        </p>
      </form>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        active ? "bg-navy text-white" : "border border-border text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function QuestionRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-navy">{label}</span>
      <div className="flex gap-1.5">
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              value === o.value ? "bg-navy text-white" : "border border-border text-navy"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
