import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/auth";
import { sendMail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAD_TO = process.env.LEAD_EMAIL || "info@seokaroai.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!rateLimit(`chatlead:${ip}`, 6, 600)) {
    return NextResponse.json({ error: "Too many submissions. Please try again in a few minutes." }, { status: 429 });
  }

  let body: { name?: string; email?: string; phone?: string; message?: string; page?: string; transcript?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const name = String(body?.name ?? "").trim().slice(0, 120);
  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 255);
  const phone = String(body?.phone ?? "").trim().slice(0, 40);
  const message = String(body?.message ?? "").trim().slice(0, 3000);
  const page = String(body?.page ?? "/").trim().slice(0, 300);
  const transcript = String(body?.transcript ?? "").trim().slice(0, 4000);

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!phone || phone.replace(/[^0-9+]/g, "").length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const fullMsg = [
    message || "(Submitted via SEOKaroAI Chatbot)",
    `Phone: ${phone}`,
    `Page: ${page}`,
    transcript ? `\n--- Chat Summary ---\n${transcript}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await db().insert(schema.contactMessages).values({
      name,
      email,
      company: `Phone: ${phone}`.slice(0, 160),
      message: fullMsg.slice(0, 5000),
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("[chat/lead] db insert failed:", e);
  }

  const subject = `New SEOKaroAI Chatbot Lead: ${name} (${phone})`;
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#1f86ff">New Chatbot Inquiry / Lead</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;width:130px">Name</td><td style="padding:8px;border:1px solid #e2e8f0">${esc(name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Email</td><td style="padding:8px;border:1px solid #e2e8f0"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Phone</td><td style="padding:8px;border:1px solid #e2e8f0">${esc(phone)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Page</td><td style="padding:8px;border:1px solid #e2e8f0">${esc(page)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;vertical-align:top">Message</td><td style="padding:8px;border:1px solid #e2e8f0;white-space:pre-wrap">${esc(message || "—")}</td></tr>
      </table>
      ${transcript ? `<h3 style="margin:18px 0 8px;font-size:14px">Recent Chat Transcript</h3><pre style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:12.5px">${esc(transcript)}</pre>` : ""}
    </div>`;

  await sendMail({
    to: LEAD_TO,
    subject,
    html,
    text: `New SEOKaroAI Chatbot Lead\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nPage: ${page}\nMessage:\n${message || "—"}\n${transcript ? `\nChat Transcript:\n${transcript}` : ""}`,
    kind: "chatbot_lead",
  });

  return NextResponse.json({ ok: true, message: "Thank you! Our team received your inquiry and will contact you shortly." });
}
