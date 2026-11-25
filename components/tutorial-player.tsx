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

/**
 * Interactive video stage rendering realistic animated SEOKaroAI UI walkthroughs for each feature.
 */
function WalkthroughScene({ tutorial, stepIndex, localPct }: { tutorial: Tutorial; stepIndex: number; localPct: number }) {
  const s = stepIndex;
  const pct = Math.round(localPct * 100);

  if (tutorial.slug === "getting-started") {
    return (
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 text-[11px] text-white/70">
          <span className="flex items-center gap-1.5 font-mono"><span className="h-2 w-2 rounded-full bg-emerald-400" />seokaroai.com/app/projects/new</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">Step {s + 1}/4</span>
        </div>
        {s === 0 && (
          <div className="mx-auto w-full max-w-md space-y-2.5 rounded-xl border border-white/15 bg-black/55 p-4 backdrop-blur">
            <div className="text-xs font-semibold text-white">Add website</div>
            <div className="rounded-lg border border-brand-400/60 bg-white/5 px-3 py-2 font-mono text-xs text-white">
              {"https://yourstore.com".slice(0, Math.max(8, Math.round(21 * localPct)))}
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-brand-400 align-middle" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-white/75">
              <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">Country: United States</div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">Language: English</div>
            </div>
            <div className="flex justify-end">
              <span className="rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-brand-500/30">Add &amp; run site audit →</span>
            </div>
          </div>
        )}
        {s === 1 && (
          <div className="mx-auto w-full max-w-md space-y-2.5 rounded-xl border border-white/15 bg-black/55 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-2"><span className="h-2 w-2 animate-ping rounded-full bg-brand-400" />Running 47 site checks…</span>
              <span className="font-mono text-brand-300">{Math.min(47, Math.max(12, Math.round(47 * localPct)))}/47</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-400 transition-all duration-150" style={{ width: `${Math.max(18, pct)}%` }} /></div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10.5px] text-white/80">
              {["Meta & titles ✓", "HTTPS & headers ✓", "XML Sitemap ✓", "Core Web Vitals ✓"].map((item, i) => (
                <div key={item} className={`rounded-md border px-2 py-1 transition ${pct > i * 22 ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/5 text-white/40"}`}>{item}</div>
              ))}
            </div>
          </div>
        )}
        {s === 2 && (
          <div className="mx-auto flex w-full max-w-md items-center gap-4 rounded-xl border border-white/15 bg-black/55 p-4 backdrop-blur">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-emerald-400/80 bg-emerald-500/10 text-2xl font-bold text-white tabular-nums">
              {Math.min(82, Math.round(40 + 42 * localPct))}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="text-xs font-semibold text-white">SEO Health Score · yourstore.com</div>
              {[["On-page", 86], ["Technical", 91], ["Speed", 74]].map(([l, v]) => (
                <div key={String(l)} className="flex items-center gap-2 text-[10.5px] text-white/80">
                  <span className="w-16">{l}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${v}%` }} /></div>
                  <span className="w-6 text-right font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {s === 3 && (
          <div className="mx-auto w-full max-w-md space-y-2 rounded-xl border border-white/15 bg-black/55 p-4 backdrop-blur">
            <div className="text-xs font-semibold text-white">Top Quick Wins</div>
            {[
              ["HIGH", "bg-amber-500/20 text-amber-300", "Trim 4 overlong meta descriptions (>160 chars)"],
              ["MED", "bg-blue-500/20 text-blue-300", "Add missing alt text on 6 product hero images"],
              ["LOW", "bg-emerald-500/20 text-emerald-300", "Add FAQPage JSON-LD to /pricing"],
            ].map(([sev, cls, txt]) => (
              <div key={txt} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/90">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold ${cls}`}>{sev}</span>
                <span className="truncate">{txt}</span>
              </div>
            ))}
          </div>
        )}
        <div className="h-1" />
      </div>
    );
  }

  if (tutorial.slug === "ai-seo-audit") {
    const agents = ["Technical SEO", "Content & E-E-A-T", "Schema", "Performance", "AI Search (GEO)", "Competitors"];
    return (
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="font-mono">AI Deep Audit · Agent Team</span>
          <span className="rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-200">12+ agents</span>
        </div>
        {s <= 1 && (
          <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
            {agents.map((a, i) => {
              const done = s === 1 && pct > i * 16;
              const active = s === 1 && !done && pct > (i - 1) * 16;
              return (
                <div key={a} className={`rounded-xl border p-2.5 text-[11px] backdrop-blur transition ${done ? "border-emerald-400/50 bg-emerald-500/15 text-white" : active ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/15 bg-black/50 text-white/70"}`}>
                  <div className="flex items-center justify-between gap-1 font-medium">
                    <span className="truncate">{a}</span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${done ? "bg-emerald-400" : active ? "animate-pulse bg-brand-400" : "bg-white/25"}`} />
                  </div>
                  <div className="mt-1 text-[10px] text-white/60">{done ? "Report ready" : active ? "Analyzing…" : "Queued"}</div>
                </div>
              );
            })}
          </div>
        )}
        {s === 2 && (
          <div className="mx-auto w-full max-w-md space-y-2 rounded-xl border border-white/15 bg-black/55 p-4 backdrop-blur">
            <div className="text-xs font-semibold text-white">Category Scores &amp; Evidence</div>
            {[["Technical SEO", 88, "bg-emerald-400"], ["Content & E-E-A-T", 72, "bg-blue-400"], ["Schema & Entities", 61, "bg-amber-400"], ["AI Search (GEO)", 79, "bg-teal-400"]].map(([n, sc, col]) => (
              <div key={String(n)} className="flex items-center gap-2.5 text-[11px] text-white/90">
                <span className="w-28 truncate">{n}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${col}`} style={{ width: `${sc}%` }} /></div>
                <span className="w-7 text-right font-mono font-semibold">{sc}</span>
              </div>
            ))}
          </div>
        )}
        {s === 3 && (
          <div className="mx-auto grid w-full max-w-lg grid-cols-3 gap-2">
            {[
              ["Days 1–30", "Fix critical canonicals, 404s & meta tags"],
              ["Days 31–60", "Ship 6 comparison pages & FAQ schema"],
              ["Days 61–90", "Expand topic clusters & internal links"],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-white/15 bg-black/55 p-3 backdrop-blur">
                <div className="text-[10.5px] font-bold text-brand-300">{t}</div>
                <div className="mt-1 text-[11px] leading-snug text-white/85">{d}</div>
              </div>
            ))}
          </div>
        )}
        <div className="h-1" />
      </div>
    );
  }

  if (tutorial.slug === "seo-auto-fix") {
    return (
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="font-mono">Connect &amp; Fix · GitHub / WordPress / Shopify</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">9 proposed</span>
        </div>
        {s === 0 && (
          <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-2">
            {[["WordPress", "REST API"], ["Shopify", "Admin API"], ["GitHub", "Pull Request"]].map(([name, sub], i) => (
              <div key={name} className={`rounded-xl border p-3 text-center backdrop-blur ${i === 2 ? "border-emerald-400/70 bg-emerald-500/20 text-white" : "border-white/15 bg-black/55 text-white/75"}`}>
                <div className="text-xs font-semibold">{name}</div>
                <div className="mt-0.5 text-[10px] text-white/60">{sub}</div>
                {i === 2 && <div className="mt-1.5 text-[10px] font-semibold text-emerald-300">Connected ✓</div>}
              </div>
            ))}
          </div>
        )}
        {(s === 1 || s === 2) && (
          <div className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-white/15 bg-black/65 font-mono text-[11px] backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-white/75">
              <span>☑ app/(marketing)/page.tsx</span>
              <span className="text-emerald-300">+4 -2</span>
            </div>
            <div className="bg-rose-500/15 px-3 py-1.5 text-rose-300">- description: &quot;Welcome to our site.&quot;</div>
            <div className="bg-emerald-500/15 px-3 py-1.5 text-emerald-300">+ description: &quot;AI SEO audits, rank tracking &amp; automated GitHub PR fixes.&quot;</div>
            <div className="bg-emerald-500/15 px-3 py-1.5 text-emerald-300">+ alternates: &#123; canonical: &quot;https://seokaroai.com&quot; &#125;</div>
          </div>
        )}
        {s === 3 && (
          <div className="mx-auto w-full max-w-md space-y-2.5 rounded-xl border border-emerald-400/40 bg-black/60 p-4 text-center backdrop-blur">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Icon name="GitPullRequest" size={14} /> Pull request #12 opened!
            </div>
            <div className="font-mono text-[11px] text-white/80">branch: seokaroai/fix-meta-schema · 9 files updated</div>
            <div className="text-[11px] text-white/60">Review &amp; merge on GitHub — zero direct pushes to main.</div>
          </div>
        )}
        <div className="h-1" />
      </div>
    );
  }

  if (tutorial.slug === "keyword-battle") {
    return (
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="font-mono">Keyword Battle · &quot;ai seo audit tool&quot;</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">vs Top 3</span>
        </div>
        <div className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-white/15 bg-black/60 text-[11px] backdrop-blur">
          <div className="grid grid-cols-5 border-b border-white/10 bg-white/5 px-3 py-2 font-semibold text-white/70">
            <span className="col-span-2">Signal</span><span className="text-white">You</span><span>#1</span><span>#2</span>
          </div>
          {[
            ["Word count", "480", "2,100", "1,850", true],
            ["FAQ schema", "No", "Yes", "Yes", true],
            ["Comparison table", "No", "Yes", "Yes", true],
            ["LCP speed", "1.4s", "2.1s", "2.4s", false],
          ].map(([sig, you, r1, r2, gap], idx) => (
            <div key={String(sig)} className={`grid grid-cols-5 border-t border-white/10 px-3 py-1.5 transition ${s >= 2 && gap ? "bg-rose-500/10" : ""} ${idx > s + 1 ? "opacity-40" : ""}`}>
              <span className="col-span-2 text-white/85">{sig}</span>
              <span className={gap ? "font-semibold text-rose-300" : "font-semibold text-emerald-300"}>{you}</span>
              <span className="text-white/65">{r1}</span>
              <span className="text-white/65">{r2}</span>
            </div>
          ))}
        </div>
        <div className="h-1" />
      </div>
    );
  }

  if (tutorial.slug === "rank-tracker") {
    const rows = [
      ["ai seo audit", "#4", "↑6", true],
      ["keyword battle tool", "#2", "↑9", true],
      ["shopify seo auto fix", "#7", "↑4", true],
      ["automated seo reports", "#11", "↓2", false],
    ];
    return (
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="font-mono">Rank Tracker · Daily Google Positions</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">3 in Top 10</span>
        </div>
        <div className="mx-auto w-full max-w-lg space-y-1.5 rounded-xl border border-white/15 bg-black/60 p-3 backdrop-blur">
          {rows.map(([kw, pos, delta, up], i) => (
            <div key={String(kw)} className={`flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] transition ${i <= s ? "opacity-100" : "opacity-45"}`}>
              <span className="truncate font-medium text-white">{kw}</span>
              <div className="flex items-center gap-2.5 font-mono">
                <span className="rounded bg-brand-500/25 px-1.5 py-0.5 text-brand-200">{pos}</span>
                <span className={up ? "font-semibold text-emerald-300" : "font-semibold text-rose-300"}>{delta}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-1" />
      </div>
    );
  }

  if (tutorial.slug === "ai-search-optimization") {
    const bots = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "llms.txt", "Organization JSON-LD"];
    return (
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="font-mono">GEO · AI Search Readiness</span>
          <span className="rounded-full bg-violet-500/25 px-2 py-0.5 text-[10px] text-violet-200">Citability 92/100</span>
        </div>
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
          {bots.map((b, i) => (
            <div key={b} className={`rounded-xl border p-2.5 text-[11px] backdrop-blur transition ${i <= s + 2 ? "border-emerald-400/45 bg-emerald-500/15 text-white" : "border-white/15 bg-black/50 text-white/60"}`}>
              <div className="truncate font-semibold">{b}</div>
              <div className="mt-1 text-[10px] text-emerald-300">{i <= s + 2 ? "Allowed ✓" : "Checking…"}</div>
            </div>
          ))}
        </div>
        <div className="h-1" />
      </div>
    );
  }

  if (tutorial.slug === "seo-reports") {
    return (
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="font-mono">Automated Reports · Weekly Schedule</span>
          <span className="rounded-full bg-sky-500/25 px-2 py-0.5 text-[10px] text-sky-200">PDF Ready</span>
        </div>
        <div className="mx-auto w-full max-w-lg space-y-3 rounded-xl border border-white/15 bg-black/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-white">
            <span className="font-semibold">Score Trend (Last 6 Weeks)</span>
            <span className="font-mono text-emerald-300">65 → 89 (+24)</span>
          </div>
          <div className="flex h-16 items-end gap-2">
            {[55, 62, 68, 74, 83, 89].map((v, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-teal-400 transition-all duration-300" style={{ height: `${i <= s + 2 ? v : 25}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-white/75">
            <span>Monday digest: Enabled ✓</span>
            <span className="rounded-md bg-white/15 px-2 py-0.5 font-medium text-white">Download PDF ↓</span>
          </div>
        </div>
        <div className="h-1" />
      </div>
    );
  }

  // website-seo-checker
  return (
    <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-6">
      <div className="flex items-center justify-between text-[11px] text-white/70">
        <span className="font-mono">Free Instant SEO Checker · No Signup</span>
        <span className="rounded-full bg-teal-500/25 px-2 py-0.5 text-[10px] text-teal-200">Shareable URL</span>
      </div>
      <div className="mx-auto w-full max-w-md space-y-2.5 rounded-xl border border-white/15 bg-black/60 p-4 backdrop-blur">
        <div className="flex gap-2">
          <div className="flex-1 truncate rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] text-white">https://example.com</div>
          <span className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-[11px] font-semibold text-white">Check</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
          {[["Title & Meta", "Pass ✓"], ["Canonical", "Pass ✓"], ["Robots & Sitemap", "Pass ✓"], ["Alt tags", "3 missing"]].map(([k, v], i) => (
            <div key={k} className={`rounded-lg border px-2.5 py-1.5 ${i === 3 ? "border-amber-400/40 bg-amber-500/15 text-amber-200" : "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"}`}>
              <span className="text-white/75">{k}:</span> <b>{v}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="h-1" />
    </div>
  );
}

/**
 * Full interactive video player with Play/Pause, Scrubber, Speed, Captions, Prev/Next.
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
        style={{ background: `radial-gradient(circle at 20% 15%, ${tutorial.accentFrom}44, transparent 55%), radial-gradient(circle at 85% 85%, ${tutorial.accentTo}38, transparent 55%), #09090e` }}
        onClick={togglePlay}
      >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <WalkthroughScene tutorial={tutorial} stepIndex={stepIndex} localPct={localPct} />

        {/* Captions bar */}
        {captions && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center sm:inset-x-6 sm:bottom-4">
            <div className="max-w-xl rounded-lg bg-black/80 px-3 py-1.5 text-center text-[12px] leading-snug text-white shadow-lg backdrop-blur sm:text-[13px]">
              <span className="mr-1.5 font-semibold text-brand-300">{step.title}:</span>
              {step.caption}
            </div>
          </div>
        )}

        {/* Center Play Overlay when paused */}
        {!playing && (
          <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-[1px] transition">
            <div className="flex flex-col items-center gap-2">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-2xl transition hover:scale-105 sm:h-16 sm:w-16">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  {elapsed >= total - 0.1
                    ? <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
                    : <path d="M8 5v14l11-7z" />}
                </svg>
              </span>
              <span className="rounded-full bg-black/70 px-3 py-0.5 text-[11.5px] font-medium text-white/90">
                {elapsed >= total - 0.1 ? "Replay walkthrough" : `Watch walkthrough · ${tutorial.durationLabel}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="space-y-2.5 border-t border-white/10 bg-[#0d0d14] px-3 py-3 sm:px-4">
        {/* Progress scrubber */}
        <div
          className="group relative h-2 w-full cursor-pointer rounded-full bg-white/15"
          role="slider"
          aria-label="Video progress"
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

        {/* Buttons row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={togglePlay} className="rounded-lg bg-white/10 px-2.5 py-1.5 font-medium text-white hover:bg-white/20">
              {playing ? "Pause" : elapsed >= total - 0.1 ? "Replay" : "Play"}
            </button>
            {onPrev && <button type="button" onClick={onPrev} className="rounded-lg bg-white/5 px-2 py-1.5 text-white/80 hover:bg-white/15" aria-label="Previous tutorial">‹ Prev</button>}
            {onNext && <button type="button" onClick={onNext} className="rounded-lg bg-white/5 px-2 py-1.5 text-white/80 hover:bg-white/15" aria-label="Next tutorial">Next ›</button>}
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

        {/* Clickable Chapters */}
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
 * Full /tutorials page hub: category filters, theater player, and all 8 tutorial cards.
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
      {/* Theater section */}
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
            <span className="muted font-mono">Lesson {active.number} · {active.durationLabel}</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{active.title}</h2>
          <p className="muted text-[14.5px] leading-relaxed">{active.summary}</p>
          <div className="border-t line pt-4">
            <div className="muted mb-2.5 text-[11px] font-semibold uppercase tracking-wider">What you will learn</div>
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
            <Link href={active.tryHref} className="btn btn-brand flex-1">Try this feature <Icon name="ArrowRight" size={15} /></Link>
            <Link href={active.featureHref} className="btn flex-1">Feature details</Link>
          </div>
        </div>
      </div>

      {/* Filter pills + All tutorials grid */}
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">All video tutorials ({visible.length})</h2>
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
                    {isCurrent ? "Now playing" : "Watch tutorial →"}
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
          <span className="text-[13px] font-semibold">Full Flow Playlist ({TUTORIALS.length} videos)</span>
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
