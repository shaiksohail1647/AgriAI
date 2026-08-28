import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    await resetPassword(email, code, password);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to reset the password." }, { status: 400 });
  }
}
