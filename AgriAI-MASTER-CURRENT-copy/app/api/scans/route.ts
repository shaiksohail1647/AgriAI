import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { analyzePlantImage } from "../../../lib/plant";
import { getSessionUser } from "../../../lib/session";
import { getDailyScanImagePath, readDailyScans, saveDailyScan } from "../../../lib/daily-scans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ scans: await readDailyScans(user.id) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "No crop image was provided." }, { status: 400 });
    if (!image.type.startsWith("image/")) return NextResponse.json({ error: "The uploaded file is not an image." }, { status: 400 });
    if (image.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Please upload an image smaller than 10 MB." }, { status: 400 });

    const scans = await readDailyScans(user.id);
    const rawLocation = String(formData.get("location") || "");
    const rawNotes = String(formData.get("notes") || "");
    const selectedCrop = String(formData.get("crop") || "").trim();
    const capturedAt = String(formData.get("capturedAt") || new Date().toISOString());
    const timezone = String(formData.get("timezone") || "UTC");
    const farmStartDate = String(formData.get("farmStartDate") || "");
    const rawFarmContext = String(formData.get("farmContext") || "{}");
    let location: any = undefined; let farmContext: any = {};
    try { if (rawLocation) location = JSON.parse(rawLocation); } catch {}
    try { farmContext = JSON.parse(rawFarmContext); } catch {}

    let previous: any = undefined;
    const previousScan = [...scans].sort((a,b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt))[0];
    if (previousScan) {
      try {
        const previousPath = await getDailyScanImagePath(user.id, previousScan.imageFile);
        previous = { file: await fs.readFile(previousPath), mime: previousScan.imageFile.toLowerCase().endsWith(".png") ? "image/png" : previousScan.imageFile.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg", capturedAt: previousScan.capturedAt, analysis: previousScan.analysis };
      } catch {}
    }

    const analysis = await analyzePlantImage(image, { expectedCrop: selectedCrop || farmContext.crop, farmContext: { ...farmContext, crop: selectedCrop || farmContext.crop, location, capturedAt, farmStartDate, previousScan: previousScan ? { capturedAt: previousScan.capturedAt, dateKey: previousScan.dateKey, analysis: previousScan.analysis } : null }, previous });
    const saved = await saveDailyScan(user.id, image, { capturedAt, timezone, farmStartDate: farmStartDate || undefined, crop: analysis.crop, notes: rawNotes, location, analysis });
    return NextResponse.json({ success: true, scan: saved });
  } catch (error) {
    console.error("Daily scan error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save daily crop scan." }, { status: 500 });
  }
}
