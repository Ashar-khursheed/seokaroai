import path from "node:path";
import { readJson, type KeywordInput } from "@/lib/files";
import type { QuickReport } from "@/lib/engine/quick";
import type { Run } from "@/lib/db/schema";

interface Finding {
  title?: string;
  issue?: string;
  severity?: string;
  description?: string;
  evidence?: string;
  recommendation?: string;
}
interface AuditCategory {
  name: string;
  score?: number | null;
  what_works?: string[];
  findings?: (Finding | string)[];
}
interface Competitor {
  domain?: string;
  name?: string;
  why?: string;
  strengths?: string[];
  we_lack?: string[];
}
interface AuditData {
  summary?: {
    health_score?: number;
    business_type?: string;
    top_findings?: (Finding | string)[];
    quick_wins?: string[];
  };
  categories?: AuditCategory[];
  competitors?: Competitor[];
  action_plan?:
    | { phases?: { name?: string; timeframe?: string; items?: string[] }[] }
    | { name?: string; timeframe?: string; items?: string[] }[];
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function scoreColor(n: number | null | undefined) {
  if (n == null) return "#64748b";
  return n >= 80 ? "#059669" : n >= 60 ? "#2563eb" : n >= 40 ? "#d97706" : "#dc2626";
}

function sevStyle(sev?: string) {
  const k = String(sev ?? "info").toLowerCase();
  if (k === "critical") return { bg: "#fef2f2", fg: "#b91c1c", border: "#ef4444" };
  if (k === "high") return { bg: "#fffbeb", fg: "#b45309", border: "#f59e0b" };
  if (k === "medium") return { bg: "#eff6ff", fg: "#1d4ed8", border: "#3b82f6" };
  if (k === "low") return { bg: "#ecfdf5", fg: "#047857", border: "#10b981" };
  return { bg: "#f8fafc", fg: "#475569", border: "#94a3b8" };
}

function sevBadge(sev?: string) {
  if (!sev) return "";
  const s = sevStyle(sev);
  return `<span class="badge" style="background:${s.bg};color:${s.fg};border-color:${s.border}33">${esc(sev)}</span>`;
}

function scoreSvg(score: number | null | undefined, size = 104) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = score == null ? 0 : Math.max(0, Math.min(100, Math.round(score)));
  const col = scoreColor(score);
  const offset = c - (v / 100) * c;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="flex-shrink:0">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="8" />
    ${score != null ? `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 50 50)" />` : ""}
    <text x="50" y="54" text-anchor="middle" font-size="26" font-weight="700" fill="#0f172a" font-family="system-ui,-apple-system,sans-serif">${score == null ? "–" : Math.round(score)}</text>
    <text x="50" y="69" text-anchor="middle" font-size="9.5" fill="#64748b" font-family="system-ui,-apple-system,sans-serif">/100</text>
  </svg>`;
}

function wrapHtml(opts: { title: string; subtitle: string; badge: string; score: number | null; meta: string[]; body: string; autoPrint: boolean }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(opts.title)} — SEOKaroAI Report</title>
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f8fafc; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif; font-size: 13.5px; line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .toolbar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 20px; background: #0f172a; color: #fff; font-size: 13px; }
  .toolbar-actions { display: flex; gap: 8px; }
  .tbtn { border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: #fff; padding: 6px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; text-decoration: none; }
  .tbtn-primary { background: #1f86ff; border-color: #1f86ff; }
  .page { max-width: 920px; margin: 24px auto 48px; padding: 0 20px; }
  .hero { display: flex; align-items: center; gap: 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px 28px; box-shadow: 0 1px 3px rgba(15,23,42,.05); }
  .brand-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; font-size: 12px; color: #64748b; }
  .brand { font-weight: 700; font-size: 14px; color: #0f172a; letter-spacing: -.02em; }
  .brand span { color: #1f86ff; }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #1f86ff; }
  h1 { margin: 4px 0 6px; font-size: 24px; line-height: 1.2; letter-spacing: -.02em; color: #0f172a; word-break: break-word; }
  .sub { color: #475569; font-size: 13.5px; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 10px; font-size: 12px; color: #64748b; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; margin-top: 18px; break-inside: avoid; }
  .card-flow { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; margin-top: 18px; }
  .card h2 { margin: 0 0 14px; font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .grid-5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
  .stat-val { font-size: 24px; font-weight: 700; line-height: 1.1; }
  .stat-lbl { margin-top: 4px; font-size: 12px; font-weight: 600; color: #334155; }
  .bar-row { display: grid; grid-template-columns: 180px 1fr 40px; align-items: center; gap: 12px; margin: 8px 0; font-size: 13px; }
  .bar-track { height: 9px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 99px; }
  .finding { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #94a3b8; border-radius: 10px; padding: 12px 14px; margin: 10px 0; break-inside: avoid; }
  .finding-title { font-weight: 650; color: #0f172a; }
  .finding p { margin: 5px 0 0; color: #334155; font-size: 13px; }
  .finding .fix { color: #047857; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; border: 1px solid transparent; margin-right: 6px; vertical-align: 1px; }
  ul, ol { margin: 8px 0; padding-left: 20px; }
  li { margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 8px; }
  th, td { border: 1px solid #e2e8f0; padding: 7px 10px; text-align: left; vertical-align: top; word-break: break-word; }
  th { background: #f1f5f9; font-weight: 650; color: #334155; }
  .cat-head { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
  .cat-head h3 { margin: 0; font-size: 16px; font-weight: 700; }
  .muted { color: #64748b; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11.5px; color: #64748b; }
  @media (max-width: 680px) {
    .hero { flex-direction: column; align-items: flex-start; padding: 18px; }
    .grid-2, .grid-3, .grid-5 { grid-template-columns: 1fr; }
    .bar-row { grid-template-columns: 120px 1fr 34px; }
  }
  @media print {
    html, body { background: #fff; }
    .toolbar { display: none !important; }
    .page { max-width: none; margin: 0; padding: 0; }
    .hero, .card, .card-flow { box-shadow: none; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <div><b>SEOKaroAI</b> · Print / Save PDF or HTML Report</div>
    <div class="toolbar-actions">
      <button class="tbtn tbtn-primary" onclick="window.print()">Save as PDF / Print</button>
    </div>
  </div>
  <main class="page">
    <div class="brand-row">
      <div class="brand">SEOKaro<span>AI</span></div>
      <div>Generated ${esc(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}</div>
    </div>
    <section class="hero">
      ${scoreSvg(opts.score, 108)}
      <div style="min-width:0;flex:1">
        <div class="eyebrow">${esc(opts.badge)}</div>
        <h1>${esc(opts.title)}</h1>
        ${opts.subtitle ? `<div class="sub">${esc(opts.subtitle)}</div>` : ""}
        <div class="meta">${opts.meta.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
      </div>
    </section>
    ${opts.body}
    <footer class="footer">
      <span>Prepared by SEOKaroAI (seokaroai.com)</span>
      <span>Confidential SEO Audit Report</span>
    </footer>
  </main>
  ${opts.autoPrint ? `<script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>` : ""}
</body>
</html>`;
}

export function renderRunExportHtml(run: Run, dir: string, autoPrint = false): string {
  const dateStr = (run.finishedAt ?? run.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  if (run.kind === "deep") {
    const data = readJson<AuditData>(path.join(dir, "audit-data.json"));
    const input = JSON.parse(run.input) as { url?: string };
    const host = (input.url ?? run.title).replace(/^https?:\/\//, "").replace(/\/$/, "");
    const score = data?.summary?.health_score ?? run.score ?? null;
    const phases = Array.isArray(data?.action_plan)
      ? data!.action_plan
      : (data?.action_plan as { phases?: { name?: string; timeframe?: string; items?: string[] }[] } | undefined)?.phases ?? [];

    const parts: string[] = [];
    if (!data) {
      parts.push(`<div class="card"><h2>Audit Summary</h2><p class="muted">No structured audit-data.json was found for this run.</p></div>`);
    } else {
      const topFindings = (data.summary?.top_findings ?? [])
        .map((f) => {
          const sev = typeof f === "string" ? undefined : f.severity;
          const title = typeof f === "string" ? f : f.title || f.issue || "Finding";
          const s = sevStyle(sev);
          return `<div class="finding" style="border-left-color:${s.border}"><div class="finding-title">${sevBadge(sev)}${esc(title)}</div></div>`;
        })
        .join("");
      const quickWins = (data.summary?.quick_wins ?? []).map((w) => `<li>${esc(w)}</li>`).join("");
      parts.push(`<div class="grid-2">
        <div class="card"><h2>Top Priority Issues</h2>${topFindings || `<p class="muted">None recorded.</p>`}</div>
        <div class="card"><h2>Quick Wins</h2>${quickWins ? `<ul>${quickWins}</ul>` : `<p class="muted">None recorded.</p>`}</div>
      </div>`);

      if ((data.categories ?? []).length > 0) {
        parts.push(`<div class="card"><h2>Category Scores</h2>${data.categories!
          .map((c) => {
            const col = scoreColor(c.score);
            return `<div class="bar-row"><span><b>${esc(c.name)}</b></span><div class="bar-track"><div class="bar-fill" style="width:${c.score ?? 0}%;background:${col}"></div></div><b style="text-align:right;color:${col}">${c.score ?? "–"}</b></div>`;
          })
          .join("")}</div>`);

        for (const c of data.categories!) {
          const works = (c.what_works ?? []).length
            ? `<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#059669">What works</div><ul>${c.what_works!.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>`
            : "";
          const fHtml = (c.findings ?? [])
            .map((f) => {
              const sev = typeof f === "string" ? undefined : f.severity;
              const title = typeof f === "string" ? f : f.title || f.issue || "Finding";
              const desc = typeof f === "string" ? "" : f.description || f.evidence || "";
              const rec = typeof f === "string" ? "" : f.recommendation || "";
              const s = sevStyle(sev);
              return `<div class="finding" style="border-left-color:${s.border}">
                <div class="finding-title">${sevBadge(sev)}${esc(title)}</div>
                ${desc ? `<p>${esc(desc)}</p>` : ""}
                ${rec ? `<p class="fix"><b>Fix:</b> ${esc(rec)}</p>` : ""}
              </div>`;
            })
            .join("");
          parts.push(`<div class="card-flow">
            <div class="cat-head">${scoreSvg(c.score, 58)}<h3>${esc(c.name)}</h3></div>
            ${works}${fHtml || `<p class="muted">No issues recorded in this category.</p>`}
          </div>`);
        }
      }

      if ((data.competitors ?? []).length > 0) {
        parts.push(`<div class="card-flow"><h2>Competitor Gap Analysis</h2><div class="grid-2">${data.competitors!
          .map((c) => `<div class="finding" style="border-left-color:#1f86ff">
            <div class="finding-title">${esc(c.domain || c.name)}</div>
            ${c.why ? `<p>${esc(c.why)}</p>` : ""}
            ${(c.strengths ?? []).length ? `<p><b>Strengths:</b> ${esc(c.strengths!.join(" · "))}</p>` : ""}
            ${(c.we_lack ?? []).length ? `<p style="color:#b91c1c"><b>What we lack:</b> ${esc(c.we_lack!.join(" · "))}</p>` : ""}
          </div>`)
          .join("")}</div></div>`);
      }

      if (phases.length > 0) {
        parts.push(`<div class="card-flow"><h2>90-Day Action Plan</h2><div class="grid-2">${phases
          .map((p) => `<div class="finding" style="border-left-color:#059669">
            <div class="finding-title">${esc(p.name)} ${p.timeframe ? `<span class="muted" style="font-weight:400">(${esc(p.timeframe)})</span>` : ""}</div>
            <ul>${(p.items ?? []).map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
          </div>`)
          .join("")}</div></div>`);
      }
    }

    return wrapHtml({
      title: host,
      subtitle: data?.summary?.business_type || "Full AI Deep SEO Audit",
      badge: "AI Deep Audit · SEO Health Score",
      score,
      meta: [`Status: ${run.status}`, `Date: ${dateStr}`, `${data?.categories?.length ?? 0} categories analyzed`],
      body: parts.join("\n"),
      autoPrint,
    });
  }

  if (run.kind === "keyword") {
    const input = JSON.parse(run.input) as KeywordInput;
    const cmp = readJson<any>(path.join(dir, "comparison.json"));
    const recsRaw = readJson<any>(path.join(dir, "recommendations.json"));
    const recs: any[] = Array.isArray(recsRaw) ? recsRaw : recsRaw?.recommendations ?? [];
    const parts: string[] = [];

    if (cmp?.intent) {
      parts.push(`<div class="card"><h2>Search Intent</h2><div class="grid-3">
        <div><div class="muted" style="font-size:11.5px">What Google rewards</div><b>${esc(cmp.intent.serp_intent)}</b></div>
        <div><div class="muted" style="font-size:11.5px">Winning page type</div><b>${esc(cmp.intent.winning_page_type)}</b></div>
        <div><div class="muted" style="font-size:11.5px">Your page type</div><b>${esc(cmp.intent.our_page_type)}</b></div>
      </div>${cmp.intent.note ? `<p class="muted" style="margin-top:8px">${esc(cmp.intent.note)}</p>` : ""}</div>`);
    }

    if ((cmp?.metrics ?? []).length > 0) {
      const cols = ["target", "c1", "c2", "c3"];
      const head = cols.map((k) => `<th>${esc(cmp.pages?.find((p: any) => p.key === k)?.label ?? (k === "target" ? "Your page" : k))}</th>`).join("");
      const rows = cmp.metrics
        .map((m: any) => `<tr><td><b>${esc(m.label || m.key)}</b></td>${cols.map((k) => `<td>${esc(m[k] === true ? "✓" : m[k] === false ? "✗" : m[k] ?? "–")}</td>`).join("")}<td>${esc(m.note || m.verdict || "")}</td></tr>`)
        .join("");
      parts.push(`<div class="card-flow"><h2>Side-by-Side Comparison</h2><table><thead><tr><th>Signal</th>${head}<th>Verdict</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }

    if (recs.length > 0) {
      parts.push(`<div class="card-flow"><h2>Prioritised Recommendations (${recs.length})</h2>${recs
        .map((r) => {
          const s = sevStyle(r.priority);
          return `<div class="finding" style="border-left-color:${s.border}">
            <div class="finding-title">${sevBadge(r.priority)}${esc(r.title)}</div>
            ${r.action ? `<p>${esc(r.action)}</p>` : ""}
            ${r.our_page_now ? `<p class="muted"><b>Now:</b> ${esc(r.our_page_now)}</p>` : ""}
            ${r.expected_impact ? `<p class="fix"><b>Impact:</b> ${esc(r.expected_impact)}</p>` : ""}
          </div>`;
        })
        .join("")}</div>`);
    }

    return wrapHtml({
      title: `“${input.keyword}”`,
      subtitle: `${input.targetUrl} · ${input.country}`,
      badge: "Keyword Battle Report",
      score: cmp?.score ?? run.score ?? null,
      meta: [`Your position: ${cmp?.our_position ? `#${cmp.our_position}` : "Not in top results"}`, `Date: ${dateStr}`],
      body: parts.join("\n"),
      autoPrint,
    });
  }

  // Quick Site Audit
  const r = readJson<QuickReport>(path.join(dir, "quick-report.json"));
  const input = JSON.parse(run.input) as { url?: string };
  const host = (input.url ?? run.title).replace(/^https?:\/\//, "").replace(/\/$/, "");
  const parts: string[] = [];

  if (r) {
    parts.push(`<div class="card"><h2>Category Scores</h2><div class="grid-5">${r.categories
      .map((c) => `<div class="stat"><div class="stat-val" style="color:${scoreColor(c.score)}">${c.score ?? "–"}</div><div class="stat-lbl">${esc(c.label)}</div></div>`)
      .join("")}</div></div>`);

    for (const c of r.categories) {
      const issuesHtml = c.issues
        .map((i) => {
          const s = sevStyle(i.severity);
          return `<div class="finding" style="border-left-color:${s.border}">
            <div class="finding-title">${sevBadge(i.severity)}${esc(i.title)}${i.affected_pages ? ` <span class="muted">(${i.affected_pages} pages)</span>` : ""}</div>
            ${i.detail ? `<p>${esc(i.detail)}</p>` : ""}
            ${i.evidence ? `<p class="muted">Evidence: ${esc(i.evidence)}</p>` : ""}
          </div>`;
        })
        .join("");
      parts.push(`<div class="card-flow">
        <div class="cat-head">${scoreSvg(c.score, 56)}<h3>${esc(c.label)}</h3></div>
        ${issuesHtml || `<p style="color:#047857">No issues found${c.score == null ? " (not measured)" : ""}.</p>`}
      </div>`);
    }

    if (r.pages.length > 0) {
      parts.push(`<div class="card-flow"><h2>Checked Pages (${r.pages.length})</h2><table><thead><tr><th>Page</th><th>Status</th><th>Score</th><th>Words</th><th>Issues</th></tr></thead><tbody>${r.pages
        .map((p) => `<tr><td><b>${esc(p.title || p.url)}</b><div class="muted" style="font-size:11px">${esc(p.url)}</div></td><td>${esc(p.status ?? "–")}</td><td><b style="color:${scoreColor(p.score)}">${esc(p.score ?? "–")}</b></td><td>${esc(p.word_count ?? "–")}</td><td>${esc(p.error ?? p.findings.length)}</td></tr>`)
        .join("")}</tbody></table></div>`);
    }
  }

  return wrapHtml({
    title: host,
    subtitle: "Automated Site Audit Report",
    badge: "Site Audit · SEO Health Score",
    score: r?.score ?? run.score ?? null,
    meta: [`Pages checked: ${r?.pages.length ?? 0}`, `Date: ${dateStr}`],
    body: parts.join("\n"),
    autoPrint,
  });
}
