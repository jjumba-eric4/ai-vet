import type { AppointmentKind, Urgency } from "@/lib/types";

export function urgencyLabel(urgency: Urgency | null): string {
  switch (urgency) {
    case "within_24h":
      return "Within 24 hours";
    case "see_vet_soon":
      return "See vet soon";
    case "monitor":
      return "Monitor";
    default:
      return "Pending";
  }
}

export function urgencyTone(urgency: Urgency | null): "danger" | "warning" | "teal" | "muted" {
  switch (urgency) {
    case "within_24h":
      return "danger";
    case "see_vet_soon":
      return "warning";
    case "monitor":
      return "teal";
    default:
      return "muted";
  }
}

export function appointmentKindLabel(kind: AppointmentKind): string {
  switch (kind) {
    case "call":
      return "Call";
    case "message":
      return "Message";
    case "farm_visit":
      return "Farm visit";
    case "appointment":
      return "Appointment";
  }
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
