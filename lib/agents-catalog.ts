/**
 * The agent team behind an AI deep audit, in the order they appear. `id` is the sub-agent type
 * the orchestrator spawns (matched against live events); `file` is the report it writes, which
 * also marks the agent done on the live board.
 */

export interface AgentInfo {
  id: string;
  name: string;
  icon: string;
  phase: "Plan" | "Specialists" | "Strategy" | "Report";
  role: string;
  checks: string[];
  file: string;
  when?: string; // only for some sites
}

export const AGENTS: AgentInfo[] = [
  {
    id: "orchestrator", name: "Lead strategist", icon: "Workflow", phase: "Plan", file: "CONTEXT.md",
    role: "Reads the homepage, robots.txt and sitemaps, detects the business type, picks the pages to audit and briefs every specialist.",
    checks: ["Business type and market", "Representative sample pages", "Available data sources"],
  },
  {
    id: "seo-technical", name: "Technical SEO", icon: "Code2", phase: "Specialists", file: "findings/technical.md",
    role: "Makes sure search engines can reach, read and index every important page.",
    checks: ["Crawlability and robots.txt", "Indexability, canonicals, noindex", "Redirects and status codes", "HTTPS and security headers", "JavaScript rendering", "Mobile viewport"],
  },
  {
    id: "seo-content", name: "Content & E-E-A-T", icon: "FileText", phase: "Specialists", file: "findings/content.md",
    role: "Judges whether the content deserves to rank: expertise, trust, depth and honesty.",
    checks: ["Experience, expertise, authority, trust", "Thin and duplicate pages", "Unsupported claims", "Authors and company identity", "Readability"],
  },
  {
    id: "seo-schema", name: "Schema", icon: "Layers", phase: "Specialists", file: "findings/schema.md",
    role: "Validates structured data and writes ready-to-paste JSON-LD for what is missing.",
    checks: ["Organization, Product, Article markup", "Errors and contradictions with the page", "Rich result eligibility"],
  },
  {
    id: "seo-sitemap", name: "Sitemap", icon: "Map", phase: "Specialists", file: "findings/sitemap.md",
    role: "Checks that sitemaps list every page that should rank and nothing that should not.",
    checks: ["Sitemap discovery and format", "Missing and orphan pages", "lastmod quality", "Non-indexable URLs"],
  },
  {
    id: "seo-performance", name: "Performance", icon: "Gauge", phase: "Specialists", file: "findings/performance.md",
    role: "Measures speed and Core Web Vitals and finds the code that slows pages down.",
    checks: ["LCP, INP, CLS", "Page weight and JavaScript", "Fonts and images", "Render-blocking resources"],
  },
  {
    id: "seo-visual", name: "Visual & mobile", icon: "Target", phase: "Specialists", file: "findings/visual.md",
    role: "Takes desktop, tablet and mobile screenshots and reviews what visitors see first.",
    checks: ["Above-the-fold message and CTA", "Mobile layout and tap targets", "Intrusive popups", "Trust signals"],
  },
  {
    id: "seo-geo", name: "AI search (GEO)", icon: "Sparkles", phase: "Specialists", file: "findings/geo.md",
    role: "Gets the site cited by Google AI Overviews, ChatGPT and Perplexity.",
    checks: ["AI crawler access", "Quotable passages", "Entity clarity", "Brand mentions"],
  },
  {
    id: "seo-agentic", name: "Agent readiness", icon: "Bot", phase: "Specialists", file: "findings/agentic.md",
    role: "Checks whether AI agents can use the site: llms.txt, Markdown, accessibility tree, WebMCP.",
    checks: ["robots.txt for agents", "llms.txt", "Accessibility tree", "Discovery files"],
  },
  {
    id: "seo-backlinks", name: "Backlinks", icon: "Globe", phase: "Specialists", file: "findings/backlinks.md",
    role: "Profiles the site's authority from link data.",
    checks: ["Domain-level authority", "Referring domains", "Risky links"],
  },
  {
    id: "seo-sxo", name: "Search experience", icon: "SearchCheck", phase: "Specialists", file: "findings/sxo.md",
    role: "Compares your page types with what Google actually ranks and scores pages from real personas.",
    checks: ["Search intent match", "Missing page types", "Persona scoring"],
  },
  {
    id: "seo-ecommerce", name: "E-commerce", icon: "ShoppingBag", phase: "Specialists", file: "findings/ecommerce.md", when: "stores",
    role: "Audits product pages, product schema and shopping visibility.",
    checks: ["Product schema", "Category and product content", "Shopping signals"],
  },
  {
    id: "seo-local", name: "Local SEO", icon: "Map", phase: "Specialists", file: "findings/local.md", when: "local businesses",
    role: "Checks Google Business Profile signals, NAP consistency, reviews and local schema.",
    checks: ["NAP consistency", "Local schema", "Reviews", "Location pages"],
  },
  {
    id: "competitors", name: "Competitor analyst", icon: "Swords", phase: "Strategy", file: "findings/competitors.md",
    role: "Finds who ranks for your money keywords and measures them side by side with you.",
    checks: ["Keyword to winner map", "Page-by-page comparison", "What they do that you don't"],
  },
  {
    id: "seo-cluster", name: "Topic clusters", icon: "Layers", phase: "Strategy", file: "flows/cluster/cluster-plan.md",
    role: "Groups keywords by search results and designs the pillar-and-spoke content plan.",
    checks: ["Keyword clusters", "Pillar and spokes", "Internal link map"],
  },
  {
    id: "briefs", name: "Content briefs", icon: "Newspaper", phase: "Strategy", file: "flows/content-briefs",
    role: "Writes ready-to-use briefs and comparison pages for the biggest gaps.",
    checks: ["Target keyword and intent", "Outline with word counts", "Comparison pages"],
  },
  {
    id: "synthesis", name: "Report & plan", icon: "ListChecks", phase: "Report", file: "audit-data.json",
    role: "Scores every category, ranks findings by impact and writes the phased action plan.",
    checks: ["SEO health score", "Critical to low priorities", "90-day action plan", "PDF and HTML report"],
  },
];

export const PHASES: AgentInfo["phase"][] = ["Plan", "Specialists", "Strategy", "Report"];
