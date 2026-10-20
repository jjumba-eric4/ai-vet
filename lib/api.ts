import type {
  Animal,
  Appointment,
  AppointmentKind,
  AppointmentStatus,
  AppointmentWithExtras,
  HealthReportWithExtras,
  Onset,
  Level,
  Movement,
  Role,
  TreatmentItem,
  Urgency,
  User,
} from "@/lib/types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Users
export function fetchUsers(role?: Role): Promise<User[]> {
  const qs = role ? `?role=${role}` : "";
  return fetch(`/api/users${qs}`).then((r) => handle(r));
}

export function fetchUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then((r) => handle(r));
}

export function updateAvailability(
  id: string,
  data: { availability: User["availability"]; busy_until?: string | null; opens_at?: string | null }
): Promise<User> {
  return fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => handle(r));
}

// Animals
export function fetchAnimals(ownerId?: string): Promise<Animal[]> {
  const qs = ownerId ? `?ownerId=${ownerId}` : "";
  return fetch(`/api/animals${qs}`).then((r) => handle(r));
}

export function fetchAnimal(id: string): Promise<Animal & { reports: HealthReportWithExtras[] }> {
  return fetch(`/api/animals/${id}`).then((r) => handle(r));
}

export interface NewAnimalInput {
  owner_id: string;
  type: string;
  breed?: string;
  age?: string;
  sex?: string;
  tag?: string;
  farm_location?: string;
}

export function createAnimal(input: NewAnimalInput): Promise<Animal> {
  return fetch("/api/animals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r));
}

// Health reports
export interface ReportsFilter {
  farmerId?: string;
  vetId?: string;
  status?: "pending" | "reviewed";
}

export function fetchReports(filter: ReportsFilter = {}): Promise<HealthReportWithExtras[]> {
  const params = new URLSearchParams();
  if (filter.farmerId) params.set("farmerId", filter.farmerId);
  if (filter.vetId) params.set("vetId", filter.vetId);
  if (filter.status) params.set("status", filter.status);
  const qs = params.toString();
  return fetch(`/api/reports${qs ? `?${qs}` : ""}`).then((r) => handle(r));
}

export function fetchReport(id: string): Promise<HealthReportWithExtras> {
  return fetch(`/api/reports/${id}`).then((r) => handle(r));
}

export interface NewReportInput {
  animal_id: string;
  farmer_id: string;
  description: string;
  onset: Onset;
  eating: Level;
  drinking: Level;
  movement: Movement;
  fever: boolean;
  less_milk: boolean;
  photos: File[];
}

export function submitReport(input: NewReportInput): Promise<HealthReportWithExtras> {
  const form = new FormData();
  form.set("animal_id", input.animal_id);
  form.set("farmer_id", input.farmer_id);
  form.set("description", input.description);
  form.set("onset", input.onset);
  form.set("eating", input.eating);
  form.set("drinking", input.drinking);
  form.set("movement", input.movement);
  form.set("fever", String(input.fever));
  form.set("less_milk", String(input.less_milk));
  for (const photo of input.photos) form.append("photos", photo);

  return fetch("/api/reports", { method: "POST", body: form }).then((r) => handle(r));
}

export interface ReviewReportInput {
  vet_id: string;
  diagnosis: string;
  vet_notes?: string;
  urgency: Urgency;
  treatment_plan: TreatmentItem[];
  next_check_date?: string | null;
}

export function reviewReport(id: string, input: ReviewReportInput): Promise<HealthReportWithExtras> {
  return fetch(`/api/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r));
}

export function toggleTreatmentItem(
  reportId: string,
  index: number,
  done: boolean
): Promise<{ treatment_items: TreatmentItem[] }> {
  return fetch(`/api/reports/${reportId}/treatment-item`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index, done }),
  }).then((r) => handle(r));
}

// Appointments
export interface AppointmentsFilter {
  farmerId?: string;
  vetId?: string;
}

export function fetchAppointments(filter: AppointmentsFilter = {}): Promise<AppointmentWithExtras[]> {
  const params = new URLSearchParams();
  if (filter.farmerId) params.set("farmerId", filter.farmerId);
  if (filter.vetId) params.set("vetId", filter.vetId);
  const qs = params.toString();
  return fetch(`/api/appointments${qs ? `?${qs}` : ""}`).then((r) => handle(r));
}

export interface NewAppointmentInput {
  farmer_id: string;
  vet_id: string;
  animal_id?: string | null;
  kind: AppointmentKind;
  message?: string;
  scheduled_at?: string | null;
}

export function createAppointment(input: NewAppointmentInput): Promise<AppointmentWithExtras> {
  return fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r));
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
  return fetch(`/api/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((r) => handle(r));
}
