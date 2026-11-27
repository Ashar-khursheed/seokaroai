import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/auth";
import { complete } from "@/lib/ai/complete";
import { PLANS, PAID_PLANS } from "@/lib/plans";
import { ADDON_LIST } from "@/lib/addons";
import { FEATURES } from "@/lib/content/features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt() {
  const planLines = (["free", ...PAID_PLANS] as const)
    .map((c) => {
      const p = PLANS[c];
      return `- ${p.name} ($${p.priceMonthly}/mo${p.priceYearly ? ` or $${p.priceYearly}/yr — 2 months free` : ""}): ${p.limits.projects} websites, ${p.limits.quickAudits} site audits/mo, ${p.limits.deepAudits} AI deep audits/mo, ${p.limits.battles} keyword battles/mo, ${p.limits.keywords} tracked keywords, ${p.limits.fixes} AI auto-fixes/mo, ${p.limits.prChecks} GitHub PR SEO Gatekeeper checks/mo.`;
    })
    .join("\n");

  const addonLines = ADDON_LIST.map(
    (a) => `- ${a.name} ($${a.priceMonthly}/mo, sold separately on any plan): ${a.tagline}`,
  ).join("\n");

  const featureLines = FEATURES.map((f) => `- ${f.name} (/features/${f.slug}): ${f.metaDescription}`).join("\n");

  return `You are SEOKaroAI's official assistant on seokaroai.com. You know the entire SEOKaroAI platform inside-out.

PLATFORM KNOWLEDGE:
- Brand: SEOKaroAI (https://seokaroai.com), contact: info@seokaroai.com & support@seokaroai.com.
- Core capabilities:
  1. Site Audit (quick): 47 deterministic on-page checks, security headers, sitemaps, AI readiness & Google PageSpeed Core Web Vitals in ~1–2 min (zero AI cost).
  2. AI Deep Audit: 12+ specialist AI agents run in parallel (Technical SEO, Content & E-E-A-T, Schema, Performance CWV, GEO/AI Search, Competitors, Images) producing a deterministic weighted score out of 100, previous-audit delta comparison, 90-day Action Plan, and branded PDF/HTML client reports.
  3. AI Auto-Fix: Connects to WordPress (Application Password, REST API, 1-click undo), Shopify (Admin API token, 1-click undo), or GitHub (fine-grained token, opens Pull Requests on a new branch — never pushes directly to main). All tokens are AES-256-GCM encrypted and never sent to AI models.
  4. Auto Internal Linking: Zero-AI-cost opportunity scan from crawled pages + 1-click shipping via Auto-Fix.
  5. GitHub PR SEO Gatekeeper: Automated $0-AI-cost PR webhook checks catching accidental noindex, robots.txt blocks, missing alt tags, overlong titles/metas, and duplicate H1s directly in GitHub PR comments (Starter+ plans).
  6. Keyword Battle: Compares your page vs the live Google Top 3 across 20+ signals with competitor receipts and ready-to-paste titles/outlines.
  7. Daily Rank Tracker: Tracks top 100 Google positions by country & language with 30-day sparklines and email alerts on ±3 moves.
  8. Free Instant SEO Checker (/features/website-seo-checker): No-signup instant URL check with shareable permalink.
  9. Video Tutorials (/tutorials): Short interactive click-by-click guides for every feature.
  10. Comparisons: SEOKaroAI vs Semrush (/compare/seokaroai-vs-semrush), vs Ahrefs (/compare/seokaroai-vs-ahrefs).

PLANS & PRICING (Payments via Paddle, Merchant of Record; 14-day refund policy on new subscriptions; cancel anytime):
${planLines}

PAID ADD-ONS (Sold separately from plans):
${addonLines}

FEATURE PAGES:
${featureLines}

CONVERSATION RULES:
- Reply in the SAME language the user writes in (English, Roman Urdu, Urdu, Hindi, etc.).
- Be warm, concise (2–4 short sentences or concise bullet points), accurate, and helpful. Never invent features or fake prices.
- When helpful, mention the exact page path like /pricing, /signup, /tutorials, or /features/website-seo-checker.
- If the user asks about custom pricing, agency onboarding, demos, human support, or seems ready to get in touch, end with a friendly invite to fill out the quick inquiry form below so our team at info@seokaroai.com can reach out.`;
}

function fallbackReply(msg: string): string {
  const m = msg.toLowerCase();
  if (/pric|plan|cost|free|starter|pro|agency|kitn|rate/.test(m)) {
    return "SEOKaroAI starts **Free** (1 website, 5 site audits/mo, 1 keyword battle, 1 AI auto-fix). Paid plans are **Starter ($39/mo)**, **Pro ($99/mo)**, and **Agency ($249/mo)** — yearly billing gives 2 months free! We also offer the **Reddit & Quora Outreach Add-on** separately for **$29/mo**. You can view all details on /pricing or leave your details below for a custom walkthrough.";
  }
  if (/auto.?fix|wordpress|shopify|github|pr|pull request/.test(m)) {
    return "SEOKaroAI connects directly to **WordPress**, **Shopify**, and **GitHub** (all tokens AES-256-GCM encrypted). You review every proposed fix side by side before approving — CMS changes support 1-click undo, and GitHub fixes open a clean Pull Request without ever pushing to main.";
  }
  if (/reddit|quora|addon|add-on|outreach/.test(m)) {
    return "Our **Reddit & Quora Outreach Add-on ($29/mo, sold separately)** finds high-intent Reddit threads and Quora questions for your keywords, writes natural value-first AI reply drafts, and lets you copy & post safely from your own account.";
  }
  return "SEOKaroAI is an all-in-one AI SEO platform: **12+ agent AI Deep Audits**, **47-check Site Audits**, **Keyword Battle vs Google Top 3**, **Daily Rank Tracking**, **AI Auto-Fix (WordPress, Shopify & GitHub PRs)**, and **GitHub PR SEO Gatekeeper**. You can start free at /signup or leave your name, email & phone below and our team will reach out!";
}

function shouldOfferForm(userMsg: string, historyLen: number) {
  if (historyLen >= 4) return true;
  return /contact|demo|call|phone|whatsapp|email|support|custom|agency|team|quote|help|talk|human|inquiry|lead|buy|discount|price|pricing/i.test(userMsg);
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!rateLimit(`chatbot:${ip}`, 25, 600)) {
    return NextResponse.json({ error: "Too many messages. Please wait a few minutes or submit the inquiry form below." }, { status: 429 });
  }

  let body: { messages?: ChatMsg[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const raw = Array.isArray(body?.messages) ? body.messages : [];
  const clean = raw
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 1000) }));

  const lastUser = [...clean].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const transcript = clean.map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`).join("\n");
  let reply = "";
  try {
    const res = await complete({
      system: buildSystemPrompt(),
      prompt: `Conversation so far:\n${transcript}\n\nReply to the customer's latest message:`,
      maxTokens: 450,
    });
    reply = res.text.trim();
  } catch {
    reply = fallbackReply(lastUser);
  }

  return NextResponse.json({
    reply: reply || fallbackReply(lastUser),
    showLeadForm: shouldOfferForm(lastUser, clean.length),
  });
}
