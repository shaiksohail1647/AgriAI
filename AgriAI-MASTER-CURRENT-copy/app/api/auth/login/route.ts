import { NextResponse } from "next/server";
import { findUser } from "@/lib/auth";
import { createSessionToken, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await findUser(email, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });

    response.cookies.set("agriai_user", createSessionToken(user), sessionCookie);

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
