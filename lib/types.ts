export type Role = "farmer" | "vet";
export type Availability = "available" | "busy" | "closed";

export interface User {
  id: string;
  role: Role;
  name: string;
  phone: string | null;
  district: string | null;
  credentials: string | null;
  specialty: string | null;
  location: string | null;
  consult_fee: string | null;
  availability: Availability | null;
  busy_until: string | null;
  opens_at: string | null;
  created_at: string;
}

export interface Animal {
  id: string;
  owner_id: string;
  type: string;
  breed: string | null;
  age: string | null;
  sex: string | null;
  tag: string | null;
  farm_location: string | null;
  created_at: string;
}

export type Onset = "today" | "2-3 days" | "a week" | "longer";
export type Level = "normal" | "less" | "not at all";
export type Movement = "normal" | "limping" | "can't stand";
export type Urgency = "monitor" | "see_vet_soon" | "within_24h";
export type ReportStatus = "pending" | "reviewed";

export interface TreatmentItem {
  text: string;
  done: boolean;
}

export interface HealthReport {
  id: string;
  animal_id: string;
  farmer_id: string;
  description: string;
  onset: Onset;
  eating: Level;
  drinking: Level;
  movement: Movement;
  fever: 0 | 1;
  less_milk: 0 | 1;
  status: ReportStatus;
  urgency: Urgency | null;
  vet_id: string | null;
  diagnosis: string | null;
  vet_notes: string | null;
  treatment_plan: string | null;
  next_check_date: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ReportPhoto {
  id: string;
  report_id: string;
  filename: string;
  created_at: string;
}

export interface HealthReportWithExtras extends HealthReport {
  animal: Animal;
  photos: ReportPhoto[];
  treatment_items: TreatmentItem[];
}

export type AppointmentKind = "message" | "call" | "farm_visit" | "appointment";
export type AppointmentStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  farmer_id: string;
  vet_id: string;
  animal_id: string | null;
  kind: AppointmentKind;
  message: string | null;
  status: AppointmentStatus;
  scheduled_at: string | null;
  created_at: string;
}

export interface AppointmentWithExtras extends Appointment {
  vet: User;
  farmer: User;
  animal: Animal | null;
}
