import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/auth";
import { PLANS, PAID_PLANS } from "@/lib/plans";
import { ADDON_LIST } from "@/lib/addons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface ChatCard {
  badge?: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

interface BotAnswer {
  reply: string;
  cards: ChatCard[];
  suggestions: string[];
  showLeadForm: boolean;
}

function isRomanUrdu(text: string): boolean {
  return /\b(kya|kia|kaise|kesy|kitna|kitne|kitny|hai|hain|h|btao|batao|bhai|jaan|karo|krdo|chahiye|chahye|mujhy|mujhe|hmri|hamari|apki|aapki|mosam|mausam|salam|assalam|shukriya|madad|kaam|kam|site|website ka|pricing kya)\b/i.test(
    text,
  );
}

function buildAnswer(msg: string, historyLen: number): BotAnswer {
  const m = msg.toLowerCase();
  const ur = isRomanUrdu(msg);

  const askLead =
    historyLen >= 6 ||
    /contact|demo|call|phone|whatsapp|email|support|custom|team|quote|talk|human|inquiry|lead|buy|discount|sales|rabta|baat/i.test(m);

  // 1. Pricing / Plans / Free / Billing / Refund
  if (/pric|plan|cost|free|starter|pro\b|agency|bill|paddle|refund|cancel|kitn|rate|pais|dollar|\$|package|tier/i.test(m)) {
    const paid = PAID_PLANS.map((c) => {
      const p = PLANS[c];
      return `• **${p.name} — $${p.priceMonthly}/mo** (${p.limits.projects} sites, ${p.limits.deepAudits} AI Deep Audits, ${p.limits.fixes} Auto-Fixes, ${p.limits.keywords} keywords)`;
    }).join("\n");
    const addon = ADDON_LIST[0];

    return {
      reply: ur
        ? `**SEOKaroAI ke plans simple aur transparent hain:**\n• **Free ($0/mo)** — 1 website, ${PLANS.free.limits.quickAudits} Site Audits, ${PLANS.free.limits.battles} Keyword Battle, ${PLANS.free.limits.fixes} AI Auto-Fix\n${paid}\n\nYearly billing par **2 months free** milte hain aur new subscriptions par **14-day refund policy** hai.${addon ? ` **${addon.name}** alag se **$${addon.priceMonthly}/mo** add-on hai.` : ""}`
        : `Here are **SEOKaroAI’s plans** (cancel anytime, 14-day refund policy on new subscriptions, 2 months free on yearly billing):\n• **Free ($0/mo)** — 1 website, ${PLANS.free.limits.quickAudits} Site Audits, ${PLANS.free.limits.battles} Keyword Battle, ${PLANS.free.limits.fixes} AI Auto-Fix\n${paid}${addon ? `\n\nOptional Add-on: **${addon.name} ($${addon.priceMonthly}/mo)** sold separately on any plan.` : ""}`,
      cards: [
        {
          badge: "Compare Plans",
          title: "Full Pricing & Limits",
          description: "Compare Free, Starter, Pro, Agency, and the Reddit & Quora Add-on side by side.",
          href: "/pricing",
          cta: "View Pricing",
        },
        {
          badge: "No Card Required",
          title: "Start Free Account",
          description: "Run your first AI SEO audit and test 1-click Auto-Fix free.",
          href: "/signup",
          cta: "Create Free Account",
        },
      ],
      suggestions: ["How does AI Auto-Fix work?", "Tell me about Reddit & Quora Add-on", "Compare vs Semrush"],
      showLeadForm: askLead || /agency|custom|discount|bulk/i.test(m),
    };
  }

  // 2. Reddit & Quora Outreach Add-on
  if (/reddit|quora|outreach|addon|add-on|community|thread|comment/i.test(m)) {
    const addon = ADDON_LIST[0];
    return {
      reply: ur
        ? `**Reddit & Quora Outreach** ek separate paid add-on hai (**$${addon?.priceMonthly ?? 29}/mo**, kisi bhi plan par activate kar sakte hain).\n• Aapke keywords ke liye active Reddit threads aur Quora questions find karta hai\n• Natural, non-spammy value-first AI reply drafts banata hai\n• 100% safe human-in-the-loop workflow: aap review karke apne account se copy & post karte hain.`
        : `**Reddit & Quora Outreach ($${addon?.priceMonthly ?? 29}/mo, sold separately on any plan)** helps you earn high-intent brand mentions safely:\n• Discovers active Reddit discussions and Quora questions for your keywords\n• Drafts helpful, natural value-first replies with AI\n• Strictly human-in-the-loop: review, edit, and copy & post from your own account.`,
      cards: [
        {
          badge: `Paid Add-on · $${addon?.priceMonthly ?? 29}/mo`,
          title: "Reddit & Quora Outreach",
          description: "Find high-intent threads, generate natural AI reply drafts, and track posted mentions.",
          href: "/pricing",
          cta: "See Add-on on Pricing",
        },
        {
          badge: "Get Started",
          title: "Create Your Account",
          description: "Sign up free and activate the Outreach add-on anytime in Billing.",
          href: "/signup",
          cta: "Start Free",
        },
      ],
      suggestions: ["Pricing & Free plan limits?", "What is AI Search (GEO)?", "Send an inquiry"],
      showLeadForm: askLead,
    };
  }

  // 3. Auto-Fix / WordPress / Shopify / GitHub / PR Gatekeeper / Security / Rollback / Internal Linking
  if (/auto.?fix|wordpress|shopify|github|pull request|\bpr\b|gatekeeper|rollback|undo|secur|encrypt|token|internal link|cms|integrat/i.test(m)) {
    return {
      reply: ur
        ? `**SEOKaroAI sirf report nahi deta — approved fixes khud ship karta hai:**\n• **WordPress & Shopify:** Before/after diff review karein aur 1 click mein apply karein, with **1-click rollback**.\n• **GitHub & PR SEO Gatekeeper:** Auto-Fix hamesha naye branch par clean Pull Request kholta hai (main branch par kabhi direct push nahi karta) aur PR Gatekeeper har PR par broken SEO catch karta hai.\n• **Auto Internal Linking:** Crawled pages se contextual internal links suggest aur ship karta hai.\n• Saare tokens **AES-256-GCM** encrypted hain.`
        : `**SEOKaroAI ships approved SEO fixes safely across your stack:**\n• **WordPress & Shopify:** Review exact before/after diffs and apply with **1-click snapshot rollback**.\n• **GitHub + PR SEO Gatekeeper:** Auto-Fix opens a reviewable Pull Request on a new branch (never pushes directly to main), and the PR Gatekeeper catches missing titles, H1s, canonicals, or accidental noindex before merge.\n• **Auto Internal Linking:** Finds under-linked commercial pages and ships contextual links.\n• All credentials are **AES-256-GCM encrypted** at rest.`,
      cards: [
        {
          badge: "Integration",
          title: "WordPress Auto-Fix",
          description: "Connect via Application Password with 1-click undo rollback.",
          href: "/integrations/wordpress",
          cta: "WordPress Guide",
        },
        {
          badge: "Integration",
          title: "Shopify & GitHub PR Auto-Fix",
          description: "Safe Shopify Admin API patches & PR-only GitHub branches.",
          href: "/integrations/github",
          cta: "GitHub Integration",
        },
        {
          badge: "Trust & Safety",
          title: "Security & Rollback Architecture",
          description: "Exact scopes, AES-256-GCM encryption, and rollback guarantees.",
          href: "/security",
          cta: "Read Security Doc",
        },
      ],
      suggestions: ["Pricing & Free plan limits?", "See Audit → Fix Case Studies", "Watch 20s Video Tutorials"],
      showLeadForm: askLead,
    };
  }

  // 4. Audits / Free Checker / Core Web Vitals / PageSpeed / PDF Report
  if (/audit|check|checker|cwv|core web|pagespeed|speed|lcp|cls|schema|pdf|report|technical|crawl|sitemap/i.test(m)) {
    return {
      reply: ur
        ? `**SEOKaroAI 2 powerful audit modes deta hai:**\n• **Free Website SEO Checker:** Bina signup ke kisi bhi URL ka instant HTML, meta, H1, canonical, robots.txt, sitemap & schema check.\n• **Full AI Deep Audit:** 12+ specialist AI agents + live **Google PageSpeed Insights (CWV)**, deterministic 0–100 score, pichle audit se delta comparison, 90-day Action Plan aur branded **PDF/HTML client reports**.`
        : `**SEOKaroAI gives you instant checks and deep multi-agent audits:**\n• **Free Website SEO Checker:** No-signup live check of HTTPS, robots.txt, sitemap, title/meta, H1, canonical, and JSON-LD schema.\n• **Full AI Deep Audit:** 12+ specialist agents + automatic **Google PageSpeed Insights (CWV)**, deterministic 0–100 weighted scoring, score-delta tracking, and branded **PDF/HTML exports**.`,
      cards: [
        {
          badge: "100% Free · No Signup",
          title: "Free Website SEO Checker",
          description: "Paste any URL and get an instant live score + shareable permalink.",
          href: "/website-seo-checker",
          cta: "Run Free Check",
        },
        {
          badge: "Deep Multi-Agent Audit",
          title: "AI SEO Audit Tool",
          description: "8 weighted categories, live CWV, competitor gaps & 90-day action plan.",
          href: "/seo-audit-tool",
          cta: "Explore Audit Tool",
        },
        {
          badge: "Technical SEO",
          title: "Technical Site Audit Tool",
          description: "Crawlability, Core Web Vitals, Auto Internal Linking & PR Guard.",
          href: "/site-audit-tool",
          cta: "Explore Site Audit",
        },
      ],
      suggestions: ["How does AI Auto-Fix work?", "Pricing & Free plan limits?", "See Audit → Fix Case Studies"],
      showLeadForm: askLead,
    };
  }

  // 5. Keyword Battle / Rank Tracker / Competitors / Semrush / Ahrefs
  if (/keyword|rank|track|battle|competitor|semrush|ahrefs|serp|position|alternative|compare/i.test(m)) {
    return {
      reply: ur
        ? `**SEOKaroAI mein Rank Tracking + Competitor Keyword Battle built-in hai:**\n• **Keyword Battle:** Aapke page ko live Google Top 3 competitors se 20+ signals par compare karta hai aur exact fix + outline deta hai.\n• **Daily Rank Tracker:** Top 100 Google positions country & language ke hisaab se track karta hai with email alerts.\n• Semrush/Ahrefs ke muqable kam price mein **Audit + Rank Tracker + Auto-Fix** ek hi jagah milta hai.`
        : `**SEOKaroAI includes live SERP intelligence and daily rank tracking:**\n• **Keyword Battle:** Benchmarks your page against the live Google Top 3 across 20+ signals with exact title, heading, and content recommendations.\n• **Daily Rank Tracker:** Tracks top 100 Google positions by country & language with movers and email alerts.`,
      cards: [
        {
          badge: "Beat Top 3",
          title: "Keyword Battle",
          description: "See exactly why the Google Top 3 outrank you and how to close the gap.",
          href: "/features/keyword-battle",
          cta: "Explore Keyword Battle",
        },
        {
          badge: "Daily Positions",
          title: "Keyword Rank Tracker",
          description: "Track daily Google positions by country and language with alerts.",
          href: "/features/rank-tracker",
          cta: "Explore Rank Tracker",
        },
        {
          badge: "Comparison",
          title: "SEOKaroAI vs Semrush",
          description: "Feature, pricing, and Auto-Fix comparison vs legacy SEO suites.",
          href: "/compare/seokaroai-vs-semrush",
          cta: "Compare Now",
        },
      ],
      suggestions: ["Pricing & Free plan limits?", "Try Free Website SEO Checker", "How does AI Auto-Fix work?"],
      showLeadForm: askLead,
    };
  }

  // 6. AI Search / GEO / ChatGPT / Perplexity / llms.txt
  if (/\bgeo\b|ai search|ai overview|chatgpt|perplexity|llms\.txt|citation|citability|generative/i.test(m)) {
    return {
      reply: ur
        ? `**AI Search Optimization (GEO)** aapki site ko **Google AI Overviews, ChatGPT aur Perplexity** mein cite hone ke liye optimize karta hai — ` +
          `robots.txt AI bot access, \`llms.txt\`, structured JSON-LD schema aur crisp answer blocks check karke.`
        : `**AI Search Optimization (GEO)** prepares your pages to be quoted by **Google AI Overviews, ChatGPT, and Perplexity**—auditing AI crawler access, \`llms.txt\`, structured JSON-LD schema, and extractable answer blocks.`,
      cards: [
        {
          badge: "AI Overviews & LLMs",
          title: "AI Search Optimization (GEO)",
          description: "Audit AI crawler access, llms.txt, and entity citability across your site.",
          href: "/features/ai-search-optimization",
          cta: "Explore GEO",
        },
        {
          badge: "Real Proof",
          title: "Audit → Fix Case Studies",
          description: "See real audit findings, before/after diffs, and shipped fixes.",
          href: "/case-studies",
          cta: "View Case Studies",
        },
      ],
      suggestions: ["Try Free Website SEO Checker", "Pricing & Free plan limits?", "How does AI Auto-Fix work?"],
      showLeadForm: askLead,
    };
  }

  // 7. Tutorials / Case Studies / About / Contact / Human Support
  if (/tutorial|video|guide|walkthrough|how to use|case stud|proof|example|demo|contact|support|email|phone|whatsapp|help|human|team|rabta/i.test(m)) {
    return {
      reply: ur
        ? `Aap hamare **20-second interactive Video Tutorials** aur **Audit → Fix Case Studies** dekh sakte hain — ya neeche form fill kar dein, hamari team **info@seokaroai.com** se foran rabta karegi!`
        : `You can explore our **20-second interactive Video Tutorials** and **Audit → Fix Case Studies** below—or fill out the quick inquiry form and our team at **info@seokaroai.com** will reach out right away!`,
      cards: [
        {
          badge: "Interactive Guides",
          title: "Video Tutorials",
          description: "Short click-by-click walkthroughs of every SEOKaroAI feature.",
          href: "/tutorials",
          cta: "Watch Tutorials",
        },
        {
          badge: "Audit → Fix Proof",
          title: "Case Studies",
          description: "Real audit findings, exact before/after diffs, and shipped results.",
          href: "/case-studies",
          cta: "Read Case Studies",
        },
        {
          badge: "Direct Support",
          title: "Contact SEOKaroAI",
          description: "Reach our team directly at info@seokaroai.com.",
          href: "/contact",
          cta: "Contact Page",
        },
      ],
      suggestions: ["Pricing & Free plan limits?", "Try Free Website SEO Checker"],
      showLeadForm: true,
    };
  }

  // 8. Greetings / General "What does SEOKaroAI do?"
  if (/^(hi|hello|hey|salam|assalam|aoa|yo|good morning|good evening)\b|what does seokaro|what is seokaro|about seokaro|features|kya karta|kia krta|tell me about/i.test(m)) {
    return {
      reply: ur
        ? `Assalam-o-Alaikum! 👋 **SEOKaroAI** ek complete AI SEO platform hai jo:\n• **12+ AI agents** ke saath full technical, content, CWV & GEO audit karta hai\n• **Keyword Battle & Daily Rank Tracker** se Google rankings monitor karta hai\n• **WordPress, Shopify aur GitHub PRs** mein approved SEO fixes khud ship karta hai.\n\nNeeche kisi bhi card par click karke explore karein:`
        : `Welcome to **SEOKaroAI**! 👋 We’re an all-in-one AI SEO platform that:\n• Runs **multi-agent SEO & Core Web Vitals audits** with URL-level evidence\n• Tracks **daily Google rankings** & runs **Keyword Battles** vs the Top 3\n• Ships approved **SEO Auto-Fixes** to WordPress, Shopify & GitHub PRs.\n\nChoose a card below to jump straight in:`,
      cards: [
        {
          badge: "Free Tool",
          title: "Free Website SEO Checker",
          description: "Scan any URL right now — no signup or credit card required.",
          href: "/website-seo-checker",
          cta: "Try Free Checker",
        },
        {
          badge: "Core Platform",
          title: "AI SEO Audit & Auto-Fix",
          description: "8-category audit + safe 1-click fixes for WordPress, Shopify & GitHub.",
          href: "/seo-audit-tool",
          cta: "Explore Platform",
        },
        {
          badge: "Plans from $0/mo",
          title: "Pricing & Free Plan",
          description: "Start free forever or compare Starter, Pro, and Agency tiers.",
          href: "/pricing",
          cta: "View Pricing",
        },
      ],
      suggestions: ["Pricing & Free plan limits?", "How does AI Auto-Fix work?", "Tell me about Reddit & Quora Add-on"],
      showLeadForm: askLead,
    };
  }

  // 9. STRICT OFF-TOPIC GUARD (Weather, general knowledge, jokes, unrelated topics — ZERO LLM call!)
  return {
    reply: ur
      ? `Maazrat! Main sirf **SEOKaroAI platform** (AI SEO Audits, Free Website Checker, Auto-Fix for WordPress/Shopify/GitHub, Rank Tracking, Keyword Battle, Pricing aur Support) ke baare mein madad kar sakta hoon — bahar ke topics (jaise mosam, general chat, etc.) ka jawab nahi deta.\n\nAap SEOKaroAI ke baare mein in mein se kuch bhi pooch sakte hain:`
      : `I’m **SEOKaroAI’s dedicated product assistant**, so I can only answer questions about **SEOKaroAI**—our SEO Audits, Free Checker, WordPress/Shopify/GitHub Auto-Fix, Rank Tracker, Keyword Battle, Pricing, and Support (I can’t answer general off-topic questions like weather or news).\n\nHere are the fastest ways to explore SEOKaroAI:`,
    cards: [
      {
        badge: "Free Tool",
        title: "Free Website SEO Checker",
        description: "Check any URL’s on-page SEO, schema & crawlability in seconds.",
        href: "/website-seo-checker",
        cta: "Run Free Check",
      },
      {
        badge: "Plans & Add-ons",
        title: "SEOKaroAI Pricing",
        description: "Start free or compare Starter, Pro, Agency & Reddit/Quora Outreach.",
        href: "/pricing",
        cta: "See Pricing",
      },
      {
        badge: "Interactive Guides",
        title: "20s Video Tutorials",
        description: "See every SEOKaroAI feature in action step by step.",
        href: "/tutorials",
        cta: "Watch Tutorials",
      },
    ],
    suggestions: ["What does SEOKaroAI do?", "Pricing & Free plan limits?", "How does AI Auto-Fix work?", "Contact our team"],
    showLeadForm: false,
  };
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!rateLimit(`chatbot:${ip}`, 40, 600)) {
    return NextResponse.json({ error: "Too many messages. Please wait a few minutes or submit the inquiry form below." }, { status: 429 });
  }

  let body: { messages?: ChatMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const raw = Array.isArray(body?.messages) ? body.messages : [];
  const clean = raw
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 600) }));

  const lastUser = [...clean].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const answer = buildAnswer(lastUser, clean.length);
  return NextResponse.json(answer);
}
