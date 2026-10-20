"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireProfile, useCreateAnimal } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Button, Field, Spinner, inputClass } from "@/components/ui";

const TYPES = ["Cow", "Goat", "Sheep", "Pig", "Poultry"];
const SEXES = ["Female", "Male"];

export default function NewAnimalPage() {
  const { user, isLoading } = useRequireProfile("farmer");
  const router = useRouter();
  const createAnimal = useCreateAnimal();

  const [type, setType] = useState("Cow");
  const [sex, setSex] = useState("Female");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [tag, setTag] = useState("");
  const [farmLocation, setFarmLocation] = useState(user?.district ?? "");

  if (isLoading || !user) return <Spinner />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const animal = await createAnimal.mutateAsync({
      owner_id: user.id,
      type,
      breed: breed || undefined,
      age: age || undefined,
      sex,
      tag: tag || undefined,
      farm_location: farmLocation || undefined,
    });
    router.push(`/animals/${animal.id}`);
  }

  return (
    <div>
      <PageHeader title="Add Animal" backHref="/animals" />
      <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-10 md:max-w-xl md:px-0">
        <Field label="Animal type">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  type === t ? "bg-navy text-white" : "border border-border text-navy"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Breed">
          <input className={inputClass} value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Ankole" />
        </Field>

        <Field label="Age">
          <input className={inputClass} value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 3 years" />
        </Field>

        <Field label="Sex">
          <div className="flex gap-2">
            {SEXES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSex(s)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium ${
                  sex === s ? "bg-navy text-white" : "border border-border text-navy"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Animal ID">
          <input className={inputClass} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. UG-COW-014" />
        </Field>

        <Field label="Farm location">
          <input
            className={inputClass}
            value={farmLocation}
            onChange={(e) => setFarmLocation(e.target.value)}
            placeholder="Where your farm is"
          />
        </Field>

        <Button type="submit" variant="secondary" className="w-full" disabled={createAnimal.isPending}>
          {createAnimal.isPending ? "Saving…" : "Save Animal"}
        </Button>
      </form>
    </div>
  );
}
