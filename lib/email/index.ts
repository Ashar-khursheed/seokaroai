import fs from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { config } from "@/lib/config";
import { db, schema } from "@/lib/db";
import { integrations, type Integrations } from "@/lib/integrations";

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: string;
  userId?: number | null;
}

let cached: { key: string; t: Transporter } | null = null;

function transportFor(s: Integrations["smtp"]): Transporter | null {
  if (!s.host) return null;
  const key = JSON.stringify([s.host, s.port, s.secure, s.user, s.pass]);
  if (cached?.key !== key) {
    cached = { key, t: nodemailer.createTransport({ host: s.host, port: s.port, secure: s.secure, auth: s.user ? { user: s.user, pass: s.pass } : undefined }) };
  }
  return cached.t;
}

/** Check SMTP settings (Admin → Integrations). */
export async function testSmtp(): Promise<{ ok: boolean; message: string }> {
  const s = (await integrations()).smtp;
  const t = transportFor(s);
  if (!t) return { ok: false, message: "Add an SMTP host first." };
  try {
    await t.verify();
    return { ok: true, message: `Connected to ${s.host}:${s.port}.` };
  } catch (e) {
    return { ok: false, message: String((e as Error).message).slice(0, 300) };
  }
}

/**
 * Send an email through SMTP. Without SMTP settings (development) the message is written to
 * data/outbox/*.eml instead, so links can be clicked locally. Never throws; failures are logged.
 */
export async function sendMail(m: Mail): Promise<boolean> {
  let status = "sent";
  let error: string | null = null;
  try {
    const s = (await integrations()).smtp;
    const t = transportFor(s);
    if (t) {
      await t.sendMail({ from: s.from, to: m.to, subject: m.subject, html: m.html, text: m.text });
    } else {
      const dir = path.join(config.dataDir, "outbox");
      fs.mkdirSync(dir, { recursive: true });
      const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${m.kind}.eml`;
      const eml = [`From: ${s.from}`, `To: ${m.to}`, `Subject: ${m.subject}`, "MIME-Version: 1.0", 'Content-Type: text/html; charset="utf-8"', "", m.html].join("\r\n");
      fs.writeFileSync(path.join(dir, name), eml);
      status = "outbox";
    }
  } catch (e) {
    status = "failed";
    error = String((e as Error).message || e).slice(0, 1000);
  }
  try {
    await db().insert(schema.emailLog).values({
      userId: m.userId ?? null, toEmail: m.to, kind: m.kind, subject: m.subject.slice(0, 300), status, error, createdAt: new Date(),
    });
  } catch {
    /* logging must never break the caller */
  }
  return status !== "failed";
}
