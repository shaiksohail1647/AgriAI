import { NextResponse } from "next/server";
import { createPasswordReset } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const reset = await createPasswordReset(email);
    if (!reset) return NextResponse.json({ success: true, message: "If this email has an account, a verification code has been sent." });

    if (process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM) {
      const delivery = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM, to: [reset.user.email], subject: "Your AgriAI password reset code", html: `<p>Your AgriAI verification code is <strong>${reset.code}</strong>.</p><p>It expires in 15 minutes.</p>` })
      });
      if (!delivery.ok) throw new Error("Unable to send the verification code. Please try again later.");
      return NextResponse.json({ success: true, message: "A verification code has been sent to your email." });
    }

    if (process.env.NODE_ENV !== "production") return NextResponse.json({ success: true, message: "Verification code created for local development.", developmentCode: reset.code });
    throw new Error("Password reset email is not configured.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to request a password reset." }, { status: 400 });
  }
}
