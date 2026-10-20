"use client";

import { useState } from "react";
import { Phone, MessageCircle, MapPinned, CalendarDays, CircleCheck } from "lucide-react";
import { useCreateAppointment } from "@/lib/hooks";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import type { User } from "@/lib/types";

function availabilityBadge(vet: User) {
  if (vet.availability === "available") return <Badge tone="teal">Available now</Badge>;
  if (vet.availability === "busy") return <Badge tone="warning">Busy{vet.busy_until ? ` until ${vet.busy_until}` : ""}</Badge>;
  return <Badge tone="muted">Closed{vet.opens_at ? `, opens ${vet.opens_at}` : ""}</Badge>;
}

export function VetCard({ vet, farmerId }: { vet: User; farmerId: string }) {
  const [panel, setPanel] = useState<"message" | "book" | null>(null);
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sentNote, setSentNote] = useState<string | null>(null);
  const createAppointment = useCreateAppointment();

  async function send(kind: "call" | "message" | "farm_visit" | "appointment", extra: { message?: string; scheduled_at?: string } = {}) {
    await createAppointment.mutateAsync({ farmer_id: farmerId, vet_id: vet.id, kind, ...extra });
    setPanel(null);
    setMessage("");
    setScheduledAt("");
    setSentNote(
      kind === "call"
        ? "Call requested — the vet will call you shortly."
        : kind === "farm_visit"
          ? "Farm visit requested."
          : kind === "message"
            ? "Message sent."
            : "Appointment requested."
    );
  }

  return (
    <Card className={vet.availability === "available" ? "border-teal/40" : undefined}>
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-background text-lg font-semibold text-navy">
          {vet.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-navy">{vet.name}</p>
          <p className="text-xs text-muted">{vet.credentials}</p>
          <p className="text-xs text-muted">{vet.specialty}</p>
          <p className="text-xs text-muted">{vet.location}</p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        {availabilityBadge(vet)}
        <span className="text-xs font-medium text-muted">{vet.consult_fee}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {vet.availability === "available" && (
          <Button
            variant="secondary"
            className="!flex !items-center !gap-1.5 !px-3 !py-2 text-xs"
            disabled={createAppointment.isPending}
            onClick={() => send("call")}
          >
            <Phone size={14} /> Call Veterinarian
          </Button>
        )}
        {vet.availability !== "closed" && (
          <Button
            variant="outline"
            className="!flex !items-center !gap-1.5 !px-3 !py-2 text-xs"
            onClick={() => setPanel(panel === "message" ? null : "message")}
          >
            <MessageCircle size={14} /> Send Message
          </Button>
        )}
        {vet.availability === "available" && (
          <Button
            variant="outline"
            className="!flex !items-center !gap-1.5 !px-3 !py-2 text-xs"
            disabled={createAppointment.isPending}
            onClick={() => send("farm_visit")}
          >
            <MapPinned size={14} /> Request Farm Visit
          </Button>
        )}
        <Button
          variant="outline"
          className="!flex !items-center !gap-1.5 !px-3 !py-2 text-xs"
          onClick={() => setPanel(panel === "book" ? null : "book")}
        >
          <CalendarDays size={14} /> Book Appointment
        </Button>
      </div>

      {panel === "message" && (
        <div className="mt-3 space-y-2">
          <textarea
            className={`${inputClass} min-h-16 resize-none`}
            placeholder="Describe what's going on…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            disabled={!message.trim() || createAppointment.isPending}
            onClick={() => send("message", { message: message.trim() })}
          >
            Send
          </Button>
        </div>
      )}

      {panel === "book" && (
        <div className="mt-3 space-y-2">
          <input
            type="datetime-local"
            className={inputClass}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            disabled={!scheduledAt || createAppointment.isPending}
            onClick={() => send("appointment", { scheduled_at: new Date(scheduledAt).toISOString() })}
          >
            Confirm
          </Button>
        </div>
      )}

      {sentNote && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-teal-dark">
          <CircleCheck size={14} /> {sentNote}
        </p>
      )}
    </Card>
  );
}
