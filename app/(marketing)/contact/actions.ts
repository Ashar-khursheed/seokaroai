"use server";

import { db, schema } from "@/lib/db";
import { rateLimit, requestInfo } from "@/lib/auth";
import { config } from "@/lib/config";
import { sendMail } from "@/lib/email";
import { contactAdminEmail } from "@/lib/email/templates";
import type { FormState } from "@/components/client";

export async function sendContact(_: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 255);
  const company = String(fd.get("company") ?? "").trim().slice(0, 160) || null;
  const message = String(fd.get("message") ?? "").trim().slice(0, 5000);
  if (fd.get("website")) return { ok: true, message: "Thanks! We will reply soon." }; // honeypot
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) return { error: "Please add your name, a valid email and a message of at least 10 characters." };
  const { ip } = await requestInfo();
  if (!rateLimit(`contact:${ip}`, 5, 3600)) return { error: "Too many messages. Please try again later." };
  await db().insert(schema.contactMessages).values({ name, email, company, message, createdAt: new Date() });
  for (const to of config.adminEmails.length ? config.adminEmails : [config.supportEmail]) {
    await sendMail({ to, kind: "contact", ...contactAdminEmail({ name, email, company, message }) });
  }
  return { ok: true, message: "Thanks! Your message is on its way. We usually reply within one business day." };
}
