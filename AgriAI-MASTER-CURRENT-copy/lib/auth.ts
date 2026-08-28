import { createHash, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export type User = { id: string; name: string; email: string };
type StoredUser = User & { passwordHash: string; passwordSalt: string; createdAt: string };
type PasswordReset = { email: string; codeHash: string; expiresAt: number; attempts: number };

function usersPath() { return path.join(process.cwd(), "data", "users.json"); }
function resetsPath() { return path.join(process.cwd(), "data", "password-resets.json"); }
function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

async function readUsers(): Promise<StoredUser[]> {
  try {
    const users = JSON.parse(await fs.readFile(usersPath(), "utf8")) as unknown;
    return Array.isArray(users) ? users.filter((user): user is StoredUser => Boolean(user && typeof user === "object" && typeof (user as StoredUser).id === "string" && typeof (user as StoredUser).email === "string" && typeof (user as StoredUser).passwordHash === "string" && typeof (user as StoredUser).passwordSalt === "string")) : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users: StoredUser[]) {
  const file = usersPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(users, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await fs.rename(temporary, file);
}

async function readResets(): Promise<PasswordReset[]> {
  try {
    const resets = JSON.parse(await fs.readFile(resetsPath(), "utf8")) as unknown;
    return Array.isArray(resets) ? resets.filter((reset): reset is PasswordReset => Boolean(reset && typeof reset === "object" && typeof (reset as PasswordReset).email === "string" && typeof (reset as PasswordReset).codeHash === "string" && typeof (reset as PasswordReset).expiresAt === "number" && typeof (reset as PasswordReset).attempts === "number")) : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}
async function writeResets(resets: PasswordReset[]) {
  const file = resetsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(resets, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}
function resetCodeHash(email: string, code: string) {
  return createHash("sha256").update(`${process.env.AUTH_RESET_SECRET || "agriai-development-reset-secret"}:${normalizeEmail(email)}:${code}`).digest("hex");
}

async function hashPassword(password: string, salt: string) {
  return (await scrypt(password, salt, 64) as Buffer).toString("hex");
}
function publicUser(user: StoredUser): User { return { id: user.id, name: user.name, email: user.email }; }

export async function findUser(email: string, password: string): Promise<User | null> {
  const user = (await readUsers()).find(candidate => candidate.email === normalizeEmail(email));
  if (!user) return null;
  const supplied = Buffer.from(await hashPassword(password, user.passwordSalt), "hex");
  const expected = Buffer.from(user.passwordHash, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  return publicUser(user);
}

export async function createUser(name: string, email: string, password: string): Promise<User> {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const cleanEmail = normalizeEmail(email);
  if (cleanName.length < 2 || cleanName.length > 80) throw new Error("Enter your name (2–80 characters).");
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254) throw new Error("Enter a valid email address.");
  if (password.length < 8 || password.length > 128) throw new Error("Use a password with 8–128 characters.");
  const users = await readUsers();
  if (users.some(user => user.email === cleanEmail)) throw new Error("An account with this email already exists.");
  const passwordSalt = randomBytes(16).toString("hex");
  const user: StoredUser = { id: randomUUID(), name: cleanName, email: cleanEmail, passwordSalt, passwordHash: await hashPassword(password, passwordSalt), createdAt: new Date().toISOString() };
  await writeUsers([...users, user]);
  return publicUser(user);
}

export async function createPasswordReset(email: string): Promise<{ user: User; code: string } | null> {
  const cleanEmail = normalizeEmail(email);
  const user = (await readUsers()).find(candidate => candidate.email === cleanEmail);
  if (!user) return null;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const resets = (await readResets()).filter(reset => reset.email !== cleanEmail && reset.expiresAt > Date.now());
  resets.push({ email: cleanEmail, codeHash: resetCodeHash(cleanEmail, code), expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 });
  await writeResets(resets);
  return { user: publicUser(user), code };
}

export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit verification code.");
  if (password.length < 8 || password.length > 128) throw new Error("Use a password with 8–128 characters.");
  const resets = await readResets();
  const reset = resets.find(item => item.email === cleanEmail);
  if (!reset || reset.expiresAt < Date.now() || reset.attempts >= 5) throw new Error("This verification code has expired. Request a new one.");
  if (reset.codeHash !== resetCodeHash(cleanEmail, code)) {
    reset.attempts += 1;
    await writeResets(resets);
    throw new Error("That verification code is incorrect.");
  }
  const users = await readUsers();
  const index = users.findIndex(user => user.email === cleanEmail);
  if (index < 0) throw new Error("This verification code has expired. Request a new one.");
  const passwordSalt = randomBytes(16).toString("hex");
  users[index] = { ...users[index], passwordSalt, passwordHash: await hashPassword(password, passwordSalt) };
  await writeUsers(users);
  await writeResets(resets.filter(item => item.email !== cleanEmail));
}
