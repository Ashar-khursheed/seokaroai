export interface IntegrationPageData {
  slug: string;
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  tldr: string;
  whatItFixes: string[];
  steps: { title: string; detail: string }[];
  diffLabel: string;
  diffOld: string;
  diffNew: string;
  securityPoints: string[];
  faqs: { q: string; a: string }[];
}

export const INTEGRATION_PAGES: IntegrationPageData[] = [
  {
    slug: "wordpress",
    name: "WordPress",
    icon: "Globe",
    metaTitle: "WordPress AI SEO Auto-Fix | SEOKaroAI",
    metaDescription: "Connect WordPress with an Application Password and let SEOKaroAI propose and apply SEO titles, excerpts and alt text with 1-click undo.",
    h1: "Ship SEO fixes straight to WordPress — with 1-click undo",
    tldr: "Connect your WordPress site via the standard REST API using an Application Password. SEOKaroAI proposes exact title, excerpt and image alt text fixes side by side, applies only what you approve, and lets you undo any edit in one click.",
    whatItFixes: [
      "Page and post SEO titles trimmed to optimal SERP length (50–60 chars)",
      "Post excerpts and meta descriptions rewritten for click-through rate",
      "Missing or generic media library image alt text filled from page context",
      "Thin or duplicate headings flagged with ready-to-apply suggestions",
    ],
    steps: [
      { title: "Create an Application Password", detail: "In WordPress Admin → Users → Profile → Application Passwords, generate a dedicated password for SEOKaroAI." },
      { title: "Connect in Project → Connect & fix", detail: "Paste your site URL, WordPress username and Application Password, then click Save & test." },
      { title: "Run AI Auto-Fix", detail: "SEOKaroAI inspects your audit findings and proposes exact before/after edits for your pages, posts and media." },
      { title: "Approve, apply or undo", detail: "Tick only the fixes you want and click Apply. Every applied edit stores the original value for instant 1-click rollback." },
    ],
    diffLabel: "WordPress Post #142 · SEO Title & Alt Text",
    diffOld: "- Home | My Blog — Welcome to our official website and store",
    diffNew: "+ Commercial Espresso Machines & Grinders | 2-Year Warranty",
    securityPoints: [
      "Application Passwords are encrypted at rest with AES-256-GCM and never sent to any AI model.",
      "Zero plugin installation required — works cleanly through WordPress core REST API over HTTPS.",
      "Nothing changes until you tick and approve each item; every change stores its exact old value for 1-click undo.",
      "Revoke access anytime from your WordPress user profile without touching SEOKaroAI.",
    ],
    faqs: [
      { q: "Do I need to install a WordPress plugin?", a: "No. SEOKaroAI connects using WordPress's built-in REST API and an Application Password, so there is zero plugin bloat." },
      { q: "Can I undo a fix after applying it?", a: "Yes. Every applied WordPress change stores the previous value in SEOKaroAI so you can revert it with one click." },
    ],
  },
  {
    slug: "shopify",
    name: "Shopify",
    icon: "ShoppingBag",
    metaTitle: "Shopify AI SEO Auto-Fix | SEOKaroAI",
    metaDescription: "Connect your Shopify store via Admin API and fix product SEO titles, meta descriptions and image alt text with side-by-side review and undo.",
    h1: "Fix Shopify product SEO at scale without touching spreadsheets",
    tldr: "Connect your Shopify store with a scoped Custom App Admin API token. SEOKaroAI proposes product SEO titles, meta descriptions and image alt text side by side, applies approved edits cleanly, and keeps 1-click rollback.",
    whatItFixes: [
      "Product SEO titles optimized for buyer-intent search queries",
      "Product meta descriptions rewritten with specs, shipping and warranty hooks",
      "Missing product image alt text generated accurately from product details",
      "Collection and page metadata cleaned up for higher organic CTR",
    ],
    steps: [
      { title: "Create a scoped Shopify Custom App", detail: "In Shopify Admin → Settings → Apps and sales channels → Develop apps, create an app with read/write access to products and content." },
      { title: "Paste store domain & Admin API token", detail: "Enter your-store.myshopify.com and the Admin API access token under Project → Connect & fix." },
      { title: "Review proposed fixes", detail: "Inspect every product's old vs new SEO title, meta description and alt text side by side." },
      { title: "Apply with 1-click rollback", detail: "Approve the changes you want to ship live; revert any individual field back to its original value anytime." },
    ],
    diffLabel: "Shopify Product · Commercial Coffee Grinder · seo_description",
    diffOld: "- Buy now. Best price. Free shipping.",
    diffNew: "+ Commercial coffee grinder with 64mm flat burrs and 1.2kg hopper. Ships in 48h with a 2-year warranty.",
    securityPoints: [
      "Admin API tokens are AES-256-GCM encrypted at rest and never exposed to AI models or client browsers.",
      "Least-privilege scopes: only product and content metadata — never orders, payouts or customer PII.",
      "Full side-by-side approval queue and 1-click undo for every applied change.",
    ],
    faqs: [
      { q: "Will SEOKaroAI touch my Shopify theme Liquid code?", a: "No. The Shopify connector only updates product/page metadata and image alt text through the Admin API. For code edits, connect your theme's GitHub repository for Pull Requests." },
      { q: "Can I test it on one product first?", a: "Yes. Every proposed edit has its own checkbox so you can approve 1 product or 50 at once." },
    ],
  },
  {
    slug: "github",
    name: "GitHub",
    icon: "GitPullRequest",
    metaTitle: "GitHub SEO Auto-Fix Pull Requests | SEOKaroAI",
    metaDescription: "Connect a GitHub repo with a fine-grained token. SEOKaroAI fixes meta tags, canonicals, JSON-LD, sitemaps and alt text in a clean Pull Request.",
    h1: "SEO fixes delivered as clean GitHub Pull Requests",
    tldr: "Connect a single repository with a fine-grained GitHub token (Contents + Pull Requests). SEOKaroAI edits a sandboxed copy of your codebase and opens a reviewable Pull Request on a new branch — never pushing directly to main.",
    whatItFixes: [
      "Next.js, React, Astro and HTML title/meta templates and canonical URLs",
      "Missing Open Graph (og:image) and Twitter Card metadata",
      "JSON-LD structured data (Organization, SoftwareApplication, FAQPage, BreadcrumbList)",
      "XML sitemaps, robots.txt AI crawler rules and missing image alt attributes",
    ],
    steps: [
      { title: "Create a fine-grained GitHub token", detail: "Scope it to one repository only, with Contents (Read & Write) and Pull Requests (Read & Write)." },
      { title: "Connect your repo", detail: "Add owner/repo, branch and token in Project → Connect & fix and press Save & test." },
      { title: "Review line-by-line diffs", detail: "SEOKaroAI runs in an isolated workspace and shows you the exact git diff for every modified file." },
      { title: "Open Pull Request & merge", detail: "Click Create pull request to open a PR on a new seokaroai/fix-* branch for your CI and team to review." },
    ],
    diffLabel: "app/(marketing)/blog/[slug]/page.tsx",
    diffOld: "- openGraph: { title, description, images: p.coverImage ? [p.coverImage] : undefined }",
    diffNew: "+ openGraph: { title, description, images: [p.coverImage || `${config.appUrl}/opengraph-image`] }",
    securityPoints: [
      "Never pushes to main/master — every fix is opened as a Pull Request on a fresh branch.",
      "Fine-grained tokens are scoped to a single repository and encrypted with AES-256-GCM.",
      "Your existing CI/CD checks, code reviews and git revert protect every deployment.",
    ],
    faqs: [
      { q: "Does SEOKaroAI ever push directly to main?", a: "Never. It always creates a new seokaroai/fix-* branch and opens a Pull Request so your team and CI review every line." },
      { q: "Which frameworks work with GitHub Auto-Fix?", a: "Next.js, React, Remix, Astro, Nuxt, Hugo, Eleventy, static HTML and most web repositories." },
    ],
  },
];

export const integrationBySlug = (slug: string) => INTEGRATION_PAGES.find((p) => p.slug === slug);
