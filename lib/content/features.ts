/**
 * Marketing copy for feature pages. Each page targets one search intent (focus keyword) and
 * links to the others. Keep claims factual: describe what the product does, never invented stats.
 */

export interface Feature {
  slug: string;
  name: string;
  icon: string; // lucide icon name (components/icons.tsx)
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  bullets: string[];
  sections: { h2: string; body: string; points?: string[] }[];
  faqs: { q: string; a: string }[];
  cta: string;
}

export const FEATURES: Feature[] = [
  {
    slug: "seo-auto-fix",
    name: "AI Auto-Fix",
    icon: "WandSparkles",
    focusKeyword: "automatic seo fixes",
    metaTitle: "AI Auto-Fix for WordPress & Shopify | SEOKaroAI",
    metaDescription: "Connect WordPress, Shopify or a GitHub repository and let AI fix titles, meta descriptions, alt text, canonicals, sitemaps and schema. You review every change first.",
    h1: "Fix SEO issues where they live, not in a spreadsheet",
    intro: "An audit is only useful once the fixes ship. Connect your WordPress site, Shopify store or GitHub repository and SEOKaroAI turns findings into real changes: you see each one side by side, apply what you approve, and undo anything with one click.",
    bullets: [
      "WordPress: page and post titles, excerpts and image alt text through the REST API",
      "Shopify: product titles, SEO titles, meta descriptions and image alt text",
      "GitHub: AI edits your code (meta tags, canonicals, sitemap, robots, JSON-LD, alt text) and opens a pull request",
      "Nothing changes until you approve it, and CMS changes can be undone",
    ],
    sections: [
      { h2: "Review before anything changes", body: "Every proposed change shows the current value, the new value and the finding it fixes. Select the ones you want and apply them; the rest are discarded." },
      { h2: "Pull requests, never direct pushes", body: "For code, the agent works on a copy of your repository and opens a pull request on a new branch with a summary of every change. Your team reviews and merges it like any other change." },
      { h2: "Credentials stay encrypted", body: "Access tokens and application passwords are encrypted at rest and only used by our servers to talk to your site. They are never sent to an AI model." },
    ],
    faqs: [
      { q: "Will it change my site without asking?", a: "No. Auto-fix proposes changes; you apply the ones you approve. CMS changes can be undone and code changes arrive as a pull request." },
      { q: "Which permissions does it need?", a: "WordPress: an Application Password for an editor account. Shopify: a custom app token with product and content access. GitHub: a fine-grained token for one repository with contents and pull request access." },
    ],
    cta: "Connect your site",
  },
  {
    slug: "ai-seo-audit",
    name: "AI SEO Audit",
    icon: "BrainCircuit",
    focusKeyword: "AI SEO audit",
    metaTitle: "AI SEO Audit Tool: Agency-Style Site Audits",
    metaDescription: "Run an AI SEO audit with 12+ specialist agents: technical SEO, content, schema, speed, AI search, competitors and a 90-day plan.",
    h1: "An AI SEO audit that reads like an agency report",
    intro: "Most audit tools hand you a list of 200 warnings. SEOKaroAI sends a team of specialist AI agents through your site, the way an SEO agency would, and gives you a prioritised plan with the evidence behind every finding.",
    bullets: [
      "More than 12 specialist agents run in parallel: technical, content, schema, sitemap, speed, visual, AI search and more",
      "A competitor gap analysis built from the real search results for your money keywords",
      "Ready-to-use outputs: content briefs, comparison pages, a topic cluster map and a 90-day plan",
      "Every finding cites the URL and the value it observed, with an exact fix",
    ],
    sections: [
      {
        h2: "TL;DR: How SEOKaroAI's AI SEO Audit works",
        body: "SEOKaroAI combines deterministic measurement scripts (47 on-page checks, HTTPS/security headers, XML sitemap discovery, Google PageSpeed Insights Core Web Vitals, and AI crawler verification) with 12+ specialist AI agents running in parallel. Every finding cites the exact URL and observed value, calculates a reproducible weighted SEO health score out of 100, compares your pages against live ranking competitors, and outputs a phased 90-day action plan plus optional one-click Auto-Fix Pull Requests for GitHub, WordPress, and Shopify.",
      },
      {
        h2: "What the 12+ specialist agent team checks",
        body: "Instead of running one shallow checklist, SEOKaroAI dispatches dedicated specialist agents across every layer of modern search. Each agent writes its own evidence-backed report so technical regressions, thin content, broken schema, and AI search gaps are never glossed over.",
        points: [
          "Technical SEO (22% weight): crawlability, robots.txt directives, XML sitemap coverage, redirect chains, self-referencing canonicals, HTTPS/TLS certificates, and HTTP security headers (HSTS, CSP, X-Frame-Options).",
          "Content Quality & E-E-A-T (23% weight): depth vs top-ranking competitors, thin pages (<300 words), unsupported claims, author and Organization identity, topical completeness, and search-intent alignment.",
          "On-Page SEO (15% weight): title tag length (50–60 chars), meta description length (120–160 chars), H1 uniqueness and heading hierarchy, internal link equity flow, orphan pages, and descriptive anchor text.",
          "Performance & Core Web Vitals (12% weight): real Google PageSpeed Insights mobile and desktop measurements for LCP (target ≤ 2.5s), INP (≤ 200ms), CLS (≤ 0.1), FCP, and Total Blocking Time — never guessed when API keys are absent.",
          "Schema & Structured Data (10% weight): validates existing JSON-LD (Organization, WebSite, SoftwareApplication, Product/Offer, FAQPage, BreadcrumbList, BlogPosting) and generates ready-to-paste markup for missing entities.",
          "AI Search Readiness / GEO (10% weight): tests access for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, and Google-Extended, verifies llms.txt, and evaluates passage-level citability for Google AI Overviews and ChatGPT.",
          "Competitor Gap Analysis (10% weight): analyzes live SERP leaders for your money keywords, comparing word counts, FAQ coverage, comparison tables, proof artifacts, and commercial landing pages side by side.",
          "Images & Media (8% weight): checks missing alt attributes, explicit width/height dimensions to prevent CLS, modern formats (WebP/AVIF), and LCP hero image loading policies.",
        ],
      },
      {
        h2: "Deterministic weighted scoring — no black-box guesses",
        body: "Many AI audit tools invent a different score every time you click refresh. SEOKaroAI calculates your overall SEO health score using fixed category weights normalized strictly across measured categories. If a metric cannot be measured (for example, when CrUX field data is unavailable for a brand-new domain), it is marked N/A and excluded from the denominator rather than penalized as zero. Every subsequent audit automatically displays category-by-category score deltas (+/−) against your previous run so you can prove ROI after every deploy.",
      },
      {
        h2: "From audit findings to shipped fixes (WordPress, Shopify & GitHub PRs)",
        body: "The biggest bottleneck in SEO is not finding issues — it is getting engineering or content teams to ship them. SEOKaroAI turns your audit findings directly into reviewable fixes. Connect WordPress (REST API Application Password), Shopify (scoped Admin API token), or GitHub (fine-grained repository token), inspect every proposed change side by side, and ship approved edits as a clean GitHub Pull Request or instant CMS update with 1-click rollback. Developers also get our zero-AI-cost GitHub PR SEO Gatekeeper to block accidental noindex tags, missing alt attributes, or broken robots.txt rules before code merges to main.",
      },
      {
        h2: "AI Overview & LLM citation readiness (GEO testing)",
        body: "Ranking in classic blue links is only half the battle in 2026. Google AI Overviews, ChatGPT Search, and Perplexity synthesize answers from pages that expose crisp, self-contained definitions, transparent data tables, verifiable schema entities, and unrestricted AI crawler access. Every SEOKaroAI audit checks your robots.txt rules against major AI user agents, verifies your /llms.txt index, and flags vague marketing slogans that should be rewritten into direct, quotable answers.",
      },
      {
        h2: "Quick audits for weekly monitoring, AI deep audits for 90-day strategy",
        body: "A Site Audit runs 47 deterministic on-page checks plus security, sitemap, PageSpeed, and AI-readiness checks in under two minutes with zero AI credit cost — ideal for automated weekly regression monitoring and pre-launch checks. Run an AI Deep Audit when you need full agency-level strategy: competitor gap analysis, content briefs, topic cluster maps, competitor comparison page drafts, and a dependency-ordered 90-day action plan exported as a branded client-ready PDF or self-contained HTML report.",
      },
    ],
    faqs: [
      { q: "How long does an AI SEO audit take?", a: "A quick site audit takes 1 to 2 minutes. A full AI deep audit runs 12+ specialist agents in parallel and typically finishes in 10 to 25 minutes. You can close the tab and SEOKaroAI emails you as soon as the report is ready." },
      { q: "Do I need to install a plugin or script on my website?", a: "No. Audits crawl your public pages exactly the way Googlebot and AI crawlers do. You only connect WordPress, Shopify, or GitHub later if you want to ship fixes via AI Auto-Fix." },
      { q: "Is the AI making up metrics or guessing Core Web Vitals?", a: "No. Every measurement comes from real HTTP fetches, HTML/schema parsers, and Google PageSpeed Insights v5 (mobile and desktop). Any metric that cannot be measured is clearly marked N/A and excluded from your score." },
      { q: "How is SEOKaroAI different from Semrush or Ahrefs Site Audit?", a: "Semrush and Ahrefs give you hundreds of raw warnings in a CSV. SEOKaroAI prioritizes findings into a 90-day roadmap, compares your pages against the live top 3 competitors, and ships approved fixes directly via GitHub Pull Requests, WordPress, or Shopify — starting at $39/mo instead of $129–$139/mo." },
      { q: "Can I export branded PDF and HTML reports for clients?", a: "Yes. Every Site Audit, AI Deep Audit, and Keyword Battle includes one-click clean white-paper Save as PDF and self-contained HTML exports ready to send to clients or stakeholders." },
    ],
    cta: "Run your first audit",
  },
  {
    slug: "keyword-battle",
    name: "Keyword Battle",
    icon: "Swords",
    focusKeyword: "competitor keyword analysis",
    metaTitle: "Keyword Battle: Beat the Top 3 Google Results",
    metaDescription: "Compare your page against the top 3 Google results across 20+ signals and get competitor-backed SEO fixes to climb the SERP.",
    h1: "See exactly why the top 3 outrank your page",
    intro: "Generic SEO advice tells you to “write better content”. Keyword Battle measures the three pages that rank above you and your own page in exactly the same way, then tells you what to change, with the competitor evidence next to every recommendation.",
    bullets: [
      "The live Google top 10 for your keyword, country and language",
      "20+ signals compared side by side: content depth, headings, schema, FAQs, media, links, trust, speed",
      "A subtopic matrix that shows what the winners cover and you do not",
      "Ready-to-paste title, meta description, H1 and outline",
    ],
    sections: [
      {
        h2: "Search intent first",
        body: "If Google ranks comparison guides and your page is a product page, no amount of on-page tuning will fix it. Every battle starts by classifying the winning page type and telling you if yours matches.",
      },
      {
        h2: "Recommendations with receipts",
        body: "Each recommendation names the competitor, the observed value and what your page has today. For example: “#1 has a 12-row comparison table under the H2 ‘Sizes’; your page has none.” You decide with evidence, not opinions.",
      },
      {
        h2: "Made for the page you want to rank",
        body: "Run a battle for any keyword you track, straight from the rank tracker. When a keyword slips, find out what the new winners did.",
      },
    ],
    faqs: [
      { q: "Where does the ranking data come from?", a: "When live SERP data is enabled we use the live Google results for your country and language. Otherwise the report clearly labels the results as web-search based and directional." },
      { q: "Can I run it for a page that is not ranking at all?", a: "Yes. That is the most useful case: you see what the winning pages have in common before you rewrite yours." },
    ],
    cta: "Start a keyword battle",
  },
  {
    slug: "rank-tracker",
    name: "Rank Tracker",
    icon: "TrendingUp",
    focusKeyword: "keyword rank tracker",
    metaTitle: "Keyword Rank Tracker: Daily Google Positions and Alerts",
    metaDescription: "Track your Google rankings daily or weekly by country and language. See movers, best positions, ranking URLs and who holds the top 10, with email alerts.",
    h1: "A keyword rank tracker that tells you what changed",
    intro: "Add your keywords once. SEOKaroAI checks Google for each one on your schedule, keeps the history, and emails you when a keyword jumps or drops.",
    bullets: [
      "Daily or weekly checks in the country and language you choose",
      "Position history, best position and the exact URL that ranks",
      "The top 10 for every keyword, so you see who you are up against",
      "Alerts for moves of 3+ places and for entering or leaving the top 10",
    ],
    sections: [
      { h2: "Ranking status at a glance", body: "Every project shows how many keywords sit in the top 3, top 10 and top 100, what moved since the last check, and which pages earn the rankings." },
      { h2: "From a drop to a fix in one click", body: "When a keyword falls, start a Keyword Battle from the same row to see what the pages above you now do differently." },
      { h2: "Weekly email report", body: "Every Monday you get a short email with each website's score, top-10 count and the week's movers. Turn it off anytime in settings." },
    ],
    faqs: [
      { q: "How often are rankings checked?", a: "Daily or weekly, depending on your plan and the setting on each project." },
      { q: "Can I track rankings in a specific country?", a: "Yes. Each project has a country and a language, and every keyword is checked for that market." },
    ],
    cta: "Track your keywords",
  },
  {
    slug: "ai-search-optimization",
    name: "AI Search Optimization",
    icon: "Sparkles",
    focusKeyword: "generative engine optimization",
    metaTitle: "AI Search Optimization (GEO) for AI Overviews",
    metaDescription: "Check AI crawler access, llms.txt and passage citability so your pages get cited in Google AI Overviews, ChatGPT and Perplexity.",
    h1: "Be the answer AI search engines quote",
    intro: "Google AI Overviews, ChatGPT and Perplexity answer questions by quoting pages they can read and trust. Generative engine optimization (GEO) makes sure your pages are one of them.",
    bullets: [
      "AI crawler access: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and Google-Extended",
      "llms.txt, Markdown delivery and agent readiness checks",
      "Passage-level citability: direct answers, definitions, sourced statistics",
      "Entity clarity: who you are, consistently, across your site and profiles",
    ],
    sections: [
      { h2: "Can AI engines read you?", body: "Many sites block AI crawlers by accident through robots.txt or a firewall rule. The audit lists every AI user agent and whether it can reach your pages." },
      { h2: "Are your pages quotable?", body: "AI answers lift short, self-contained passages. We flag headings that are slogans instead of questions, answers hidden behind clicks, and statistics without a source." },
      { h2: "Do engines know who you are?", body: "Consistent organization details, sameAs profiles and named authors help AI systems connect your brand to your expertise." },
    ],
    faqs: [
      { q: "Does llms.txt improve Google rankings?", a: "No. Google Search ignores llms.txt. It can help some AI tools and agents find your key pages, so we check it as an optional extra, not a ranking factor." },
      { q: "Is GEO different from SEO?", a: "It builds on SEO. Pages that rank and are clearly structured are also the ones AI answers quote most often." },
    ],
    cta: "Check your AI search readiness",
  },
  {
    slug: "seo-reports",
    name: "Automated SEO Reports",
    icon: "FileChartColumn",
    focusKeyword: "automated SEO reports",
    metaTitle: "Automated SEO Reports & Scheduled Audits",
    metaDescription: "Schedule weekly or monthly SEO audits, track score history, get Monday email summaries and export clean PDF/HTML client reports.",
    h1: "SEO reporting that runs itself",
    intro: "Set each website to audit itself weekly or monthly. SEOKaroAI tracks the score over time, warns you when something breaks, and sends a short report every Monday.",
    bullets: [
      "Scheduled audits per website: weekly or monthly",
      "Score history and what got better or worse between audits",
      "An email when a scheduled audit finds the site got worse",
      "Printable reports you can save as PDF and send to a client",
    ],
    sections: [
      { h2: "Catch regressions before Google does", body: "A deploy that removes canonical tags, breaks the sitemap or blocks crawlers shows up in the next scheduled audit, not three weeks later in lost traffic." },
      { h2: "Reports for clients and managers", body: "Every report opens with the score, the top issues and quick wins, followed by the details for whoever does the work." },
    ],
    faqs: [
      { q: "Do scheduled audits use my AI credits?", a: "No. Scheduled audits are quick audits, which run measurement tools without AI. They count toward your monthly site audits." },
    ],
    cta: "Automate your SEO reporting",
  },
  {
    slug: "website-seo-checker",
    name: "Free SEO Checker",
    icon: "SearchCheck",
    focusKeyword: "website SEO checker",
    metaTitle: "Free Website SEO Checker — Instant Audit",
    metaDescription: "Run an instant, no-signup SEO check for any URL: titles, meta, headings, canonicals, HTTPS, robots.txt and sitemap with a shareable link.",
    h1: "Free website SEO checker",
    intro: "Run an instant check for any public URL — no signup required. Results are fast, shareable, and highlight the top issues with clear next steps.",
    bullets: [
      "Instant results for any URL — no account or card required",
      "Shareable results URL so you can send findings to a teammate or client",
      "What we check: titles, meta descriptions, headings, images, links, canonicals, HTTPS, robots.txt, sitemap and AI crawler access",
      "A short, prioritised list of fixes with the evidence and the exact element to change",
    ],
    sections: [
      { h2: "What you get in the free check", body: "A fast summary: a score, the most important issues and exact fixes you can hand to a developer or editor. A shareable permalink saves the report for later." },
      { h2: "When to run it", body: "Use the instant check for pre-launch reviews, competitor spot checks, and to confirm a deploy didn’t introduce regressions." },
    ],
    faqs: [
      { q: "Is the SEO checker really free?", a: "Yes. The instant check is free and needs no card. Create an account if you want scheduled audits, more tracked keywords and saved projects." },
    ],
    cta: "Run an instant check",
  },
];

export const featureBySlug = (slug: string) => FEATURES.find((f) => f.slug === slug);

export const HOME_FAQS = [
  { q: "What is SEOKaroAI?", a: "SEOKaroAI is an SEO platform that audits your website with a team of AI agents, tracks your Google rankings, and compares your pages with the ones that outrank them, then tells you exactly what to fix." },
  { q: "Who is it for?", a: "Business owners who want to rank their own site, in-house marketers, and agencies that manage SEO for clients. Plans scale from one website to thirty." },
  { q: "How is this different from other SEO tools?", a: "Instead of long lists of warnings, you get prioritised findings with evidence, competitor-backed recommendations, and ready-to-use outputs such as content briefs and comparison pages." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from the billing page; your plan stays active until the end of the period you paid for, then moves to Free." },
  { q: "Do you change anything on my website?", a: "No. SEOKaroAI only reads your public pages. You stay in full control of every change." },
];
