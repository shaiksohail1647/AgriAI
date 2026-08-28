import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { createSessionToken, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name : "";
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const user = await createUser(name, email, password);
    const response = NextResponse.json({ success: true, user }, { status: 201 });
    response.cookies.set("agriai_user", createSessionToken(user), sessionCookie);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the account.";
    const status = message.includes("setup is complete") ? 403 : message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
