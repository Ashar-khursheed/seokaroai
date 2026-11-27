import type { Metadata } from "next";
import Link from "next/link";
import { PLANS, PAID_PLANS, type PlanCode } from "@/lib/plans";
import { ADDON_LIST } from "@/lib/addons";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Pricing: Free, Starter, Pro and Agency Plans",
  description: "SEOKaroAI plans: start free, then upgrade for AI deep audits, keyword battles, and daily rank tracking. Try a free audit today.",
  alternates: { canonical: "/pricing", languages: { en: "/pricing", "x-default": "/pricing" } },
};

const ROWS: [string, (c: PlanCode) => string][] = [
  ["Websites", (c) => String(PLANS[c].limits.projects)],
  ["Site audits a month", (c) => String(PLANS[c].limits.quickAudits)],
  ["Pages checked per audit", (c) => String(PLANS[c].limits.pagesPerAudit)],
  ["AI deep audits a month", (c) => (PLANS[c].limits.deepAudits ? String(PLANS[c].limits.deepAudits) : "–")],
  ["Keyword battles a month", (c) => String(PLANS[c].limits.battles)],
  ["Tracked keywords", (c) => PLANS[c].limits.keywords.toLocaleString()],
  ["Rank check frequency", (c) => (PLANS[c].rankFrequencies.includes("daily") ? "Daily" : "Weekly")],
  ["Automatic audits", (c) => (PLANS[c].autoAudits.includes("weekly") ? "Weekly or monthly" : "Monthly")],
  ["Competitor gap analysis", (c) => (PLANS[c].limits.deepAudits ? "✓" : "–")],
  ["Content briefs & cluster maps", (c) => (PLANS[c].limits.deepAudits ? "✓" : "–")],
  ["Email alerts & weekly report", () => "✓"],
  ["Printable reports", () => "✓"],
];

const FAQS = [
  { q: "What is the difference between a site audit and an AI deep audit?", a: "A site audit runs measurement tools (47 on-page checks, security, sitemaps, AI readiness, speed) in a few minutes. An AI deep audit sends a team of specialist agents through your site and competitors and produces a full strategy: competitor gaps, content briefs, comparison pages and a 90-day plan." },
  { q: "What happens when I reach a limit?", a: "That feature pauses until the 1st of next month, or you can upgrade right away. Failed or cancelled runs never count." },
  { q: "Can I change plans later?", a: "Yes, upgrade or downgrade anytime from the billing page. Paddle prorates the difference automatically." },
  { q: "Who handles payments?", a: "Paddle.com is our Merchant of Record. It handles payments, invoices and sales tax for every country, and accepts cards, PayPal and local methods where available." },
  { q: "Do you offer refunds?", a: "Yes. New subscriptions can be refunded in full within 14 days. See the refund policy for details." },
];

export default function Pricing() {
  const codes: PlanCode[] = ["free", ...PAID_PLANS];
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org", "@type": "SoftwareApplication", name: "SEOKaroAI", applicationCategory: "BusinessApplication",
          operatingSystem: "Web", url: config.appUrl, publisher: { "@id": `${config.appUrl}/#organization` },
          offers: codes.map((c) => ({
            "@type": "Offer", name: PLANS[c].name, price: String(PLANS[c].priceMonthly), priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${config.appUrl}/pricing`,
            priceSpecification: { "@type": "UnitPriceSpecification", price: String(PLANS[c].priceMonthly), priceCurrency: "USD", billingDuration: "P1M" },
          })),
        },
        {
          "@context": "https://schema.org", "@type": "Product", name: "SEOKaroAI SEO Platform",
          description: "AI SEO audit tool, daily Google rank tracker, Keyword Battle competitor analysis, and automated WordPress, Shopify & GitHub SEO fixes.",
          brand: { "@type": "Brand", name: "SEOKaroAI" },
          image: `${config.appUrl}/opengraph-image`,
          url: `${config.appUrl}/pricing`,
          offers: {
            "@type": "AggregateOffer",
            lowPrice: "0",
            highPrice: "249",
            priceCurrency: "USD",
            offerCount: codes.length,
            offers: codes.map((c) => ({
              "@type": "Offer",
              name: `SEOKaroAI ${PLANS[c].name} Plan`,
              price: String(PLANS[c].priceMonthly),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: `${config.appUrl}/pricing`,
            })),
          },
        },
        {
          "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
            { "@type": "ListItem", position: 2, name: "Pricing", item: `${config.appUrl}/pricing` },
          ],
        },
        {
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        },
      ]} />
      <section className="mx-auto max-w-6xl px-4 pt-10 text-center sm:px-6 sm:pt-16">
        <h1 className="break-words text-[2.1rem] font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">Pricing that pays for itself</h1>
        <p className="muted mx-auto mt-4 max-w-2xl text-base sm:text-lg">Start free on one website. Upgrade for AI deep audits, keyword battles, daily rank tracking and more websites. Yearly billing gives you 2 months free.</p>
      </section>

      <section className="mx-auto mt-10 grid sm:mt-12 max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {codes.map((c) => {
          const p = PLANS[c];
          return (
            <div key={c} className={`panel relative flex flex-col p-5 sm:p-6 ${p.popular ? "ring-2 ring-brand-500" : ""}`}>
              {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white">Most popular</span>}
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="muted mt-1 min-h-[40px] text-sm">{p.tagline}</p>
              <div className="mt-4 text-4xl font-semibold tracking-[-0.02em]">${p.priceMonthly}<span className="muted text-base font-medium">/month</span></div>
              <div className="muted mt-1 text-xs">{p.priceYearly ? `or $${p.priceYearly}/year (2 months free)` : "free forever"}</div>
              <Link href={c === "free" ? "/signup" : `/signup?plan=${c}`} className={`btn mt-6 justify-center ${p.popular ? "btn-primary" : ""}`}>
                {c === "free" ? "Start free" : `Choose ${p.name}`}
              </Link>
              <ul className="mt-6 space-y-2 text-sm">{p.highlights.map((h) => <li key={h} className="flex gap-2"><span className="text-emerald-500">✓</span>{h}</li>)}</ul>
            </div>
          );
        })}
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:mt-14 sm:px-6">
        <div className="mb-5">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Optional Paid Add-on · Sold Separately</div>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Power up any plan with community outreach</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {ADDON_LIST.map((a) => (
            <div key={a.code} className="panel flex flex-col justify-between gap-5 p-5 sm:p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{a.name}</h3>
                  <span className="chip !py-0.5 text-brand-500">Add-on · Separate billing</span>
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-[-0.02em]">${a.priceMonthly}<span className="muted text-sm font-normal">/month</span></div>
                <p className="muted mt-2 text-sm leading-relaxed">{a.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {a.highlights.map((h) => <li key={h} className="flex gap-2"><span className="text-emerald-500">✓</span>{h}</li>)}
                </ul>
              </div>
              <Link href="/signup" className="btn btn-brand justify-center">Get {a.name} (${a.priceMonthly}/mo)</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4 sm:mt-16 sm:px-6">
        <h2 className="mb-5 text-xl font-semibold tracking-[-0.02em] sm:mb-6 sm:text-2xl">Compare plans</h2>
        <div className="panel table-wrap overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b line text-left"><th className="p-3 sm:p-4">Feature</th>{codes.map((c) => <th key={c} className="p-3 sm:p-4">{PLANS[c].name}</th>)}</tr></thead>
            <tbody>{ROWS.map(([label, f]) => (
              <tr key={label} className="border-b line last:border-0"><td className="p-3 font-medium sm:p-4">{label}</td>{codes.map((c) => <td key={c} className="p-3 sm:p-4">{f(c)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-3xl px-4 sm:mt-16 sm:px-6">
        <h2 className="mb-5 text-center text-xl font-semibold tracking-[-0.02em] sm:mb-6 sm:text-2xl">Billing questions</h2>
        <FaqList faqs={FAQS} />
      </section>
      <CtaBand title="Start with a free audit today" />
    </>
  );
}
