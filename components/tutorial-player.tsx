"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { TUTORIALS, TUTORIAL_CATEGORIES, totalDurationSec, type Tutorial, type TutorialCategory } from "@/lib/content/tutorials";

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function stepAt(t: Tutorial, elapsed: number) {
  let acc = 0;
  for (let i = 0; i < t.steps.length; i++) {
    const end = acc + t.steps[i].durationSec;
    if (elapsed < end || i === t.steps.length - 1) {
      return { index: i, step: t.steps[i], localPct: Math.min(1, Math.max(0, (elapsed - acc) / t.steps[i].durationSec)) };
    }
    acc = end;
  }
  return { index: 0, step: t.steps[0], localPct: 0 };
}

/** Realistic animated mouse cursor with click pulse positioned over the active UI target. */
function ClickCursor({ x, y, label }: { x: string; y: string; label: string }) {
  return (
    <div
      className="pointer-events-none absolute z-20 transition-all duration-500 ease-out"
      style={{ left: x, top: y }}
    >
      <span className="absolute -left-2 -top-2 h-6 w-6 animate-ping rounded-full bg-brand-400/50" />
      <svg width="20" height="20" viewBox="0 0 24 24" className="relative drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" aria-hidden>
        <path d="M4 2l15 9-7 2-3 7L4 2z" fill="#ffffff" stroke="#09090e" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <div className="ml-4 mt-0.5 whitespace-nowrap rounded-md bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
        {label}
      </div>
    </div>
  );
}

/** Mini SEOKaroAI App Chrome (sidebar + URL bar + main content) showing exact clicks for each feature. */
function AppFrame({
  url,
  activeNav,
  highlightNav,
  cursor,
  children,
}: {
  url: string;
  activeNav: string;
  highlightNav?: string;
  cursor: { x: string; y: string; label: string };
  children: React.ReactNode;
}) {
  const navItems = ["Overview", "Keyword battle", "Reddit & Quora", "Reports", "yourstore.com", "+ Add website", "Billing"];
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0a0b10] text-white">
      {/* Top browser bar */}
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-white/10 bg-[#10121a] px-3 text-[10px] text-white/60">
        <span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-rose-500/70" /><span className="h-2 w-2 rounded-full bg-amber-400/70" /><span className="h-2 w-2 rounded-full bg-emerald-400/70" /></span>
        <span className="truncate rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/75">{url}</span>
      </div>
      {/* App body */}
      <div className="relative flex min-h-0 flex-1">
        {/* Mini Sidebar */}
        <aside className="hidden w-32 shrink-0 flex-col gap-0.5 border-r border-white/10 bg-[#0d0f16] p-2 text-[10px] sm:flex">
          <div className="mb-1.5 px-1.5 text-[11px] font-bold tracking-tight text-white">SEOKaro<span className="text-brand-400">AI</span></div>
          {navItems.map((n) => {
            const isActive = n === activeNav;
            const isHi = n === highlightNav;
            return (
              <div
                key={n}
                className={`truncate rounded-md px-2 py-1 transition ${
                  isHi
                    ? "bg-brand-500 font-semibold text-white ring-2 ring-brand-300/70"
                    : isActive
                      ? "bg-white/12 font-medium text-white"
                      : "text-white/55"
                }`}
              >
                {n}
              </div>
            );
          })}
        </aside>
        {/* Main panel */}
        <div className="relative min-w-0 flex-1 overflow-hidden p-3 sm:p-4">{children}</div>
        <ClickCursor x={cursor.x} y={cursor.y} label={cursor.label} />
      </div>
    </div>
  );
}

/**
 * Interactive step-by-step "How to Use" walkthroughs showing exact sidebar links, tabs, forms & buttons.
 */
function WalkthroughScene({ tutorial, stepIndex, localPct }: { tutorial: Tutorial; stepIndex: number; localPct: number }) {
  const s = stepIndex;

  if (tutorial.slug === "getting-started") {
    const configs = [
      { url: "seokaroai.com/app", nav: "Overview", hi: "+ Add website", cursor: { x: "14%", y: "66%", label: "Click + Add website" } },
      { url: "seokaroai.com/app/projects/new", nav: "+ Add website", cursor: { x: "52%", y: "36%", label: "Paste your website URL" } },
      { url: "seokaroai.com/app/projects/new", nav: "+ Add website", cursor: { x: "66%", y: "72%", label: "Click Add website" } },
      { url: "seokaroai.com/app/runs/quick-yourstore", nav: "Reports", cursor: { x: "78%", y: "24%", label: "Click Save PDF / HTML" } },
    ][s];
    return (
      <AppFrame url={configs.url} activeNav={configs.nav} highlightNav={configs.hi} cursor={configs.cursor}>
        {s === 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold">Dashboard Overview</div>
              <span className="rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-semibold">+ Add website</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {[["Websites", "0"], ["Tracked keywords", "0"], ["Reports", "0"]].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-white/10 bg-white/5 p-2"><div className="text-white/55">{l}</div><div className="mt-1 text-sm font-bold">{v}</div></div>
              ))}
            </div>
          </div>
        )}
        {(s === 1 || s === 2) && (
          <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-white/15 bg-white/[0.04] p-3">
            <div className="text-xs font-semibold">Add a new website</div>
            <div className="space-y-1">
              <div className="text-[10px] text-white/60">Website URL</div>
              <div className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] ${s === 1 ? "border-brand-400 bg-brand-500/10" : "border-white/15 bg-black/40"}`}>
                {s === 1 ? "https://yourstore.com".slice(0, Math.max(8, Math.round(21 * localPct))) : "https://yourstore.com"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-white/75">
              <div className="rounded-md border border-white/10 bg-black/30 px-2 py-1">Country: United States</div>
              <div className="rounded-md border border-white/10 bg-black/30 px-2 py-1">Language: English</div>
            </div>
            <div className="flex justify-end pt-1">
              <span className={`rounded-md px-3 py-1 text-[10.5px] font-semibold ${s === 2 ? "bg-brand-500 ring-2 ring-brand-300" : "bg-white/15"}`}>Add website →</span>
            </div>
          </div>
        )}
        {s === 3 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full border-4 border-emerald-400 text-sm font-bold">82</div>
                <div><div className="text-xs font-semibold">yourstore.com · Site audit</div><div className="text-[10px] text-white/60">47 checks done · Top issues ready</div></div>
              </div>
              <div className="flex gap-1.5">
                <span className="rounded-md bg-brand-500 px-2 py-1 text-[10px] font-semibold ring-2 ring-brand-300">Save PDF</span>
                <span className="rounded-md border border-white/15 px-2 py-1 text-[10px]">HTML</span>
              </div>
            </div>
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10.5px] text-amber-200">HIGH · 4 pages have meta descriptions over 160 chars</div>
          </div>
        )}
      </AppFrame>
    );
  }

  if (tutorial.slug === "ai-seo-audit") {
    const configs = [
      { url: "seokaroai.com/app", nav: "Overview", hi: "yourstore.com", cursor: { x: "14%", y: "56%", label: "1. Open your website" } },
      { url: "seokaroai.com/app/projects/1?tab=deep", nav: "yourstore.com", cursor: { x: "42%", y: "20%", label: "2. Click AI Deep Audit tab" } },
      { url: "seokaroai.com/app/projects/1?tab=deep", nav: "yourstore.com", cursor: { x: "44%", y: "72%", label: "3. Click Start AI deep audit" } },
      { url: "seokaroai.com/app/runs/deep-yourstore", nav: "Reports", cursor: { x: "78%", y: "22%", label: "4. Review tabs & Save PDF" } },
    ][s];
    return (
      <AppFrame url={configs.url} activeNav={configs.nav} highlightNav={configs.hi} cursor={configs.cursor}>
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-2 text-[10px]">
            {["Overview", "Rankings", "AI Deep Audit", "Connect & fix"].map((tab) => (
              <span key={tab} className={`rounded-md px-2 py-1 ${tab === "AI Deep Audit" && s >= 1 && s <= 2 ? "bg-brand-500 font-semibold text-white ring-2 ring-brand-300" : "bg-white/5 text-white/65"}`}>{tab}</span>
            ))}
          </div>
          {s <= 2 ? (
            <div className="space-y-2 rounded-xl border border-white/15 bg-white/[0.04] p-3">
              <div className="text-xs font-semibold">Launch AI Deep Audit</div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-white/80">
                {["☑ Technical & Schema", "☑ Content & E-E-A-T", "☑ Competitor Gaps", "☑ 90-Day Action Plan"].map((f) => (
                  <div key={f} className="rounded border border-white/10 bg-black/30 px-2 py-1">{f}</div>
                ))}
              </div>
              <span className={`inline-block rounded-md px-3 py-1.5 text-[10.5px] font-semibold ${s === 2 ? "bg-brand-500 ring-2 ring-brand-300" : "bg-white/15"}`}>Start AI deep audit →</span>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-white/15 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold">AI Deep Audit · Done (12 agents)</div>
                <span className="rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-semibold ring-2 ring-brand-300">Save PDF</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="rounded bg-white/5 p-2"><div className="text-white/55">Technical</div><b className="text-emerald-400">88/100</b></div>
                <div className="rounded bg-white/5 p-2"><div className="text-white/55">Content</div><b className="text-blue-400">74/100</b></div>
                <div className="rounded bg-white/5 p-2"><div className="text-white/55">GEO</div><b className="text-teal-400">82/100</b></div>
              </div>
            </div>
          )}
        </div>
      </AppFrame>
    );
  }

  if (tutorial.slug === "seo-auto-fix") {
    const configs = [
      { url: "seokaroai.com/app/projects/1?tab=connect", nav: "yourstore.com", cursor: { x: "58%", y: "20%", label: "1. Open Connect & fix tab" } },
      { url: "seokaroai.com/app/projects/1?tab=connect", nav: "yourstore.com", cursor: { x: "45%", y: "72%", label: "2. Paste token & Save" } },
      { url: "seokaroai.com/app/runs/fix-p1", nav: "Reports", cursor: { x: "32%", y: "48%", label: "3. Tick approved diffs" } },
      { url: "seokaroai.com/app/runs/fix-p1", nav: "Reports", cursor: { x: "76%", y: "26%", label: "4. Click Create pull request" } },
    ][s];
    return (
      <AppFrame url={configs.url} activeNav={configs.nav} cursor={configs.cursor}>
        {s <= 1 ? (
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-2 text-[10px]">
              {["Overview", "Rankings", "AI Deep Audit", "Connect & fix"].map((tab) => (
                <span key={tab} className={`rounded-md px-2 py-1 ${tab === "Connect & fix" ? "bg-brand-500 font-semibold text-white ring-2 ring-brand-300" : "bg-white/5 text-white/65"}`}>{tab}</span>
              ))}
            </div>
            <div className="space-y-2 rounded-xl border border-white/15 bg-white/[0.04] p-3">
              <div className="flex gap-1.5 text-[10px]">
                <span className="rounded bg-white/10 px-2 py-0.5">WordPress</span>
                <span className="rounded bg-white/10 px-2 py-0.5">Shopify</span>
                <span className="rounded bg-emerald-500/25 px-2 py-0.5 font-semibold text-emerald-300">GitHub ✓</span>
              </div>
              <div className="rounded border border-white/15 bg-black/40 px-2.5 py-1 font-mono text-[10.5px]">owner/website · ghp_••••••••</div>
              <span className={`inline-block rounded-md px-3 py-1 text-[10.5px] font-semibold ${s === 1 ? "bg-brand-500 ring-2 ring-brand-300" : "bg-white/15"}`}>Save &amp; test →</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2">
              <span className="text-[11px] font-medium">9 changes waiting for review</span>
              <span className={`rounded-md px-2.5 py-1 text-[10.5px] font-semibold ${s === 3 ? "bg-brand-500 ring-2 ring-brand-300" : "bg-brand-500/70"}`}>Create pull request</span>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/50 p-2.5 font-mono text-[10px]">
              <div className="text-white">☑ app/page.tsx <span className="text-emerald-400">+2 -1</span></div>
              <div className="mt-1 text-rose-300">- description: &quot;Welcome&quot;</div>
              <div className="text-emerald-300">+ description: &quot;AI SEO audits &amp; automated PR fixes.&quot;</div>
            </div>
          </div>
        )}
      </AppFrame>
    );
  }

  if (tutorial.slug === "keyword-battle") {
    const configs = [
      { url: "seokaroai.com/app", nav: "Overview", hi: "Keyword battle", cursor: { x: "14%", y: "34%", label: "1. Click Keyword battle" } },
      { url: "seokaroai.com/app/battles/new", nav: "Keyword battle", cursor: { x: "50%", y: "42%", label: "2. Enter keyword & page URL" } },
      { url: "seokaroai.com/app/battles/new", nav: "Keyword battle", cursor: { x: "42%", y: "72%", label: "3. Click Start battle" } },
      { url: "seokaroai.com/app/runs/kw-battle", nav: "Reports", cursor: { x: "66%", y: "56%", label: "4. Copy winning fixes" } },
    ][s];
    return (
      <AppFrame url={configs.url} activeNav={configs.nav} highlightNav={configs.hi} cursor={configs.cursor}>
        {s <= 2 ? (
          <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-white/15 bg-white/[0.04] p-3">
            <div className="text-xs font-semibold">New Keyword Battle</div>
            <div className="rounded border border-brand-400/60 bg-black/40 px-2.5 py-1.5 text-[11px]">ai seo audit tool</div>
            <div className="rounded border border-white/15 bg-black/40 px-2.5 py-1.5 font-mono text-[10.5px]">https://yourstore.com/features/ai-seo-audit</div>
            <span className={`inline-block rounded-md px-3 py-1 text-[10.5px] font-semibold ${s === 2 ? "bg-brand-500 ring-2 ring-brand-300" : "bg-white/15"}`}>Start keyword battle →</span>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-white/15 bg-white/[0.04] p-3 text-[10.5px]">
            <div className="font-semibold">Your page vs Google Top 3</div>
            <div className="grid grid-cols-4 border-b border-white/10 pb-1 text-white/55"><span>Signal</span><span>You</span><span>#1</span><span>#2</span></div>
            <div className="grid grid-cols-4"><span>Words</span><span className="text-rose-300">480</span><span>2,100</span><span>1,850</span></div>
            <div className="grid grid-cols-4"><span>FAQ schema</span><span className="text-rose-300">No</span><span className="text-emerald-300">Yes</span><span className="text-emerald-300">Yes</span></div>
          </div>
        )}
      </AppFrame>
    );
  }

  if (tutorial.slug === "rank-tracker") {
    const configs = [
      { url: "seokaroai.com/app/projects/1?tab=rankings", nav: "yourstore.com", cursor: { x: "34%", y: "20%", label: "1. Open Rankings tab" } },
      { url: "seokaroai.com/app/projects/1?tab=rankings", nav: "yourstore.com", cursor: { x: "66%", y: "38%", label: "2. Paste keywords & Add" } },
      { url: "seokaroai.com/app/projects/1?tab=rankings", nav: "yourstore.com", cursor: { x: "62%", y: "66%", label: "3. Track daily moves" } },
      { url: "seokaroai.com/app/settings", nav: "Overview", cursor: { x: "45%", y: "55%", label: "4. Alerts emailed on ±3 moves" } },
    ][s];
    return (
      <AppFrame url={configs.url} activeNav={configs.nav} cursor={configs.cursor}>
        <div className="space-y-2">
          <div className="flex gap-1.5 border-b border-white/10 pb-2 text-[10px]">
            {["Overview", "Rankings", "AI Deep Audit", "Connect & fix"].map((tab) => (
              <span key={tab} className={`rounded-md px-2 py-1 ${tab === "Rankings" ? "bg-brand-500 font-semibold text-white ring-2 ring-brand-300" : "bg-white/5 text-white/65"}`}>{tab}</span>
            ))}
          </div>
          {s <= 1 ? (
            <div className="flex gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-[10.5px]">
              <div className="flex-1 rounded border border-white/15 bg-black/40 px-2 py-1 text-white/80">ai seo audit, rank tracker</div>
              <span className="rounded bg-brand-500 px-2.5 py-1 font-semibold">Add</span>
            </div>
          ) : (
            <div className="space-y-1.5 rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-[10.5px]">
              {[["ai seo audit", "#4", "↑6"], ["keyword battle tool", "#2", "↑9"], ["shopify seo fix", "#7", "↑4"]].map(([k, p, d]) => (
                <div key={k} className="flex items-center justify-between rounded bg-white/5 px-2.5 py-1">
                  <span>{k}</span>
                  <span className="font-mono"><b className="mr-2 text-brand-300">{p}</b><b className="text-emerald-400">{d}</b></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppFrame>
    );
  }

  if (tutorial.slug === "ai-search-optimization") {
    const configs = [
      { url: "seokaroai.com/app/runs/deep-yourstore", nav: "Reports", cursor: { x: "38%", y: "26%", label: "1. Open Categories & findings" } },
      { url: "seokaroai.com/app/runs/deep-yourstore?view=categories", nav: "Reports", cursor: { x: "55%", y: "52%", label: "2. Check AI bots & llms.txt" } },
      { url: "seokaroai.com/app/runs/deep-yourstore?view=categories", nav: "Reports", cursor: { x: "55%", y: "68%", label: "3. Review citability fixes" } },
      { url: "seokaroai.com/app/projects/1?tab=connect", nav: "yourstore.com", cursor: { x: "66%", y: "54%", label: "4. Ship GEO fixes via Auto-Fix" } },
    ][s];
    return (
      <AppFrame url={configs.url} activeNav={configs.nav} cursor={configs.cursor}>
        <div className="space-y-2 rounded-xl border border-white/15 bg-white/[0.04] p-3 text-[10.5px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold">AI Search Readiness (GEO)</span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-emerald-300">86/100</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {["GPTBot: Allowed ✓", "ClaudeBot: Allowed ✓", "PerplexityBot: Allowed ✓", "llms.txt: 200 OK ✓"].map((b) => (
              <div key={b} className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">{b}</div>
            ))}
          </div>
        </div>
      </AppFrame>
    );
  }

  if (tutorial.slug === "seo-reports") {
    const configs = [
      { url: "seokaroai.com/app/projects/1?tab=settings", nav: "yourstore.com", cursor: { x: "52%", y: "42%", label: "1. Set Weekly Auto-Audit" } },
      { url: "seokaroai.com/app/projects/1", nav: "yourstore.com", cursor: { x: "58%", y: "56%", label: "2. Monitor score history" } },
      { url: "seokaroai.com/app/runs", nav: "Reports", cursor: { x: "44%", y: "48%", label: "3. Open any past report" } },
      { url: "seokaroai.com/app/runs/deep-yourstore", nav: "Reports", cursor: { x: "76%", y: "24%", label: "4. Click Save PDF or HTML" } },
    ][s];
    return (
      <AppFrame url={configs.url} activeNav={configs.nav} cursor={configs.cursor}>
        <div className="space-y-2.5 rounded-xl border border-white/15 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">Scheduled Audits &amp; Client Reports</span>
            <div className="flex gap-1.5">
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${s === 3 ? "bg-brand-500 ring-2 ring-brand-300" : "bg-white/15"}`}>Save PDF</span>
              <span className="rounded border border-white/15 px-2 py-0.5 text-[10px]">Download HTML</span>
            </div>
          </div>
          <div className="flex h-16 items-end gap-2 pt-2">
            {[58, 65, 72, 79, 85, 91].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-teal-400" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
      </AppFrame>
    );
  }

  // website-seo-checker
  const configs = [
    { url: "seokaroai.com/features/website-seo-checker", nav: "Overview", cursor: { x: "48%", y: "42%", label: "1. Paste any public URL" } },
    { url: "seokaroai.com/features/website-seo-checker", nav: "Overview", cursor: { x: "74%", y: "42%", label: "2. Click Check URL" } },
    { url: "seokaroai.com/features/website-seo-checker?url=example.com", nav: "Overview", cursor: { x: "52%", y: "66%", label: "3. Inspect instant issues" } },
    { url: "seokaroai.com/features/website-seo-checker?url=example.com", nav: "Overview", cursor: { x: "72%", y: "24%", label: "4. Share permalink URL" } },
  ][s];
  return (
    <AppFrame url={configs.url} activeNav={configs.nav} cursor={configs.cursor}>
      <div className="space-y-2.5 rounded-xl border border-white/15 bg-white/[0.04] p-3">
        <div className="text-xs font-semibold">Instant Free SEO Checker (No Signup)</div>
        <div className="flex gap-2">
          <div className="flex-1 rounded border border-brand-400/60 bg-black/40 px-2.5 py-1.5 font-mono text-[10.5px]">https://example.com</div>
          <span className={`rounded px-3 py-1.5 text-[10.5px] font-semibold ${s === 1 ? "bg-brand-500 ring-2 ring-brand-300" : "bg-brand-500/80"}`}>Check</span>
        </div>
        {s >= 2 && (
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-200">Title &amp; Meta: Pass ✓</div>
            <div className="rounded bg-amber-500/15 px-2 py-1 text-amber-200">3 images missing alt</div>
          </div>
        )}
      </div>
    </AppFrame>
  );
}

/**
 * Interactive Step-by-Step Guide Player with Play/Pause, Scrubber, Chapters, Speed & Captions.
 */
export function TutorialPlayer({
  tutorial,
  autoPlay = false,
  onPrev,
  onNext,
}: {
  tutorial: Tutorial;
  autoPlay?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const total = useMemo(() => totalDurationSec(tutorial), [tutorial]);
  const [playing, setPlaying] = useState(autoPlay);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [captions, setCaptions] = useState(true);

  useEffect(() => {
    setElapsed(0);
    setPlaying(autoPlay);
  }, [tutorial.slug, autoPlay]);

  useEffect(() => {
    if (!playing || tutorial.videoUrl) return;
    const tick = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.1 * speed;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(tick);
  }, [playing, speed, total, tutorial.videoUrl]);

  const { index: stepIndex, step, localPct } = stepAt(tutorial, Math.min(elapsed, Math.max(0, total - 0.01)));
  const progressPct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;

  const togglePlay = () => {
    if (elapsed >= total - 0.1) setElapsed(0);
    setPlaying((p) => !p);
  };

  const jumpToStep = (idx: number) => {
    let acc = 0;
    for (let i = 0; i < idx; i++) acc += tutorial.steps[i].durationSec;
    setElapsed(acc);
    setPlaying(true);
  };

  if (tutorial.videoUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border line bg-black">
        <video src={tutorial.videoUrl} controls playsInline autoPlay={autoPlay} className="aspect-video w-full" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border line bg-[#09090e] text-white shadow-2xl">
      {/* 16:9 Stage */}
      <div
        className="relative aspect-[16/10] w-full cursor-pointer select-none overflow-hidden sm:aspect-video"
        onClick={togglePlay}
      >
        <WalkthroughScene tutorial={tutorial} stepIndex={stepIndex} localPct={localPct} />

        {/* Captions bar */}
        {captions && (
          <div className="pointer-events-none absolute inset-x-3 bottom-2.5 z-30 flex justify-center sm:inset-x-6 sm:bottom-3">
            <div className="max-w-xl rounded-lg border border-white/15 bg-black/85 px-3 py-1.5 text-center text-[11.5px] leading-snug text-white shadow-lg backdrop-blur sm:text-[12.5px]">
              <span className="mr-1.5 font-semibold text-brand-300">Step {stepIndex + 1} · {step.title}:</span>
              {step.caption}
            </div>
          </div>
        )}

        {/* Center Play Overlay when paused */}
        {!playing && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/35 backdrop-blur-[1px] transition">
            <div className="flex flex-col items-center gap-2">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-2xl transition hover:scale-105 sm:h-16 sm:w-16">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  {elapsed >= total - 0.1
                    ? <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
                    : <path d="M8 5v14l11-7z" />}
                </svg>
              </span>
              <span className="rounded-full bg-black/80 px-3 py-0.5 text-[11.5px] font-medium text-white">
                {elapsed >= total - 0.1 ? "Replay step-by-step guide" : `Watch how to use · ${tutorial.durationLabel}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="space-y-2.5 border-t border-white/10 bg-[#0d0d14] px-3 py-3 sm:px-4">
        <div
          className="group relative h-2 w-full cursor-pointer rounded-full bg-white/15"
          role="slider"
          aria-label="Guide progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.round(elapsed)}
          tabIndex={0}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            setElapsed(ratio * total);
          }}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-400 transition-[width] duration-100" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={togglePlay} className="rounded-lg bg-white/10 px-2.5 py-1.5 font-medium text-white hover:bg-white/20">
              {playing ? "Pause" : elapsed >= total - 0.1 ? "Replay" : "Play"}
            </button>
            {onPrev && <button type="button" onClick={onPrev} className="rounded-lg bg-white/5 px-2 py-1.5 text-white/80 hover:bg-white/15">‹ Prev</button>}
            {onNext && <button type="button" onClick={onNext} className="rounded-lg bg-white/5 px-2 py-1.5 text-white/80 hover:bg-white/15">Next ›</button>}
            <span className="ml-1 font-mono text-[11.5px] text-white/70 tabular-nums">{fmtTime(elapsed)} / {fmtTime(total)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))} className="rounded-lg bg-white/10 px-2 py-1 font-mono text-[11px] text-white/90 hover:bg-white/20">
              {speed}x
            </button>
            <button type="button" onClick={() => setCaptions((c) => !c)} className={`rounded-lg px-2 py-1 text-[11px] font-medium ${captions ? "bg-brand-500 text-white" : "bg-white/10 text-white/70"}`}>
              CC
            </button>
          </div>
        </div>

        {/* Clickable Steps */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-4">
          {tutorial.steps.map((st, idx) => (
            <button
              key={st.title}
              type="button"
              onClick={() => jumpToStep(idx)}
              className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition ${idx === stepIndex ? "border-brand-500/70 bg-brand-500/20 text-white" : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"}`}
            >
              <div className="truncate font-medium">{idx + 1}. {st.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Full /tutorials page hub: category filters, theater player, and all 8 step-by-step guides.
 */
export function TutorialsHub({ initialSlug }: { initialSlug?: string }) {
  const [category, setCategory] = useState<"All" | TutorialCategory>("All");
  const [activeSlug, setActiveSlug] = useState(
    TUTORIALS.some((t) => t.slug === initialSlug) ? (initialSlug as string) : TUTORIALS[0].slug,
  );
  const [autoPlay, setAutoPlay] = useState(false);

  const visible = useMemo(
    () => (category === "All" ? TUTORIALS : TUTORIALS.filter((t) => t.category === category)),
    [category],
  );

  const activeIndex = TUTORIALS.findIndex((t) => t.slug === activeSlug);
  const active = TUTORIALS[activeIndex >= 0 ? activeIndex : 0];

  const selectTutorial = (slug: string) => {
    setActiveSlug(slug);
    setAutoPlay(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="min-w-0 lg:col-span-2">
          <TutorialPlayer
            tutorial={active}
            autoPlay={autoPlay}
            onPrev={() => selectTutorial(TUTORIALS[(activeIndex - 1 + TUTORIALS.length) % TUTORIALS.length].slug)}
            onNext={() => selectTutorial(TUTORIALS[(activeIndex + 1) % TUTORIALS.length].slug)}
          />
        </div>
        <div className="panel flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs">
            <span className="chip !py-0.5 text-brand-500">{active.category}</span>
            <span className="muted font-mono">Guide {active.number} · {active.durationLabel}</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{active.title}</h2>
          <p className="muted text-[14.5px] leading-relaxed">{active.summary}</p>
          <div className="border-t line pt-4">
            <div className="muted mb-2.5 text-[11px] font-semibold uppercase tracking-wider">Click-by-click steps</div>
            <ol className="space-y-2 text-[13.5px]">
              {active.steps.map((st, i) => (
                <li key={st.title} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--panel2)] font-mono text-[11px] font-semibold text-brand-500">{i + 1}</span>
                  <span><b className="font-medium">{st.title}</b> — <span className="muted">{st.caption}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Link href={active.tryHref} className="btn btn-brand flex-1">Try this now <Icon name="ArrowRight" size={15} /></Link>
            <Link href={active.featureHref} className="btn flex-1">Feature details</Link>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">All feature guides ({visible.length})</h2>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {TUTORIAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${category === cat ? "border-brand-500 bg-brand-500 text-white" : "line bg-[var(--panel)] muted hover:text-[var(--ink)]"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((t) => {
            const isCurrent = t.slug === active.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => selectTutorial(t.slug)}
                className={`panel card-hover group flex flex-col overflow-hidden text-left transition ${isCurrent ? "border-brand-500 ring-1 ring-brand-500" : ""}`}
              >
                <div
                  className="relative flex aspect-video w-full items-center justify-center overflow-hidden p-4"
                  style={{ background: `linear-gradient(135deg, ${t.accentFrom}33, ${t.accentTo}28), #0c0d14` }}
                >
                  <div className="grid-bg pointer-events-none absolute inset-0 opacity-35" />
                  <span className="relative grid h-11 w-11 place-items-center rounded-full bg-white/95 text-black shadow-lg transition group-hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-white">{t.number}</span>
                  <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10.5px] text-white">{t.durationLabel}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-500">
                    <Icon name={t.icon} size={13} />
                    <span>{t.category}</span>
                  </div>
                  <div className="mt-1.5 text-[14.5px] font-semibold leading-snug">{t.shortTitle}</div>
                  <p className="muted mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed">{t.summary}</p>
                  <div className="mt-auto pt-3 text-[12px] font-medium text-brand-500">
                    {isCurrent ? "Now playing" : "Watch guide →"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * Compact Video Tutorials showcase section for the homepage.
 */
export function HomeTutorialsSection() {
  const [selected, setSelected] = useState(TUTORIALS[0].slug);
  const [autoPlay, setAutoPlay] = useState(false);
  const current = TUTORIALS.find((t) => t.slug === selected) ?? TUTORIALS[0];

  return (
    <div className="mt-8 grid gap-5 sm:mt-12 lg:grid-cols-12 lg:items-start">
      <div className="min-w-0 lg:col-span-8">
        <TutorialPlayer
          tutorial={current}
          autoPlay={autoPlay}
          onPrev={() => {
            const i = TUTORIALS.findIndex((t) => t.slug === current.slug);
            setSelected(TUTORIALS[(i - 1 + TUTORIALS.length) % TUTORIALS.length].slug);
            setAutoPlay(true);
          }}
          onNext={() => {
            const i = TUTORIALS.findIndex((t) => t.slug === current.slug);
            setSelected(TUTORIALS[(i + 1) % TUTORIALS.length].slug);
            setAutoPlay(true);
          }}
        />
      </div>
      <div className="panel flex flex-col overflow-hidden lg:col-span-4">
        <div className="flex items-center justify-between border-b line px-4 py-3">
          <span className="text-[13px] font-semibold">How-to Guides ({TUTORIALS.length} videos)</span>
          <Link href="/tutorials" className="text-[12px] font-medium text-brand-500 hover:underline">View all →</Link>
        </div>
        <div className="max-h-[380px] divide-y line overflow-y-auto">
          {TUTORIALS.map((t) => {
            const active = t.slug === current.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => { setSelected(t.slug); setAutoPlay(true); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${active ? "bg-brand-500/10" : "hover:bg-[var(--panel2)]"}`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold ${active ? "bg-brand-500 text-white" : "bg-[var(--panel2)] text-brand-500"}`}>
                  <Icon name={t.icon} size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[13.5px] font-medium ${active ? "text-brand-500" : ""}`}>{t.number}. {t.shortTitle}</div>
                  <div className="muted truncate text-[11.5px]">{t.category} · {t.durationLabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
