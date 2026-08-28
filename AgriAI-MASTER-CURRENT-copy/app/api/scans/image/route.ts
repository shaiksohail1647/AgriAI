import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { getSessionUser } from "../../../../lib/session";
import { getDailyScanImagePath } from "../../../../lib/daily-scans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Authentication required.", { status: 401 });

  const filename = new URL(request.url).searchParams.get("file") || "";
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!filename || filename !== safe || filename.includes("..")) return new NextResponse("Invalid image filename.", { status: 400 });

  try {
    const fullPath = await getDailyScanImagePath(user.id, filename);
    const data = await fs.readFile(fullPath);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new NextResponse("Image not found.", { status: 404 });
  }
}
