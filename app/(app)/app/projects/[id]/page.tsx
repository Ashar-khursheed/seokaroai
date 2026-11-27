import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { parseJson } from "@/lib/db";
import { effectivePlan } from "@/lib/plans";
import { COUNTRIES, LANGUAGES, config } from "@/lib/config";
import { AUDIT_FLOW_KEYS } from "@/lib/prompts";
import { rankTrackingAvailable } from "@/lib/engine/ranks";
import { projectConnectors } from "@/lib/connectors";
import { CONNECTOR_INFO } from "@/lib/connectors/types";
import { localFoldersAllowed } from "@/lib/connectors/folder";
import { analyzeInternalLinks } from "@/lib/internal-links";
import { gatekeeperSecret, monthlyGatekeeperCount, recentGatekeeperLogs } from "@/lib/pr-gatekeeper";
import { latestTop10, ownedProject, projectKeywords, rankBuckets, rankHistory, recentRuns, scoreHistory } from "@/lib/queries";
import { ActionForm, AutoRefresh, ConfirmButton, SubmitButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { Card, Delta, KIND_ICON, KIND_LABEL, Position, ScoreChart, ScoreRing, SevBadge, Sparkline, StatusPill, timeAgo } from "@/components/ui";
import { addKeywords, deleteKeyword, deleteProject, startDeepAudit, startQuickAudit, updateProject } from "../../actions";
import { deleteConnector, retestConnector, saveConnector, startFix } from "../../connect-actions";
import { LocalFolderStart } from "@/components/local-folder";
import { AGENTS } from "@/lib/agents-catalog";

const FLOW_LABELS: Record<string, string> = {
  cluster: "Topic clusters + map", "competitor-pages": "Competitor comparison pages", "content-briefs": "Content briefs", plan: "90-day SEO plan",
  flow: "FLOW framework", programmatic: "Programmatic SEO", local: "Local SEO", hreflang: "International / hreflang",
};
const CONN_ICON: Record<string, string> = { wordpress: "Globe", shopify: "ShoppingBag", github: "GitPullRequest", local: "Folder", folder: "Folder" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const p = await ownedProject(user, Number((await params).id));
  return { title: p?.name ?? "Website" };
}

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const p = await ownedProject(user, Number((await params).id));
  if (!p) notFound();
  const sp = await searchParams;
  const tab = ["overview", "rankings", "fix", "reports", "settings"].includes(sp.tab ?? "") ? sp.tab! : "overview";
  const plan = effectivePlan(user);
  const [kws, runs, history, conns] = await Promise.all([projectKeywords(p.id), recentRuns({ projectId: p.id, limit: 40 }), scoreHistory(p.id), projectConnectors(p.id)]);
  const latestAudit = runs.find((r) => r.status === "done" && (r.kind === "quick" || r.kind === "deep"));
  const latestQuick = runs.find((r) => r.status === "done" && r.kind === "quick");
  const [internalLinks, prLogs, prUsed] =
    tab === "fix"
      ? await Promise.all([
          analyzeInternalLinks(latestQuick?.id ?? null, kws.map((k) => k.keyword)),
          recentGatekeeperLogs(p.id, 10),
          monthlyGatekeeperCount(p.id),
        ])
      : [{ pagesAnalyzed: 0, suggestions: [], instructions: "" }, [], 0];
  const prLimit = user.role === "admin" ? 10000 : plan.limits.prChecks;
  const ghWebhookUrl = `${config.appUrl}/api/webhooks/github?project=${p.id}`;
  const ghWebhookSecret = gatekeeperSecret(p.id);
  const latestSummary = parseJson<{ categories?: { label: string; score: number | null }[]; top_issues?: { severity: string; title: string }[] }>(latestAudit?.summary, {});
  const running = runs.some((r) => r.status === "running" || r.status === "queued");
  const buckets = rankBuckets(kws);
  const tabs: [string, string, string][] = [["overview", "Overview", "LayoutDashboard"], ["rankings", `Rankings · ${kws.length}`, "TrendingUp"], ["fix", "Connect & Fix", "WandSparkles"], ["reports", `Reports · ${runs.length}`, "FileText"], ["settings", "Settings", "Settings"]];

  return (
    <div className="space-y-6">
      <AutoRefresh active={running} ms={12000} />
      {sp.error && <div className="rounded-xl border border-crit/30 bg-crit/10 px-4 py-3 text-[14px]">{sp.error}</div>}
      {sp.new && <div className="flex items-start gap-2 rounded-xl border border-low/30 bg-low/10 px-4 py-3 text-[14px] sm:items-center"><Icon name="CircleCheck" size={16} className="mt-0.5 shrink-0 text-low sm:mt-0" /><span>Website added. The first site audit is running; results appear here in a couple of minutes.</span></div>}

      <section className="flex flex-wrap items-center gap-4 sm:gap-6">
        <ScoreRing score={p.lastScore} size={96} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] sm:text-[28px] font-semibold tracking-[-0.03em]">{p.name}</h1>
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="muted inline-flex max-w-full items-center gap-1 break-all text-[14px] hover:text-[var(--ink)]">{p.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}<Icon name="ArrowUpRight" size={13} /></a>
          <div className="muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            <span>{p.country} · {p.language}</span><span>Audited {timeAgo(p.lastAuditAt)}</span><span>Auto audit {p.autoAudit}</span><span>Rank checks {p.rankFrequency}</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <form action={startQuickAudit}><input type="hidden" name="projectId" value={p.id} /><SubmitButton className="btn" pendingText="Starting…"><Icon name="ScanSearch" size={15} />Run site audit</SubmitButton></form>
          <Link href={`/app/battles/new?projectId=${p.id}`} className="btn"><Icon name="Swords" size={15} />Keyword battle</Link>
          <Link href={`/app/projects/${p.id}?tab=overview#deep`} className="btn btn-primary"><Icon name="BrainCircuit" size={15} />AI deep audit</Link>
        </div>
      </section>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto whitespace-nowrap border-b line" aria-label="Website sections">
        {tabs.map(([t, l, ic]) => (
          <Link key={t} href={`/app/projects/${p.id}?tab=${t}`}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13.5px] transition ${tab === t ? "border-[var(--ink)] font-medium" : "muted border-transparent hover:text-[var(--ink)]"}`}>
            <Icon name={ic} size={15} />{l}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card title="Score history" className="xl:col-span-2"><ScoreChart points={history} /></Card>
            <Card title="Ranking status" action={<Link href={`/app/projects/${p.id}?tab=rankings`} className="muted text-[12.5px] hover:text-[var(--ink)]">Open</Link>}>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border line bg-[var(--line)]">
                {[["Top 3", buckets.top3], ["Top 10", buckets.top10], ["Top 100", buckets.top100], ["Tracked", buckets.total]].map(([l, v]) => (
                  <div key={l} className="bg-[var(--panel)] p-4"><div className="text-2xl font-semibold tabular-nums">{v}</div><div className="muted text-[12px]">{l}</div></div>
                ))}
              </div>
            </Card>
          </div>
          {latestAudit && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card title={`Latest ${KIND_LABEL[latestAudit.kind].toLowerCase()} · ${timeAgo(latestAudit.finishedAt)}`} action={<Link href={`/app/runs/${encodeURIComponent(latestAudit.id)}`} className="text-[12.5px] font-medium text-brand-500">Open report</Link>}>
                <div className="space-y-3">
                  {(latestSummary.categories ?? []).map((c) => (
                    <div key={c.label} className="grid grid-cols-[minmax(100px,130px)_1fr_32px] items-center gap-3 text-[13.5px] sm:grid-cols-[150px_1fr_32px]">
                      <span className="truncate">{c.label}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-[var(--panel2)]"><span className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-400" style={{ width: `${c.score ?? 0}%` }} /></span>
                      <b className="text-right tabular-nums">{c.score ?? "–"}</b>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Top issues" action={<Link href={`/app/projects/${p.id}?tab=fix`} className="text-[12.5px] font-medium text-brand-500">Fix them</Link>}>
                <ul className="space-y-2">{(latestSummary.top_issues ?? []).map((i, k) => <li key={k} className="flex items-start gap-2.5 text-[14px]">{i.severity && <span className="shrink-0"><SevBadge s={i.severity} /></span>}<span className="min-w-0 break-words">{i.title}</span></li>)}</ul>
              </Card>
            </div>
          )}
          <section id="deep" className="panel scroll-mt-20 p-4 sm:p-6">
            <div className="flex items-center gap-2 font-semibold"><Icon name="BrainCircuit" size={18} className="text-brand-500" />AI deep audit</div>
            <p className="muted mt-1.5 text-[14px]">A team of specialist agents audits the site, analyses competitors and writes the flows you pick. 15 to 40 minutes. {plan.limits.deepAudits ? `${plan.limits.deepAudits} a month on your plan.` : "Not included in the Free plan."}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{AGENTS.filter((ag) => ag.id !== "orchestrator").map((ag) => <span key={ag.id} className="chip"><Icon name={ag.icon} size={12} className="text-brand-500" />{ag.name}</span>)}</div>
            {plan.limits.deepAudits ? (
              <ActionForm action={startDeepAudit} className="mt-5 space-y-4">
                <input type="hidden" name="projectId" value={p.id} />
                <Field label="Competitors (optional)"><textarea name="competitors" rows={2} className="input" defaultValue={parseJson<string[]>(p.competitors, []).join("\n")} /></Field>
                <fieldset><legend className="mb-2 text-[13px] font-medium">Include</legend>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{AUDIT_FLOW_KEYS.map((f) => <label key={f} className="flex items-center gap-2 text-[13.5px]"><input type="checkbox" name="flows" value={f} defaultChecked className="accent-[#1f86ff]" />{FLOW_LABELS[f] ?? f}</label>)}</div>
                </fieldset>
                <Field label="Notes for the agents (optional)"><input name="notes" maxLength={2000} className="input" placeholder="e.g. we only sell B2B in the UAE" /></Field>
                <SubmitButton className="btn btn-brand w-full sm:w-auto" pendingText="Starting…">Start AI deep audit</SubmitButton>
              </ActionForm>
            ) : <Link href="/app/billing" className="btn btn-brand mt-5 w-full sm:w-auto">Upgrade to unlock</Link>}
          </section>
        </>
      )}

      {tab === "rankings" && <Rankings projectId={p.id} kws={kws} limit={plan.limits.keywords} targetUrl={p.url} />}

      {tab === "fix" && (
        <div className="space-y-4">
          <Card title="Connected platforms">
            {conns.length === 0 ? <p className="muted text-[14px]">Nothing connected yet. Connect your CMS or repository below so AI can turn audit findings into real changes. You review every change before it ships.</p> : (
              <div className="-mx-2">{conns.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[var(--panel2)]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border line text-brand-500"><Icon name={CONN_ICON[c.kind] ?? "Plug"} size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">{c.name}</div>
                    <div className={`truncate text-[12.5px] ${c.status === "ok" ? "text-low" : c.status === "error" ? "text-crit" : "muted"}`}>{c.status === "ok" ? `Connected · tested ${timeAgo(c.lastTestedAt)}` : c.lastError ?? "Not tested"}</div>
                  </div>
                  <form action={retestConnector}><input type="hidden" name="connectorId" value={c.id} /><SubmitButton className="btn !py-1.5 text-[12.5px]" pendingText="Testing…"><Icon name="RefreshCw" size={13} />Test</SubmitButton></form>
                  <form action={deleteConnector}><input type="hidden" name="connectorId" value={c.id} /><ConfirmButton className="btn btn-ghost !p-1.5 text-crit" message={`Disconnect ${c.name}? Saved credentials are deleted.`}><Icon name="Trash2" size={15} /></ConfirmButton></form>
                </div>
              ))}</div>
            )}
          </Card>

          {conns.some((c) => c.status === "ok" && c.kind !== "local") && (
            <Card title="Start an AI auto-fix">
              <ActionForm action={startFix} className="space-y-4">
                <input type="hidden" name="projectId" value={p.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Platform"><select name="connectorId" className="input">{conns.filter((c) => c.status === "ok" && c.kind !== "local").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                  <Field label="Fix findings from"><select name="sourceRunId" className="input"><option value="">Latest audit</option>{runs.filter((r) => r.status === "done" && (r.kind === "quick" || r.kind === "deep")).map((r) => <option key={r.id} value={r.id}>{r.title} · {timeAgo(r.finishedAt)}</option>)}</select></Field>
                </div>
                <Field label="Instructions (optional)"><input name="instructions" maxLength={2000} className="input" placeholder="e.g. focus on product pages; keep the brand name at the end of titles" /></Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <SubmitButton className="btn btn-brand w-full sm:w-auto" pendingText="Starting…"><Icon name="WandSparkles" size={15} />Propose fixes</SubmitButton>
                  <span className="muted text-[12.5px]">Nothing changes until you approve it. {plan.limits.fixes} auto-fixes a month on your plan.</span>
                </div>
              </ActionForm>
            </Card>
          )}

          {/* Auto Internal Linking */}
          <Card title="Auto Internal Linking (zero-cost opportunity scan)">
            {internalLinks.suggestions.length === 0 ? (
              <p className="muted text-[13.5px]">Run a site audit first so SEOKaroAI can map your pages and suggest high-impact internal links.</p>
            ) : (
              <div className="space-y-4">
                <p className="muted text-[13.5px]">Found <b>{internalLinks.suggestions.length}</b> contextual internal link opportunities across {internalLinks.pagesAnalyzed} crawled pages. Review below or ship them in one click via AI Auto-Fix.</p>
                <div className="table-wrap">
                  <table className="w-full min-w-[600px] text-[13px]">
                    <thead><tr className="muted border-b line text-left text-xs"><th className="py-2 pr-3">From page</th><th className="pr-3">Link to</th><th className="pr-3">Suggested anchor</th><th>Why</th></tr></thead>
                    <tbody>
                      {internalLinks.suggestions.map((s) => (
                        <tr key={`${s.fromUrl}-${s.toUrl}`} className="border-b line last:border-0">
                          <td className="py-2 pr-3 font-mono text-xs">{s.fromUrl}</td>
                          <td className="pr-3 font-mono text-xs text-brand-500">{s.toUrl}</td>
                          <td className="wrap pr-3 font-medium">“{s.anchor}”</td>
                          <td className="wrap muted text-xs">{s.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {conns.some((c) => c.status === "ok" && c.kind !== "local") && (
                  <ActionForm action={startFix} className="flex flex-col gap-3 border-t line pt-4 sm:flex-row sm:items-center">
                    <input type="hidden" name="projectId" value={p.id} />
                    <input type="hidden" name="sourceRunId" value={latestQuick?.id ?? ""} />
                    <input type="hidden" name="instructions" value={internalLinks.instructions} />
                    <select name="connectorId" className="input sm:!w-auto">
                      {conns.filter((c) => c.status === "ok" && c.kind !== "local").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <SubmitButton className="btn btn-brand w-full sm:w-auto" pendingText="Starting…">
                      <Icon name="WandSparkles" size={15} />Ship internal links via Auto-Fix
                    </SubmitButton>
                    <span className="muted text-xs">Uses 1 metered Auto-Fix run · review diff before applying.</span>
                  </ActionForm>
                )}
              </div>
            )}
          </Card>

          {/* GitHub PR SEO Gatekeeper */}
          <Card title="GitHub PR SEO Gatekeeper · automated PR checks">
            {prLimit <= 0 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-medium">Block SEO regressions before code merges to main</div>
                  <p className="muted mt-1 text-[13.5px]">Automatically checks every GitHub Pull Request for accidental <code className="font-mono">noindex</code>, <code className="font-mono">robots.txt</code> blocks, missing <code className="font-mono">alt</code> tags, overlong titles/metas, and duplicate H1s. Included in Starter ($39/mo) &amp; above.</p>
                </div>
                <Link href="/app/billing" className="btn btn-brand shrink-0">Upgrade to Starter</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="muted">Automatically comments SEO Pass/Fail checks on every opened or updated Pull Request.</span>
                  <span className="chip !py-0.5 font-mono text-xs">{prUsed} / {user.role === "admin" ? "∞" : prLimit} checks this month</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="panel2 min-w-0 rounded-xl border line p-3">
                    <div className="muted text-[11px] font-semibold uppercase tracking-wider">1. Payload URL (GitHub → Settings → Webhooks)</div>
                    <div className="mt-1 select-all break-all font-mono text-xs">{ghWebhookUrl}</div>
                  </div>
                  <div className="panel2 min-w-0 rounded-xl border line p-3">
                    <div className="muted text-[11px] font-semibold uppercase tracking-wider">2. Webhook Secret (Content type: application/json)</div>
                    <div className="mt-1 select-all break-all font-mono text-xs">{ghWebhookSecret}</div>
                  </div>
                </div>
                <p className="muted text-xs">3. Under <b>Which events would you like to trigger this webhook?</b> select <b>Pull requests</b> (make sure your GitHub connector above is connected so SEOKaroAI can post PR review comments).</p>
                {prLogs.length > 0 && (
                  <div className="table-wrap border-t line pt-3">
                    <table className="w-full min-w-[560px] text-[13px]">
                      <thead><tr className="muted border-b line text-left text-xs"><th className="py-2 pr-3">Pull Request</th><th className="pr-3">Result</th><th className="pr-3">Issues</th><th>Checked</th></tr></thead>
                      <tbody>
                        {prLogs.map((log) => (
                          <tr key={log.id} className="border-b line last:border-0">
                            <td className="wrap py-2 pr-3">
                              <a href={log.pr_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-brand-500">#{log.pr_number} · {log.pr_title}</a>
                              <div className="muted text-[11.5px]">{log.summary}</div>
                            </td>
                            <td className="pr-3">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${log.status === "passed" ? "bg-low/15 text-low" : log.status === "failed" ? "bg-crit/15 text-crit" : "bg-high/15 text-high"}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="pr-3 tabular-nums">{log.issues_count}</td>
                            <td className="muted text-xs">{timeAgo(new Date(log.created_at))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <ConnectorForm projectId={p.id} kind="wordpress" fields={[
              { name: "siteUrl", label: "Site URL", placeholder: "https://www.example.com" },
              { name: "username", label: "Username", placeholder: "editor account" },
              { name: "secret", label: "Application Password", placeholder: "xxxx xxxx xxxx xxxx xxxx xxxx", secret: true, hint: "WordPress → Users → Profile → Application Passwords" },
            ]} />
            <ConnectorForm projectId={p.id} kind="shopify" fields={[
              { name: "shop", label: "Store domain", placeholder: "your-store.myshopify.com" },
              { name: "secret", label: "Admin API access token", placeholder: "shpat_…", secret: true, hint: "Settings → Apps → Develop apps → scopes: read/write products and content" },
            ]} />
            <ConnectorForm projectId={p.id} kind="github" fields={[
              { name: "repo", label: "Repository", placeholder: "owner/website" },
              { name: "branch", label: "Base branch (optional)", placeholder: "main" },
              { name: "secret", label: "Fine-grained token", placeholder: "github_pat_…", secret: true, hint: "This repository only · Contents and Pull requests: read and write" },
            ]} />
            <section className="panel p-4 sm:p-5 lg:col-span-2">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border line text-brand-500"><Icon name="Folder" size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block font-medium">Computer folder</span><span className="muted mt-0.5 block text-[13px] leading-snug">{CONNECTOR_INFO.local.blurb}</span></span>
              </div>
              <div className="mt-5"><LocalFolderStart projectId={p.id} audits={runs.filter((r) => r.status === "done" && (r.kind === "quick" || r.kind === "deep")).map((r) => ({ id: r.id, title: `${r.title} · ${timeAgo(r.finishedAt)}` }))} /></div>
            </section>
            {localFoldersAllowed() && user.role === "admin" && (
              <ConnectorForm projectId={p.id} kind="folder" fields={[{ name: "path", label: "Folder on this server", placeholder: "F:\\sites\\my-website" }]} />
            )}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <Card title="Reports">
          {runs.length === 0 ? <p className="muted text-[14px]">No reports yet.</p> : (
            <div className="-mx-2">{runs.map((r) => (
              <Link key={r.id} href={`/app/runs/${encodeURIComponent(r.id)}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[var(--panel2)] sm:gap-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border line text-brand-500"><Icon name={KIND_ICON[r.kind] ?? "FileText"} size={16} /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{r.title}</div><div className="muted truncate text-[12.5px]">{KIND_LABEL[r.kind]}{r.triggerType === "schedule" ? " · scheduled" : ""} · {timeAgo(r.createdAt)}</div></div>
                {r.score != null && <b className="shrink-0 tabular-nums">{r.score}</b>}<StatusPill status={r.status} />
              </Link>
            ))}</div>
          )}
        </Card>
      )}

      {tab === "settings" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Website settings">
            <ActionForm action={updateProject}>
              <input type="hidden" name="projectId" value={p.id} />
              <Field label="Name"><input name="name" defaultValue={p.name} className="input" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Market"><select name="country" defaultValue={p.country} className="input">{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Language"><select name="language" defaultValue={p.language} className="input">{LANGUAGES.map((c) => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Automatic audit"><select name="autoAudit" defaultValue={p.autoAudit} className="input">{plan.autoAudits.map((o) => <option key={o} value={o}>{o === "off" ? "Off" : o === "weekly" ? "Every week" : "Every month"}</option>)}</select></Field>
                <Field label="Rank checks"><select name="rankFrequency" defaultValue={p.rankFrequency} className="input">{plan.rankFrequencies.map((o) => <option key={o} value={o}>{o === "off" ? "Off" : o === "daily" ? "Every day" : "Every week"}</option>)}</select></Field>
              </div>
              <Field label="Competitors"><textarea name="competitors" rows={3} className="input" defaultValue={parseJson<string[]>(p.competitors, []).join("\n")} /></Field>
              <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
            </ActionForm>
          </Card>
          <Card title="Danger zone">
            <p className="muted text-[14px]">Deleting removes this website, its keywords, ranking history and connectors. Reports stay in Reports.</p>
            <form action={deleteProject} className="mt-4"><input type="hidden" name="projectId" value={p.id} />
              <ConfirmButton className="btn !border-crit/40 !text-crit" message={`Delete ${p.name} and all its keywords? This cannot be undone.`}><Icon name="Trash2" size={15} />Delete website</ConfirmButton></form>
          </Card>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[13px] font-medium">{label}</span>{children}</label>;
}

function ConnectorForm({ projectId, kind, fields }: { projectId: number; kind: keyof typeof CONNECTOR_INFO; fields: { name: string; label: string; placeholder?: string; secret?: boolean; hint?: string }[] }) {
  const info = CONNECTOR_INFO[kind];
  return (
    <details className="panel group p-4 sm:p-5">
      <summary className="flex cursor-pointer list-none items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border line text-brand-500"><Icon name={CONN_ICON[kind]} size={16} /></span>
        <span className="min-w-0 flex-1"><span className="block font-medium">Connect {info.label}</span><span className="muted mt-0.5 block text-[13px] leading-snug">{info.blurb}</span></span>
        <Icon name="Plus" size={16} className="muted mt-1 shrink-0 transition group-open:rotate-45" />
      </summary>
      <ActionForm action={saveConnector} className="mt-5 space-y-3.5" resetOnOk>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="kind" value={kind} />
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1.5 block text-[13px] font-medium">{f.label}</span>
            <input name={f.name} type={f.secret ? "password" : "text"} autoComplete="off" placeholder={f.placeholder} className="input" />
            {f.hint && <span className="muted mt-1 block text-[12px]">{f.hint}</span>}
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Connecting…"><Icon name="Plug" size={15} />Connect and test</SubmitButton>
          <span className="muted flex items-center gap-1.5 text-[12px]"><Icon name="Lock" size={12} className="shrink-0" />Encrypted at rest, never sent to AI</span>
        </div>
      </ActionForm>
    </details>
  );
}

async function Rankings({ projectId, kws, limit, targetUrl }: { projectId: number; kws: Awaited<ReturnType<typeof projectKeywords>>; limit: number; targetUrl: string }) {
  const hist = await rankHistory(kws.map((k) => k.id));
  const tops = new Map<number, { domain: string; position: number }[]>();
  for (const k of kws.slice(0, 200)) {
    const t = await latestTop10(k.id);
    if (t?.top) tops.set(k.id, parseJson(t.top, []));
  }
  return (
    <div className="space-y-4">
      {!(await rankTrackingAvailable()) && <div className="flex items-start gap-2 rounded-xl border border-high/30 bg-high/10 px-4 py-3 text-[14px] sm:items-center"><Icon name="TriangleAlert" size={16} className="mt-0.5 shrink-0 text-high sm:mt-0" /><span>Live rank data is not switched on for this server yet. Keywords are saved and checked as soon as it is.</span></div>}
      <Card title="Add keywords">
        <ActionForm action={addKeywords} className="flex flex-col gap-3 sm:flex-row sm:items-start" resetOnOk>
          <input type="hidden" name="projectId" value={projectId} />
          <textarea name="keywords" rows={2} required className="input flex-1" placeholder="One keyword per line, or comma separated" />
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Adding…"><Icon name="Plus" size={15} />Add</SubmitButton>
        </ActionForm>
        <p className="muted mt-2 text-[12.5px]">{kws.length} tracked here · {limit} allowed across all websites on your plan.</p>
      </Card>
      <Card title="Keyword rankings">
        {kws.length === 0 ? <p className="muted text-[14px]">No keywords yet.</p> : (
          <div className="table-wrap">
            <table className="w-full min-w-[860px] text-[14px]">
              <thead><tr className="muted border-b line text-left text-[12px]"><th className="py-2 font-medium">Keyword</th><th className="font-medium">Position</th><th className="font-medium">Change</th><th className="font-medium">Best</th><th className="font-medium">30 days</th><th className="font-medium">Ranking URL</th><th className="font-medium">#1 today</th><th></th></tr></thead>
              <tbody>{kws.map((k) => {
                const h = hist.get(k.id) ?? [];
                const top = tops.get(k.id) ?? [];
                return (
                  <tr key={k.id} className="border-b line align-middle last:border-0">
                    <td className="py-3 font-medium">{k.keyword}<div className="muted text-[11.5px] font-normal">checked {timeAgo(k.lastCheckedAt)}</div></td>
                    <td><Position value={k.position} /></td>
                    <td><Delta from={k.previousPosition} to={k.position} /></td>
                    <td><Position value={k.bestPosition} /></td>
                    <td><Sparkline values={h.map((x) => x.position ?? 101)} invert /></td>
                    <td className="max-w-[220px] truncate"><span className="muted text-[12.5px]">{k.rankingUrl ? k.rankingUrl.replace(/^https?:\/\/[^/]+/, "") || "/" : "–"}</span></td>
                    <td className="max-w-[160px] truncate text-[12.5px]">{top[0]?.domain ?? "–"}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/app/battles/new?projectId=${projectId}&keyword=${encodeURIComponent(k.keyword)}&targetUrl=${encodeURIComponent(k.targetUrl ?? k.rankingUrl ?? targetUrl)}`} className="btn !px-2 !py-1 text-[12px]"><Icon name="Swords" size={13} />Battle</Link>
                      <form action={deleteKeyword} className="inline"><input type="hidden" name="keywordId" value={k.id} /><ConfirmButton className="btn btn-ghost ml-1 !p-1.5 text-crit" message={`Stop tracking “${k.keyword}”?`}><Icon name="X" size={14} /></ConfirmButton></form>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
