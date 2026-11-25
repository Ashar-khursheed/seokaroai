/**
 * Interactive video tutorials covering the entire SEOKaroAI workflow — from adding a website
 * to shipping AI Auto-Fix pull requests, winning Keyword Battles, and automated weekly reports.
 */

export type TutorialCategory = "Getting Started" | "Audits" | "Auto-Fix" | "Rankings" | "AI Search" | "Reporting";

export interface TutorialStep {
  title: string;
  caption: string;
  durationSec: number;
}

export interface Tutorial {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  category: TutorialCategory;
  icon: string;
  durationLabel: string;
  summary: string;
  featureHref: string;
  tryHref: string;
  accentFrom: string;
  accentTo: string;
  /** Optional custom MP4/WebM URL if you ever replace an interactive walkthrough with a recorded video. */
  videoUrl?: string;
  steps: TutorialStep[];
}

export const TUTORIAL_CATEGORIES: ("All" | TutorialCategory)[] = [
  "All",
  "Getting Started",
  "Audits",
  "Auto-Fix",
  "Rankings",
  "AI Search",
  "Reporting",
];

export const TUTORIALS: Tutorial[] = [
  {
    slug: "getting-started",
    number: "01",
    title: "Add Your Website & Run Your First Site Audit",
    shortTitle: "Quick Start & Site Audit",
    category: "Getting Started",
    icon: "Rocket",
    durationLabel: "0:20",
    summary: "Add your domain, pick your target country and language, and run 47 on-page, security, sitemap and speed checks in under a minute.",
    featureHref: "/features/ai-seo-audit",
    tryHref: "/app/projects/new",
    accentFrom: "#1f86ff",
    accentTo: "#2dd4bf",
    steps: [
      { title: "Add website URL", caption: "Enter your domain, target country and language in Add Website.", durationSec: 5 },
      { title: "Run 47 site checks", caption: "SEOKaroAI crawls pages, checks meta tags, HTTPS, sitemap and Core Web Vitals.", durationSec: 5 },
      { title: "Review SEO score", caption: "Your live health score ring and category breakdown appear automatically.", durationSec: 5 },
      { title: "Start with quick wins", caption: "Prioritised issues show exact URLs and fixes so you know what to tackle first.", durationSec: 5 },
    ],
  },
  {
    slug: "ai-seo-audit",
    number: "02",
    title: "AI Deep Audit: 12+ Specialist Agents in Parallel",
    shortTitle: "AI Deep Audit",
    category: "Audits",
    icon: "BrainCircuit",
    durationLabel: "0:24",
    summary: "Launch a full agency-style audit where specialist agents inspect technical SEO, content, schema, GEO and competitors simultaneously.",
    featureHref: "/features/ai-seo-audit",
    tryHref: "/app",
    accentFrom: "#6366f1",
    accentTo: "#1f86ff",
    steps: [
      { title: "Choose audit flows", caption: "Select your project, optional competitors and flows, then click Start AI Deep Audit.", durationSec: 6 },
      { title: "Watch agents work live", caption: "12+ specialist agents run in parallel on the live Agent Board.", durationSec: 6 },
      { title: "Inspect category scores", caption: "Every category gets a score, evidence citations and exact developer fixes.", durationSec: 6 },
      { title: "Export 90-day Action Plan", caption: "Get a phased 90-day roadmap, content briefs and printable PDF report.", durationSec: 6 },
    ],
  },
  {
    slug: "seo-auto-fix",
    number: "03",
    title: "AI Auto-Fix: Ship Fixes via GitHub PR, WordPress & Shopify",
    shortTitle: "AI Auto-Fix & PRs",
    category: "Auto-Fix",
    icon: "WandSparkles",
    durationLabel: "0:24",
    summary: "Connect WordPress, Shopify or GitHub once, review every AI-proposed change side by side, and ship a pull request or live fix in one click.",
    featureHref: "/features/seo-auto-fix",
    tryHref: "/app",
    accentFrom: "#10b981",
    accentTo: "#1f86ff",
    steps: [
      { title: "Connect your platform", caption: "Add a WordPress App Password, Shopify token or GitHub fine-grained token.", durationSec: 6 },
      { title: "AI prepares exact edits", caption: "The agent fixes titles, meta descriptions, canonicals, schema and alt text safely.", durationSec: 6 },
      { title: "Review diffs side by side", caption: "Tick only the changes you approve — nothing ships without your review.", durationSec: 6 },
      { title: "Create pull request", caption: "Click Create pull request to open a clean PR on GitHub (or apply & undo on CMS).", durationSec: 6 },
    ],
  },
  {
    slug: "keyword-battle",
    number: "04",
    title: "Keyword Battle: Beat the Top 3 Pages on Google",
    shortTitle: "Keyword Battle",
    category: "Rankings",
    icon: "Swords",
    durationLabel: "0:22",
    summary: "Compare your page against the top 3 Google results across 20+ signals and get competitor-backed fixes to climb the SERP.",
    featureHref: "/features/keyword-battle",
    tryHref: "/app/battles/new",
    accentFrom: "#f59e0b",
    accentTo: "#f43f5e",
    steps: [
      { title: "Pick keyword & page", caption: "Enter the keyword you want to rank for, your page URL and target market.", durationSec: 5 },
      { title: "Fetch live Google top 10", caption: "SEOKaroAI pulls the live SERP and measures the top 3 winning pages.", durationSec: 6 },
      { title: "Compare 20+ signals", caption: "See word count, FAQs, schema, tables and subtopics side by side.", durationSec: 6 },
      { title: "Apply winning brief", caption: "Copy the ready-to-paste title, meta, H1 and section outline backed by evidence.", durationSec: 5 },
    ],
  },
  {
    slug: "rank-tracker",
    number: "05",
    title: "Daily Rank Tracker, History & Position Alerts",
    shortTitle: "Rank Tracker",
    category: "Rankings",
    icon: "TrendingUp",
    durationLabel: "0:20",
    summary: "Track Google positions daily or weekly by country and language, spot biggest movers, and launch a Keyword Battle on any drop.",
    featureHref: "/features/rank-tracker",
    tryHref: "/app",
    accentFrom: "#0ea5e9",
    accentTo: "#10b981",
    steps: [
      { title: "Add target keywords", caption: "Paste your keywords once under Rankings — duplicates are filtered automatically.", durationSec: 5 },
      { title: "Track top 100 daily", caption: "SEOKaroAI checks live Google positions and records the exact ranking URL.", durationSec: 5 },
      { title: "Spot biggest movers", caption: "View 30-day sparkline trends, best positions and who currently holds #1.", durationSec: 5 },
      { title: "Instant email alerts", caption: "Get notified on 3+ place moves or when a keyword enters or leaves the top 10.", durationSec: 5 },
    ],
  },
  {
    slug: "ai-search-optimization",
    number: "06",
    title: "AI Search Optimization (GEO) for ChatGPT & AI Overviews",
    shortTitle: "AI Search (GEO)",
    category: "AI Search",
    icon: "Sparkles",
    durationLabel: "0:20",
    summary: "Verify AI crawler access, check llms.txt and passage citability, and optimize your brand entities for AI Overviews and LLMs.",
    featureHref: "/features/ai-search-optimization",
    tryHref: "/app",
    accentFrom: "#8b5cf6",
    accentTo: "#ec4899",
    steps: [
      { title: "Test AI crawlers", caption: "Check whether GPTBot, ClaudeBot, PerplexityBot and Google-Extended can crawl you.", durationSec: 5 },
      { title: "Check llms.txt & schema", caption: "Validate llms.txt, Organization identity and sameAs brand profiles.", durationSec: 5 },
      { title: "Score passage citability", caption: "Spot vague headings and convert them into clear, quotable direct answers.", durationSec: 5 },
      { title: "Ship GEO fixes", caption: "Apply structured data and content updates so AI engines cite your pages.", durationSec: 5 },
    ],
  },
  {
    slug: "seo-reports",
    number: "07",
    title: "Automated Weekly Reports & Client-Ready PDF Exports",
    shortTitle: "Automated Reports",
    category: "Reporting",
    icon: "FileChartColumn",
    durationLabel: "0:18",
    summary: "Schedule weekly or monthly audits, track score history over time, receive Monday email summaries and export clean PDFs for clients.",
    featureHref: "/features/seo-reports",
    tryHref: "/app/runs",
    accentFrom: "#3b82f6",
    accentTo: "#06b6d4",
    steps: [
      { title: "Turn on auto-audits", caption: "Pick weekly or monthly automatic audits in your project settings.", durationSec: 4 },
      { title: "Track score history", caption: "Monitor health score trends across deploys to catch SEO regressions early.", durationSec: 5 },
      { title: "Monday email digest", caption: "Receive a concise Monday summary of scores, top-10 counts and movers.", durationSec: 4 },
      { title: "Export client PDF", caption: "Print or download clean, shareable reports for teammates and clients.", durationSec: 5 },
    ],
  },
  {
    slug: "website-seo-checker",
    number: "08",
    title: "Free Instant SEO Checker (No Signup Needed)",
    shortTitle: "Free SEO Checker",
    category: "Getting Started",
    icon: "SearchCheck",
    durationLabel: "0:18",
    summary: "Paste any public URL to get an instant SEO snapshot with a shareable results link — great for pre-launch checks and prospects.",
    featureHref: "/features/website-seo-checker",
    tryHref: "/features/website-seo-checker",
    accentFrom: "#14b8a6",
    accentTo: "#3b82f6",
    steps: [
      { title: "Open Free Checker", caption: "Visit the Free Website SEO Checker page — no account or card required.", durationSec: 4 },
      { title: "Paste any URL", caption: "Type any public website URL and click Run instant check.", durationSec: 5 },
      { title: "Inspect instant results", caption: "Review title, meta, headings, canonical, HTTPS, robots.txt and sitemap.", durationSec: 5 },
      { title: "Share permalink", caption: "Copy the shareable results URL to send directly to a teammate or client.", durationSec: 4 },
    ],
  },
];

export const totalDurationSec = (t: Tutorial) => t.steps.reduce((a, s) => a + s.durationSec, 0);
