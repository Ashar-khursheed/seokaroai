import os from "node:os";
import path from "node:path";

const env = process.env;

/** Runtime configuration, read from environment variables (.env.local). */
export const config = {
  siteName: "SEOKaroAI",
  appUrl: (env.APP_URL || "http://localhost:3100").replace(/\/$/, ""),
  supportEmail: env.SUPPORT_EMAIL || "support@seokaroai.com",
  adminEmails: (env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
  sessionSecret: env.SESSION_SECRET || "",
  isProd: env.NODE_ENV === "production",

  dataDir: path.resolve(/*turbopackIgnore: true*/ env.SEO_STUDIO_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data")),
  workerEnabled: env.WORKER_ENABLED !== "0",
  model: env.SEO_MODEL || "claude-sonnet-5-5",
  maxAgentRuns: Math.max(1, Number(env.SEO_MAX_CONCURRENT || 1)),
  maxQuickRuns: Math.max(1, Number(env.SEO_MAX_QUICK_CONCURRENT || 2)),

  /** Canonical launcher for the bundled claude-seo Python tools. */
  launcher: '"$HOME/.claude/skills/seo/scripts/claude-seo"',
  launcherPath: env.CLAUDE_SEO_LAUNCHER || path.join(os.homedir(), ".claude", "skills", "seo", "scripts", "claude-seo"),
  googleApiKey: env.GOOGLE_API_KEY || "",

  dataforseo:
    env.DATAFORSEO_LOGIN && env.DATAFORSEO_PASSWORD
      ? { login: env.DATAFORSEO_LOGIN, password: env.DATAFORSEO_PASSWORD }
      : null,

  smtp: env.SMTP_HOST
    ? {
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT || 587),
        secure: env.SMTP_SECURE === "1" || Number(env.SMTP_PORT) === 465,
        user: env.SMTP_USER || "",
        pass: env.SMTP_PASSWORD || "",
      }
    : null,
  mailFrom: env.MAIL_FROM || "SEOKaroAI <no-reply@seokaroai.com>",

  paddle: {
    env: (env.PADDLE_ENV === "production" ? "production" : "sandbox") as "production" | "sandbox",
    apiKey: env.PADDLE_API_KEY || "",
    clientToken: env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || env.PADDLE_CLIENT_TOKEN || "",
    webhookSecret: env.PADDLE_WEBHOOK_SECRET || "",
    prices: {
      starter_monthly: env.PADDLE_PRICE_STARTER_MONTHLY || "",
      starter_yearly: env.PADDLE_PRICE_STARTER_YEARLY || "",
      pro_monthly: env.PADDLE_PRICE_PRO_MONTHLY || "",
      pro_yearly: env.PADDLE_PRICE_PRO_YEARLY || "",
      agency_monthly: env.PADDLE_PRICE_AGENCY_MONTHLY || "",
      agency_yearly: env.PADDLE_PRICE_AGENCY_YEARLY || "",
    } as Record<string, string>,
  },
};

export const MODELS = [
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5 (balanced)" },
  { id: "claude-opus-5-5", label: "Opus 5.5 (deepest)" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5 (fastest)" },
];

export const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India", "Pakistan", "United Arab Emirates",
  "Saudi Arabia", "Qatar", "Germany", "France", "Spain", "Italy", "Netherlands", "Singapore", "Malaysia",
  "South Africa", "Nigeria", "Brazil", "Mexico", "Turkey", "Egypt", "Bangladesh", "Indonesia", "Philippines",
];
export const LANGUAGES = ["English", "Arabic", "Urdu", "Hindi", "Spanish", "French", "German", "Portuguese", "Turkish", "Italian", "Dutch", "Indonesian"];
