export interface CompareRow {
  feature: string;
  seokaroai: string;
  competitor: string;
}

export interface ComparePageData {
  slug: string;
  competitorName: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  tldr: string;
  intro: string;
  rows: CompareRow[];
  chooseUs: string[];
  chooseThem: string[];
  faqs: { q: string; a: string }[];
}

export const COMPARE_PAGES: ComparePageData[] = [
  {
    slug: "seokaroai-vs-semrush",
    competitorName: "Semrush",
    metaTitle: "SEOKaroAI vs Semrush (2026): Audit + Auto-Fix",
    metaDescription: "Compare SEOKaroAI vs Semrush on AI SEO audits, automatic WordPress/Shopify/GitHub fixes, rank tracking, GEO and pricing.",
    h1: "SEOKaroAI vs Semrush: Stop exporting CSVs, start shipping fixes",
    tldr: "Semrush is a broad marketing suite starting at $139.95/mo that hands you lists of warnings. SEOKaroAI starts free ($39/mo Starter) and combines 12+ specialist AI audit agents with one-click Auto-Fix pull requests for GitHub, WordPress and Shopify.",
    intro: "Most teams pay for Semrush, export a 400-row site audit CSV, and watch it sit in a backlog for months. SEOKaroAI is built around closing the loop: audit with specialist AI agents, compare your page against the live top 3, and ship approved fixes directly to your CMS or repository.",
    rows: [
      { feature: "Starting price", seokaroai: "Free · Starter $39/mo", competitor: "$139.95/mo (Pro)" },
      { feature: "AI Auto-Fix (WordPress, Shopify, GitHub PR)", seokaroai: "Included with diff review & rollback", competitor: "Not included (manual fixes)" },
      { feature: "Agency-style AI Deep Audit (12+ agents)", seokaroai: "Included (Technical, Content, Schema, GEO, 90-day plan)", competitor: "Rule-based site audit checklist" },
      { feature: "Keyword Battle (Page vs Top 3 receipts)", seokaroai: "20+ signals side-by-side + copy-paste brief", competitor: "Separate Content Template add-on" },
      { feature: "AI Search / GEO readiness (llms.txt, AI bots)", seokaroai: "Built-in on every audit", competitor: "Limited / separate toolkit" },
      { feature: "Backlink database size", seokaroai: "Focused on-page + SERP gap analysis", competitor: "Massive historical backlink index" },
      { feature: "Branded PDF & HTML client reports", seokaroai: "1-click clean PDF & HTML included", competitor: "Higher tiers / add-on" },
    ],
    chooseUs: [
      "You want an SEO tool that actually proposes and ships fixes to WordPress, Shopify or GitHub via Pull Requests.",
      "You need agency-grade prioritised 90-day action plans instead of 300 raw warnings.",
      "You want predictable pricing starting at $39/mo with Free tier access and zero seat fees.",
      "You care about ranking in both Google Search and AI Overviews / ChatGPT (GEO).",
    ],
    chooseThem: [
      "You run large-scale PPC ad research, social media scheduling and historical backlink link-building campaigns.",
      "You have a dedicated SEO team that already has developers implementing manual audit tickets.",
    ],
    faqs: [
      { q: "Can SEOKaroAI replace Semrush for technical and on-page SEO?", a: "Yes. SEOKaroAI covers technical SEO audits, daily rank tracking, competitor gap analysis, content briefs and AI Auto-Fix at a fraction of Semrush's price." },
      { q: "Does SEOKaroAI push changes to my site without approval?", a: "Never. Every fix is shown side by side before anything changes. GitHub fixes arrive as a pull request on a new branch, and WordPress/Shopify edits support one-click undo." },
      { q: "Can I try SEOKaroAI without a credit card?", a: "Yes. Start on the Free plan with 1 website, 5 site audits/month, 1 keyword battle and 1 AI auto-fix, or try our no-signup Free SEO Checker." },
    ],
  },
  {
    slug: "seokaroai-vs-ahrefs",
    competitorName: "Ahrefs",
    metaTitle: "SEOKaroAI vs Ahrefs (2026): Audits That Ship",
    metaDescription: "Compare SEOKaroAI vs Ahrefs for AI SEO audits, keyword battles, daily rank tracking, automated CMS/GitHub fixes and pricing.",
    h1: "SEOKaroAI vs Ahrefs: From SEO diagnosis to shipped code",
    tldr: "Ahrefs excels at backlink research starting at $129/mo, while SEOKaroAI ($0–$39/mo) pairs deep AI multi-agent audits with Keyword Battles and automated WordPress, Shopify and GitHub PR fixes.",
    intro: "Ahrefs is famous for its backlink crawler, but diagnosing why a specific page isn't ranking — and actually fixing the titles, schema, canonicals and content gaps — still requires hours of manual work. SEOKaroAI automates both the diagnosis and the fix delivery.",
    rows: [
      { feature: "Starting price", seokaroai: "Free · Starter $39/mo", competitor: "$129/mo (Lite)" },
      { feature: "Automated CMS & GitHub PR fixes", seokaroai: "Built-in (WordPress, Shopify, GitHub)", competitor: "Not available" },
      { feature: "Multi-agent AI Deep Audit", seokaroai: "12+ parallel agents + 90-day roadmap", competitor: "Rule-based Site Audit" },
      { feature: "Page-vs-Top-3 Keyword Battle", seokaroai: "Included with competitor evidence", competitor: "Manual SERP inspection" },
      { feature: "Daily Google Rank Tracker", seokaroai: "Daily checks + email alerts (Starter+)", competitor: "Weekly on Lite; daily on higher tiers" },
      { feature: "Historical backlink index", seokaroai: "Lighter focus", competitor: "Industry-leading backlink database" },
      { feature: "AI Search (GEO) & llms.txt checks", seokaroai: "Built-in on every audit", competitor: "Not core to Site Audit" },
    ],
    chooseUs: [
      "You want actionable, prioritised fixes shipped straight to WordPress, Shopify or GitHub PRs.",
      "You want daily rank tracking and Keyword Battles without paying $129–$249/mo upfront.",
      "You want client-ready PDF/HTML reports and scheduled Monday digests out of the box.",
    ],
    chooseThem: [
      "Your primary workflow is deep link-building outreach and historical backlink forensics.",
      "You need massive keyword volume databases across dozens of markets for enterprise research.",
    ],
    faqs: [
      { q: "Why is SEOKaroAI much more affordable than Ahrefs?", a: "SEOKaroAI focuses on high-ROI execution — audits, competitor gap analysis, rank tracking and shipping fixes — rather than maintaining a multi-petabyte historical link crawler." },
      { q: "How does Keyword Battle compare to Ahrefs SERP overview?", a: "Keyword Battle fetches the top 3 ranking pages and your page, compares 20+ on-page, schema and content signals side by side, and writes ready-to-paste titles, meta and outlines backed by competitor receipts." },
    ],
  },
  {
    slug: "semrush-alternatives",
    competitorName: "Legacy SEO Suites",
    metaTitle: "Best Semrush Alternatives (2026) | SEOKaroAI",
    metaDescription: "Looking for a faster, more affordable Semrush alternative? See why founders and agencies choose SEOKaroAI for AI audits and auto-fixes.",
    h1: "The Semrush alternative built to ship SEO fixes, not spreadsheets",
    tldr: "If you're paying $140+/mo for Semrush features you rarely touch, SEOKaroAI gives you AI deep audits, daily rank tracking, Keyword Battles, GEO checks and automated WordPress/Shopify/GitHub fixes starting free ($39/mo Starter).",
    intro: "Traditional all-in-one SEO suites were designed a decade ago to generate huge tables of warnings. Modern teams need speed: know what actually moves rankings, see what the top 3 competitors do differently, and ship approved fixes in minutes.",
    rows: [
      { feature: "Monthly cost for small teams", seokaroai: "$0 Free / $39 Starter / $99 Pro", competitor: "$129–$249+/mo" },
      { feature: "Fixes shipped to WordPress/Shopify/GitHub", seokaroai: "Yes — with side-by-side diff & undo", competitor: "No — CSV export only" },
      { feature: "AI Overviews & ChatGPT (GEO) readiness", seokaroai: "Built-in (crawler access, llms.txt, citability)", competitor: "Add-ons or not included" },
      { feature: "Time from audit to 90-day plan", seokaroai: "Minutes (automated synthesis)", competitor: "Hours of manual sorting" },
      { feature: "Setup complexity", seokaroai: "Paste URL — instant results", competitor: "Steep learning curve" },
    ],
    chooseUs: [
      "Founders, SaaS teams, Shopify stores and agencies who want real rankings growth without enterprise bloat.",
      "Teams tired of paying for 40 tools when they only need audits, rankings, competitor gaps and fast fixes.",
    ],
    chooseThem: [
      "Enterprise media companies needing PPC ad spying, PR wire monitoring and massive link databases in one contract.",
    ],
    faqs: [
      { q: "How fast can I switch from Semrush to SEOKaroAI?", a: "Under 2 minutes. Add your website, paste your tracked keywords, run your first site audit, and optionally connect WordPress, Shopify or GitHub." },
      { q: "Does SEOKaroAI support multiple client websites?", a: "Yes — Starter includes 3 websites, Pro includes 10 websites, and Agency includes 30 websites with printable client PDF and HTML reports." },
    ],
  },
];

export const compareBySlug = (slug: string) => COMPARE_PAGES.find((p) => p.slug === slug);
