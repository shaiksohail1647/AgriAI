import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type SessionUser = { id: string; name: string; email: string };
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;
function secret() {
  if (process.env.AUTH_SESSION_SECRET) return process.env.AUTH_SESSION_SECRET;
  if (process.env.NODE_ENV !== "production") return "agriai-development-session-secret-change-before-production";
  throw new Error("AUTH_SESSION_SECRET must be configured in production.");
}
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get("agriai_user")?.value;
  if (!raw) return null;
  try {
    const [payload, signature] = raw.split(".");
    if (!payload || !signature) return null;
    const actual = Buffer.from(signature);
    const expected = Buffer.from(sign(payload));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser & { exp?: number };
    if (!parsed?.id || !parsed?.name || !parsed?.email || !parsed?.exp || parsed.exp < Date.now() / 1000) return null;
    return { id: parsed.id, name: parsed.name, email: parsed.email };
  } catch { return null; }
}

export const sessionCookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_AGE_SECONDS };
