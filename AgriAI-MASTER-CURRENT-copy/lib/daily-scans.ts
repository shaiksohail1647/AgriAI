import fs from "node:fs/promises";
import path from "node:path";

export type DailyScanRecord = {
  id: string;
  userId: string;
  dayNumber: number;
  capturedAt: string;
  dateKey: string;
  farmStartDate?: string;
  timezone?: string;
  imageFile: string;
  crop?: string;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    displayName?: string;
  };
  analysis: Record<string, unknown>;
};

function safeUserId(userId: string) { return userId.replace(/[^a-zA-Z0-9_-]/g, "_"); }
function scansDir() { return path.join(process.cwd(), "data", "daily-scans"); }
function imagesDir(userId: string) { return path.join(process.cwd(), "public", "uploads", safeUserId(userId)); }
async function ensureStorage(userId: string) { await fs.mkdir(scansDir(), { recursive: true }); await fs.mkdir(imagesDir(userId), { recursive: true }); }
function metadataPath(userId: string) { return path.join(scansDir(), `${safeUserId(userId)}.json`); }

function dateKeyFor(iso: string, timezone = "UTC") {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    return new Date(iso).toISOString().slice(0, 10);
  }
}

function dayDifference(a: string, b: string) {
  const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

function normalizeRecord(record: any): DailyScanRecord {
  const timezone = record.timezone || "UTC";
  const capturedAt = record.capturedAt || new Date().toISOString();
  const dateKey = record.dateKey || dateKeyFor(capturedAt, timezone);
  return { ...record, capturedAt, dateKey, timezone };
}

export async function readDailyScans(userId: string): Promise<DailyScanRecord[]> {
  await ensureStorage(userId);
  try {
    const raw = await fs.readFile(metadataPath(userId), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord).sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  } catch { return []; }
}

type DailyScanInput = {
  capturedAt?: string;
  timezone?: string;
  farmStartDate?: string;
  crop?: string;
  notes?: string;
  location?: DailyScanRecord["location"];
  analysis: Record<string, unknown>;
};

export async function saveDailyScan(userId: string, file: File, record: DailyScanInput) {
  const scans = await readDailyScans(userId);
  await ensureStorage(userId);

  const timezone = record.timezone || "UTC";
  const capturedAt = record.capturedAt || new Date().toISOString();
  const dateKey = dateKeyFor(capturedAt, timezone);

  // Day numbers come from the actual calendar date, never from upload count.
  // If the farmer started a journal on a known date, that date is Day 1.
  const existingStart = scans.find(s => s.farmStartDate)?.farmStartDate;
  const firstDate = record.farmStartDate || existingStart ||
    (scans.length ? scans.map(s => normalizeRecord(s)).sort((a,b) => a.dateKey.localeCompare(b.dateKey))[0].dateKey : dateKey);
  const dayNumber = Math.max(1, dayDifference(dateKey, firstDate) + 1);

  const extension = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const filename = `obs-${dateKey}-${Date.now()}.${extension}`;
  const fullPath = path.join(imagesDir(userId), filename);
  await fs.writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  const saved: DailyScanRecord = {
    ...record,
    id: `${userId}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    userId,
    dayNumber,
    capturedAt,
    dateKey,
    timezone,
    farmStartDate: firstDate,
    imageFile: filename,
  };

  scans.push(saved);
  scans.sort((a,b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  await fs.writeFile(metadataPath(userId), JSON.stringify(scans, null, 2), "utf8");
  return saved;
}

export async function getDailyScanImagePath(userId: string, filename: string) {
  return path.join(imagesDir(userId), path.basename(filename));
}
