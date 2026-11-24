import { config } from "@/lib/config";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

interface Layout {
  preheader: string;
  heading: string;
  body: string; // trusted HTML built here
  cta?: { label: string; url: string };
  footerNote?: string;
}

/** Table-based, inline-styled layout that renders in Gmail, Outlook and Apple Mail. */
function layout(l: Layout): string {
  const btn = l.cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${esc(l.cta.url)}" style="display:inline-block;background:#0b6bcb;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;font-size:15px">${esc(l.cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(l.heading)}</title></head>
<body style="margin:0;background:#f3f6fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a">
<span style="display:none;max-height:0;overflow:hidden">${esc(l.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0">
<tr><td style="padding:20px 28px;border-bottom:1px solid #eef2f7"><img src="${config.appUrl}/brand/logo-mark-128.png" width="34" height="34" alt="" style="vertical-align:middle;margin-right:8px;border:0"><span style="font-size:20px;font-weight:800;color:#0f172a;vertical-align:middle">SEOKaro<span style="color:#7c3aed">AI</span></span></td></tr>
<tr><td style="padding:26px 28px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:21px;font-weight:700;padding-bottom:12px">${esc(l.heading)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;padding-bottom:16px">${l.body}</td></tr>
${btn}
</table></td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px solid #eef2f7;font-size:12px;color:#64748b;line-height:1.5">
${l.footerNote ? esc(l.footerNote) + "<br>" : ""}SEOKaroAI · <a href="${config.appUrl}" style="color:#64748b">${config.appUrl.replace(/^https?:\/\//, "")}</a> · <a href="${config.appUrl}/app/settings" style="color:#64748b">Email settings</a>
</td></tr></table></td></tr></table></body></html>`;
}

const text = (...lines: string[]) => lines.filter(Boolean).join("\n\n");

export function verifyEmail(name: string, url: string) {
  return {
    subject: "Confirm your email for SEOKaroAI",
    html: layout({
      preheader: "One click to activate your account.",
      heading: `Welcome${name ? `, ${name}` : ""}!`,
      body: "Confirm your email address to start running audits. The link works for 48 hours.",
      cta: { label: "Confirm email", url },
      footerNote: "If you did not create an account, you can ignore this email.",
    }),
    text: text("Confirm your email address to start using SEOKaroAI:", url, "The link works for 48 hours."),
  };
}

export function resetEmail(url: string) {
  return {
    subject: "Reset your SEOKaroAI password",
    html: layout({
      preheader: "Password reset link (valid for 1 hour).",
      heading: "Reset your password",
      body: "Someone (hopefully you) asked to reset the password for this account. The link works once, for 1 hour.",
      cta: { label: "Choose a new password", url },
      footerNote: "If you did not ask for this, ignore this email. Your password stays the same.",
    }),
    text: text("Reset your password (valid for 1 hour):", url),
  };
}

export function runDoneEmail(o: { title: string; kind: string; score: number | null; status: string; url: string; topIssues: string[] }) {
  const ok = o.status === "done";
  const kindLabel = o.kind === "keyword" ? "Keyword battle" : o.kind === "deep" ? "AI deep audit" : "Site audit";
  const issues = o.topIssues.slice(0, 5).map((i) => `<li style="margin:4px 0">${esc(i)}</li>`).join("");
  return {
    subject: ok ? `${kindLabel} ready: ${o.title}${o.score != null ? ` (${o.score}/100)` : ""}` : `${kindLabel} did not finish: ${o.title}`,
    html: layout({
      preheader: ok ? "Your report is ready." : "The run stopped before finishing.",
      heading: ok ? `${kindLabel} ready` : `${kindLabel} did not finish`,
      body: `<b>${esc(o.title)}</b>${o.score != null ? ` scored <b>${o.score}/100</b>.` : "."}` +
        (issues ? `<br><br>Top issues:<ul style="padding-left:18px;margin:8px 0">${issues}</ul>` : "") +
        (ok ? "" : "<br><br>Runs that fail do not count against your monthly allowance."),
      cta: { label: "Open the report", url: o.url },
    }),
    text: text(`${kindLabel} ${ok ? "ready" : "did not finish"}: ${o.title}`, o.topIssues.slice(0, 5).map((i) => `- ${i}`).join("\n"), o.url),
  };
}

export interface RankMove { keyword: string; project: string; from: number | null; to: number | null }

const pos = (n: number | null) => (n == null ? "not in top 100" : `#${n}`);

export function rankAlertEmail(moves: RankMove[], url: string) {
  const rows = moves.slice(0, 25).map((m) => {
    const up = m.to != null && (m.from == null || m.to < m.from);
    return `<tr><td style="padding:6px 8px;border-bottom:1px solid #eef2f7">${esc(m.keyword)}<br><span style="color:#64748b;font-size:12px">${esc(m.project)}</span></td>
<td style="padding:6px 8px;border-bottom:1px solid #eef2f7;white-space:nowrap">${pos(m.from)} → <b style="color:${up ? "#059669" : "#e11d48"}">${pos(m.to)}</b></td></tr>`;
  }).join("");
  return {
    subject: `Ranking changes: ${moves.length} keyword${moves.length === 1 ? "" : "s"} moved`,
    html: layout({
      preheader: "Big ranking moves since the last check.",
      heading: "Your rankings moved",
      body: `These keywords moved 3 or more places, or entered or left the top 10:<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;font-size:14px">${rows}</table>`,
      cta: { label: "See all rankings", url },
    }),
    text: text("Ranking changes:", moves.map((m) => `${m.keyword} (${m.project}): ${pos(m.from)} -> ${pos(m.to)}`).join("\n"), url),
  };
}

export interface DigestProject { name: string; score: number | null; prevScore: number | null; top10: number; tracked: number; up: number; down: number }

export function weeklyDigestEmail(name: string, projects: DigestProject[], url: string) {
  const rows = projects.map((p) => {
    const delta = p.score != null && p.prevScore != null ? p.score - p.prevScore : null;
    return `<tr><td style="padding:8px;border-bottom:1px solid #eef2f7"><b>${esc(p.name)}</b></td>
<td style="padding:8px;border-bottom:1px solid #eef2f7">${p.score ?? "–"}${delta ? ` <span style="color:${delta > 0 ? "#059669" : "#e11d48"}">(${delta > 0 ? "+" : ""}${delta})</span>` : ""}</td>
<td style="padding:8px;border-bottom:1px solid #eef2f7">${p.top10}/${p.tracked}</td>
<td style="padding:8px;border-bottom:1px solid #eef2f7"><span style="color:#059669">▲${p.up}</span> <span style="color:#e11d48">▼${p.down}</span></td></tr>`;
  }).join("");
  return {
    subject: "Your weekly SEO report",
    html: layout({
      preheader: "Scores, rankings and what changed this week.",
      heading: `Weekly report${name ? ` for ${name}` : ""}`,
      body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
<tr style="color:#64748b;font-size:12px;text-align:left"><th style="padding:8px">Website</th><th style="padding:8px">Score</th><th style="padding:8px">Top 10</th><th style="padding:8px">Moves (7d)</th></tr>${rows}</table>`,
      cta: { label: "Open dashboard", url },
      footerNote: "You get this every Monday. Turn it off in Settings.",
    }),
    text: text("Weekly SEO report", projects.map((p) => `${p.name}: score ${p.score ?? "-"}, top 10 ${p.top10}/${p.tracked}, up ${p.up}, down ${p.down}`).join("\n"), url),
  };
}

export function planChangedEmail(planName: string, status: string) {
  return {
    subject: `Your SEOKaroAI plan: ${planName}`,
    html: layout({
      preheader: "Your subscription was updated.",
      heading: `You are on ${planName}`,
      body: `Your subscription status is <b>${esc(status)}</b>. Your new limits apply right away.`,
      cta: { label: "View billing", url: `${config.appUrl}/app/billing` },
    }),
    text: text(`You are on ${planName} (${status}).`, `${config.appUrl}/app/billing`),
  };
}

export function contactAdminEmail(m: { name: string; email: string; company?: string | null; message: string }) {
  return {
    subject: `Contact form: ${m.name}`,
    html: layout({
      preheader: "New message from the website.",
      heading: "New contact message",
      body: `<b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt;${m.company ? ` · ${esc(m.company)}` : ""}<br><br>${esc(m.message).replace(/\n/g, "<br>")}`,
      cta: { label: "Open admin", url: `${config.appUrl}/admin/messages` },
    }),
    text: text(`${m.name} <${m.email}>`, m.message),
  };
}
