import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = process.env.VERCEL ? join("/tmp", "data") : join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "app.db");

declare global {
  var __vetDb: DatabaseSync | undefined;
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('farmer', 'vet')),
      name TEXT NOT NULL,
      phone TEXT,
      district TEXT,
      credentials TEXT,
      specialty TEXT,
      location TEXT,
      consult_fee TEXT,
      availability TEXT CHECK (availability IN ('available', 'busy', 'closed')),
      busy_until TEXT,
      opens_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      breed TEXT,
      age TEXT,
      sex TEXT,
      tag TEXT,
      farm_location TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_reports (
      id TEXT PRIMARY KEY,
      animal_id TEXT NOT NULL REFERENCES animals(id),
      farmer_id TEXT NOT NULL REFERENCES users(id),
      description TEXT NOT NULL,
      onset TEXT NOT NULL,
      eating TEXT NOT NULL,
      drinking TEXT NOT NULL,
      movement TEXT NOT NULL,
      fever INTEGER NOT NULL DEFAULT 0,
      less_milk INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
      urgency TEXT CHECK (urgency IN ('monitor', 'see_vet_soon', 'within_24h') OR urgency IS NULL),
      vet_id TEXT REFERENCES users(id),
      diagnosis TEXT,
      vet_notes TEXT,
      treatment_plan TEXT,
      next_check_date TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS report_photos (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL REFERENCES health_reports(id),
      filename TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL REFERENCES users(id),
      vet_id TEXT NOT NULL REFERENCES users(id),
      animal_id TEXT REFERENCES animals(id),
      kind TEXT NOT NULL CHECK (kind IN ('message', 'call', 'farm_visit', 'appointment')),
      message TEXT,
      status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
      scheduled_at TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function seed(database: DatabaseSync) {
  const row = database.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (row.c > 0) return;

  const now = new Date().toISOString();
  const today = new Date();
  today.setHours(14, 0, 0, 0);

  const joshua = "u_joshua";
  const grace = "u_grace";
  const amina = "u_amina";
  const peter = "u_peter";
  const dvo = "u_dvo";
  const cow = "a_cow014";
  const goat = "a_goat002";
  const reviewedReport = "r_lsd";
  const pendingReport = "r_limp";

  const insertUser = database.prepare(`
    INSERT INTO users (id, role, name, phone, district, credentials, specialty, location, consult_fee, availability, busy_until, opens_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(joshua, "farmer", "Joshua Tendo Kasakya", "+256772123456", "Wakiso", null, null, null, null, null, null, null, now);
  insertUser.run(grace, "farmer", "Grace Namutebi", "+256701987654", "Mukono", null, null, null, null, null, null, null, now);
  insertUser.run(amina, "vet", "Dr. Amina Nabirye", "+256772555001", null, "BVM, MSc Veterinary Medicine", "Cattle and small ruminants", "Kira, Wakiso District", "UGX 25,000 per consultation", "available", null, null, now);
  insertUser.run(peter, "vet", "Dr. Peter Okello", "+256772555002", null, "BVM", "Poultry and pigs", "Entebbe Road, Wakiso", "UGX 20,000 per consultation", "busy", "3:00 pm", null, now);
  insertUser.run(dvo, "vet", "District Veterinary Office", "+256414000111", null, "Government service", "Notifiable diseases", "Wakiso District HQ", "Free", "closed", null, "8:00 am", now);

  const insertAnimal = database.prepare(`
    INSERT INTO animals (id, owner_id, type, breed, age, sex, tag, farm_location, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAnimal.run(cow, joshua, "Cow", "Ankole", "3 years", "Female", "UG-COW-014", "Kira, Wakiso District", now);
  insertAnimal.run(goat, grace, "Goat", "Mubende", "1 year", "Male", "UG-GOAT-002", "Mukono Town", now);

  const insertReport = database.prepare(`
    INSERT INTO health_reports (id, animal_id, farmer_id, description, onset, eating, drinking, movement, fever, less_milk, status, urgency, vet_id, diagnosis, vet_notes, treatment_plan, next_check_date, created_at, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReport.run(
    reviewedReport, cow, joshua,
    "Round lumps on the skin of the neck and back. Not eating well.",
    "2-3 days", "less", "normal", "normal", 1, 1,
    "reviewed", "within_24h", amina,
    "Lumpy skin disease",
    "Confirmed after reviewing the photos and reported symptoms. Keep the animal separated from the herd.",
    JSON.stringify([
      { text: "Separate from the herd", done: true },
      { text: "Oxytetracycline 20mg/kg, morning and evening for 5 days", done: false },
      { text: "Vaccinate the other cattle", done: false },
    ]),
    "2026-10-22",
    now, now
  );
  insertReport.run(
    pendingReport, goat, grace,
    "Limping on the front left leg since yesterday. Still eating.",
    "today", "normal", "normal", "limping", 0, 0,
    "pending", null, null, null, null, null, null,
    now, null
  );

  const insertAppointment = database.prepare(`
    INSERT INTO appointments (id, farmer_id, vet_id, animal_id, kind, message, status, scheduled_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAppointment.run(randomUUID(), joshua, amina, cow, "appointment", "Follow-up check on the lumpy skin treatment.", "confirmed", today.toISOString(), now);
}

function createConnection() {
  mkdirSync(DATA_DIR, { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA foreign_keys = ON;");
  migrate(database);
  seed(database);
  return database;
}

export const db = globalThis.__vetDb ?? createConnection();
if (process.env.NODE_ENV !== "production") globalThis.__vetDb = db;

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
