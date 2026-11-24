import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { config } from "@/lib/config";
import type { User } from "@/lib/db/schema";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const SESSION_COOKIE = "sk_session";
const SESSION_DAYS = 30;

// ---------------------------------------------------------------- passwords
export async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1;
  const key = await scrypt(pw, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, N, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(pw, Buffer.from(salt, "base64"), expected.length, { N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
  return crypto.timingSafeEqual(key, expected);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 200) return "That password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Use letters and at least one number.";
  return null;
}

// ---------------------------------------------------------------- tokens
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createToken(userId: number, kind: "verify" | "reset", ttlMinutes: number): Promise<string> {
  const raw = crypto.randomBytes(32).toString("base64url");
  await db().insert(schema.authTokens).values({
    id: sha256(raw), userId, kind, expiresAt: new Date(Date.now() + ttlMinutes * 60_000), createdAt: new Date(),
  });
  return raw;
}

/** Single-use: returns the user id and marks the token used, or null if invalid/expired/used. */
export async function consumeToken(raw: string, kind: "verify" | "reset"): Promise<number | null> {
  if (!raw || raw.length > 100) return null;
  const id = sha256(raw);
  const [tok] = await db().select().from(schema.authTokens)
    .where(and(eq(schema.authTokens.id, id), eq(schema.authTokens.kind, kind), isNull(schema.authTokens.usedAt), gt(schema.authTokens.expiresAt, new Date())))
    .limit(1);
  if (!tok) return null;
  const res = await db().update(schema.authTokens).set({ usedAt: new Date() })
    .where(and(eq(schema.authTokens.id, id), isNull(schema.authTokens.usedAt)));
  if ((res[0] as { affectedRows?: number }).affectedRows !== 1) return null;
  return tok.userId;
}

// ---------------------------------------------------------------- sessions
export async function requestInfo() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim().slice(0, 64);
  return { ip, userAgent: (h.get("user-agent") || "").slice(0, 255) };
}

export async function createSession(userId: number) {
  const raw = crypto.randomBytes(32).toString("base64url");
  const { ip, userAgent } = await requestInfo();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db().insert(schema.sessions).values({ id: sha256(raw), userId, expiresAt, ip, userAgent, createdAt: new Date() });
  await db().update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
  (await cookies()).set(SESSION_COOKIE, raw, {
    httpOnly: true, sameSite: "lax", secure: config.isProd, path: "/", expires: expiresAt,
  });
  // opportunistic cleanup
  void db().delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date())).catch(() => {});
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) await db().delete(schema.sessions).where(eq(schema.sessions.id, sha256(raw)));
  jar.delete(SESSION_COOKIE);
}

export async function destroyOtherSessions(userId: number) {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const keep = raw ? sha256(raw) : "";
  const all = await db().select({ id: schema.sessions.id }).from(schema.sessions).where(eq(schema.sessions.userId, userId));
  for (const s of all) if (s.id !== keep) await db().delete(schema.sessions).where(eq(schema.sessions.id, s.id));
}

/** The signed-in user, or null. Suspended users are treated as signed out. */
export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw || raw.length > 100) return null;
  const rows = await db().select({ user: schema.users }).from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(raw)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  const user = rows[0]?.user;
  if (!user || user.suspendedAt) return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/app");
  return u;
}

export function isAdminEmail(email: string) {
  return config.adminEmails.includes(email.toLowerCase());
}

// ---------------------------------------------------------------- rate limiting (per process)
const rateStore = globalThis as unknown as { __skRate?: Map<string, number[]> };
const buckets: Map<string, number[]> = (rateStore.__skRate ??= new Map<string, number[]>());

/** Returns true when the action is allowed; false when `max` hits happened in the last `windowSec`. */
export function rateLimit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowSec * 1000);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Reject cross-site POSTs to API routes that use the session cookie. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetch from older browsers / server
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return o.host === host;
  } catch {
    return false;
  }
}
