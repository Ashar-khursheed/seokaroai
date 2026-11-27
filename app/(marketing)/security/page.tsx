import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd, SectionHead } from "@/components/marketing";
import { Icon } from "@/components/icons";

const TITLE = "Integrations Security, Scopes & Rollback Architecture | SEOKaroAI";
const DESC =
  "How SEOKaroAI protects your WordPress, Shopify, and GitHub credentials: AES-256-GCM encryption at rest, minimal scopes, PR-only GitHub branches, 1-click CMS rollback, and full audit logs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: {
    canonical: "/security",
    languages: { en: "/security", "x-default": "/security" },
  },
  openGraph: { title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
};

const CONTROLS = [
  {
    icon: "Lock" as const,
    title: "AES-256-GCM Encryption at Rest",
    text: "All WordPress Application Passwords, Shopify Admin API tokens, GitHub Personal Access Tokens, and webhook secrets are encrypted with authenticated AES-256-GCM before storage in MySQL. Plaintext credentials are never logged or returned to the browser.",
  },
  {
    icon: "GitBranch" as const,
    title: "PR-Only Changes on GitHub",
    text: "SEOKaroAI never pushes directly to your protected main branch. Auto-Fix creates an isolated branch, commits only the exact SEO patch you approved, and opens a standard Pull Request for your engineering review and CI checks.",
  },
  {
    icon: "RefreshCw" as const,
    title: "1-Click Snapshot Rollback",
    text: "Before writing any metadata, schema, or internal-link update to WordPress or Shopify, SEOKaroAI captures the exact previous field value in our fix ledger so you can revert any change with a single click.",
  },
  {
    icon: "Shield" as const,
    title: "Human-in-the-Loop Approval",
    text: "Every proposed fix displays a side-by-side before/after diff. Nothing is applied to your CMS or repository until an authorized workspace member explicitly clicks Apply—or approves the GitHub PR.",
  },
  {
    icon: "Server" as const,
    title: "SSRF-Protected Crawling",
    text: "All audit and checker fetches validate target URLs against private IP ranges, loopback interfaces, and link-local metadata endpoints to prevent Server-Side Request Forgery.",
  },
  {
    icon: "FileText" as const,
    title: "Full Audit Trail & Revocation",
    text: "Every applied fix, rollback, and GitHub PR Gatekeeper check is recorded with timestamps and actor attribution. You can disconnect any integration or revoke tokens from your CMS or GitHub at any time.",
  },
];

const SCOPES = [
  {
    platform: "WordPress",
    auth: "Application Password (REST API)",
    scopes: "Edit posts/pages metadata & content for the specific user you assign",
    rollback: "Pre-change snapshot stored in SEOKaroAI; 1-click Undo restores previous title, meta, or content",
  },
  {
    platform: "Shopify",
    auth: "Custom App Admin API Access Token",
    scopes: "read_products, write_products, read_content, write_content (SEO title, description, alt text)",
    rollback: "Previous Shopify SEO fields captured before write; 1-click Undo restores original values",
  },
  {
    platform: "GitHub",
    auth: "Fine-Grained PAT + Webhook HMAC-SHA256 Secret",
    scopes: "Contents (Read & Write) and Pull Requests (Read & Write) on the single selected repository",
    rollback: "Branch + Pull Request workflow; close PR or git revert anytime",
  },
];

const FAQS = [
  {
    q: "Can SEOKaroAI ever modify my site without my permission?",
    a: "No. Audits are strictly read-only. Auto-Fix only writes changes when you review a diff and click Apply (on WordPress/Shopify) or merge the Pull Request SEOKaroAI opens on GitHub.",
  },
  {
    q: "How do I revoke SEOKaroAI’s access if I stop using an integration?",
    a: "You can click Disconnect inside your project’s Connect & Fix tab to delete the encrypted token immediately, and also revoke the Application Password (WordPress), Custom App token (Shopify), or Fine-Grained PAT (GitHub) directly in that platform.",
  },
  {
    q: "Does the GitHub PR SEO Gatekeeper read my private source code with AI?",
    a: "No. The GitHub PR SEO Gatekeeper runs 100% deterministic static checks on changed SEO-relevant files (HTML, TSX, JSX, Markdown) directly on our server—zero source code is sent to third-party LLM providers for PR checks.",
  },
];

export default function SecurityPage() {
  const url = `${config.appUrl}/security`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
              { "@type": "ListItem", position: 2, name: "Security & Rollback", item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <section className="hero-mesh relative overflow-hidden border-b line">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20">
          <nav className="muted flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--ink)]">Security</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="chip text-brand-600"><Icon name="Shield" size={14} />Integrations Security &amp; Rollback</span>
            <h1 className="text-gradient mt-4 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[3.4rem]">
              Built for Safe Production SEO Changes
            </h1>
            <p className="muted mt-5 text-base leading-relaxed sm:text-lg">
              Connecting your CMS or GitHub repository should never feel risky. Here is exactly how SEOKaroAI encrypts tokens, enforces least-privilege scopes, and guarantees reversible fixes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/integrations/wordpress" className="btn">WordPress Auto-Fix</Link>
              <Link href="/integrations/shopify" className="btn">Shopify Auto-Fix</Link>
              <Link href="/integrations/github" className="btn">GitHub PR Gatekeeper</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="Architecture controls"
          title="Six safeguards behind every Auto-Fix"
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONTROLS.map((c) => (
            <div key={c.title} className="panel card-3d p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600">
                <Icon name={c.icon} size={18} />
              </div>
              <h2 className="mt-4 text-[16px] font-semibold">{c.title}</h2>
              <p className="muted mt-2 text-[14px] leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>

        {/* Scopes table */}
        <div className="mt-16">
          <SectionHead
            eyebrow="Least-privilege access"
            title="Exact permissions &amp; rollback by integration"
          />
          <div className="panel mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b line bg-[var(--panel2)] text-xs uppercase tracking-wider muted">
                  <th className="px-5 py-3.5 font-semibold">Platform</th>
                  <th className="px-5 py-3.5 font-semibold">Authentication</th>
                  <th className="px-5 py-3.5 font-semibold">Required Scopes</th>
                  <th className="px-5 py-3.5 font-semibold">Rollback Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y line">
                {SCOPES.map((s) => (
                  <tr key={s.platform}>
                    <td className="px-5 py-4 font-semibold">{s.platform}</td>
                    <td className="px-5 py-4">{s.auth}</td>
                    <td className="muted px-5 py-4">{s.scopes}</td>
                    <td className="muted px-5 py-4">{s.rollback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-6 sm:px-6">
        <SectionHead eyebrow="Security FAQ" title="Common engineering &amp; compliance questions" />
        <div className="mt-8">
          <FaqList faqs={FAQS} />
        </div>
        <p className="muted mt-8 text-sm">
          Have a security questionnaire or need to report a vulnerability? Email us directly at{" "}
          <a href={`mailto:${config.supportEmail}`} className="text-brand-600 underline underline-offset-4">{config.supportEmail}</a>.
        </p>
      </section>

      <CtaBand
        title="Ready to test safe, diff-reviewed SEO automation?"
        text="Start with a read-only audit on our free plan—connect WordPress, Shopify, or GitHub only when you’re ready."
        button="Start free audit"
      />
    </>
  );
}
