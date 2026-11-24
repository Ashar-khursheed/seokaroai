"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  consumeToken, createSession, createToken, destroyOtherSessions, destroySession, hashPassword, isAdminEmail,
  passwordProblem, rateLimit, requestInfo, verifyPassword,
} from "@/lib/auth";
import { config } from "@/lib/config";
import { sendMail } from "@/lib/email";
import { resetEmail, verifyEmail } from "@/lib/email/templates";
import type { FormState } from "@/components/client";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const safeNext = (n: unknown) => (typeof n === "string" && /^\/(app|admin)(\/|$|\?)/.test(n) ? n : "/app");

export async function sendVerification(userId: number, email: string, name: string) {
  const token = await createToken(userId, "verify", 48 * 60);
  const mail = verifyEmail(name, `${config.appUrl}/verify-email?token=${encodeURIComponent(token)}`);
  await sendMail({ to: email, userId, kind: "verify", ...mail });
}

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const plan = String(fd.get("plan") ?? "");
  if (!name) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  const pwErr = passwordProblem(password);
  if (pwErr) return { error: pwErr };
  if (!fd.get("terms")) return { error: "Please accept the terms to continue." };
  const { ip } = await requestInfo();
  if (!rateLimit(`signup:${ip}`, 6, 3600)) return { error: "Too many sign-ups from this network. Try again in an hour." };

  const [existing] = await db().select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) return { error: "An account with this email already exists. Log in instead, or reset your password." };
  const now = new Date();
  const res = await db().insert(schema.users).values({
    email, name, passwordHash: await hashPassword(password), role: isAdminEmail(email) ? "admin" : "user", createdAt: now, updatedAt: now,
  });
  const userId = Number((res[0] as { insertId: number }).insertId);
  await sendVerification(userId, email, name);
  await createSession(userId);
  redirect(["starter", "pro", "agency"].includes(plan) ? `/app/billing?plan=${plan}` : "/app?welcome=1");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const { ip } = await requestInfo();
  if (!rateLimit(`login:${ip}`, 20, 900) || !rateLimit(`login:${email}`, 8, 900)) return { error: "Too many attempts. Wait 15 minutes and try again." };
  const [user] = await db().select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  // same message and similar timing whether or not the account exists
  const ok = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!user || !ok) return { error: "Email or password is incorrect." };
  if (user.suspendedAt) return { error: "This account is suspended. Contact support." };
  if (isAdminEmail(email) && user.role !== "admin") await db().update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const done: FormState = { ok: true, message: "If an account exists for that email, a reset link is on its way. It works for 1 hour." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  const { ip } = await requestInfo();
  if (!rateLimit(`forgot:${ip}`, 10, 3600) || !rateLimit(`forgot:${email}`, 3, 3600)) return done;
  const [user] = await db().select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (user && !user.suspendedAt) {
    const token = await createToken(user.id, "reset", 60);
    const mail = resetEmail(`${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`);
    await sendMail({ to: user.email, userId: user.id, kind: "reset", ...mail });
  }
  return done;
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  const pwErr = passwordProblem(password);
  if (pwErr) return { error: pwErr };
  const userId = await consumeToken(token, "reset");
  if (!userId) return { error: "This reset link is invalid or has expired. Ask for a new one." };
  await db().update(schema.users).set({ passwordHash: await hashPassword(password) }).where(eq(schema.users.id, userId));
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await createSession(userId);
  await destroyOtherSessions(userId);
  redirect("/app?reset=1");
}
