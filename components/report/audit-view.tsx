import Link from "next/link";
import path from "node:path";
import { listFiles, readJson } from "@/lib/files";
import { CancelRunButton, LiveLog, PrintButton } from "@/components/client";
import { Card, ScoreRing, SevBadge, StatusPill, fileUrl, kb, scoreColor, sevBorder } from "@/components/ui";
import { FileLinks, FileView, MarkdownFile, RunShell, SideGroup, SideLink, href, type ViewProps } from "./shared";
import { AgentBoard } from "@/components/agent-board";
import { AGENTS } from "@/lib/agents-catalog";

interface Finding { title?: string; issue?: string; severity?: string; description?: string; evidence?: string; recommendation?: string }
interface Category { name: string; score?: number; what_works?: string[]; findings?: (Finding | string)[] }
interface Competitor { domain?: string; name?: string; why?: string; strengths?: string[]; we_lack?: string[] }
interface AuditData {
  summary?: { health_score?: number; business_type?: string; top_findings?: (Finding | string)[]; quick_wins?: string[] };
  categories?: Category[];
  competitors?: Competitor[];
  action_plan?: { phases?: { name?: string; timeframe?: string; items?: string[] }[] } | { name?: string; timeframe?: string; items?: string[] }[];
}

const AGENT_LABEL: Record<string, string> = {
  technical: "Technical SEO", content: "Content & E-E-A-T", schema: "Schema", sitemap: "Sitemap", performance: "Performance",
  visual: "Visual & mobile", geo: "AI search (GEO)", agentic: "Agent readiness", backlinks: "Backlinks", sxo: "Search experience",
  competitors: "Competitor gap analysis", ecommerce: "E-commerce", local: "Local SEO", maps: "Maps", google: "Google data", images: "Images",
};
const ftitle = (f: Finding | string) => (typeof f === "string" ? f : f.title || f.issue || "Finding");
const fsev = (f: Finding | string) => (typeof f === "string" ? undefined : f.severity);

export function AuditView({ run, dir, view, file }: ViewProps) {
  const id = run.id;
  const data = readJson<AuditData>(path.join(dir, "audit-data.json"));
  const files = listFiles(dir);
  const running = run.status === "running" || run.status === "queued";
  const url = (JSON.parse(run.input) as { url: string }).url;
  const host = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const top = files.filter((f) => !f.path.includes("/") && f.path.endsWith(".md"));
  const findings = files.filter((f) => f.path.startsWith("findings/"));
  const flowGroups = new Map<string, typeof files>();
  for (const f of files.filter((f) => f.path.startsWith("flows/"))) {
    const g = f.path.split("/")[1] || "flows";
    flowGroups.set(g, [...(flowGroups.get(g) ?? []), f]);
  }
  const shots = files.filter((f) => /^screenshots\/.*\.(png|jpe?g|webp)$/i.test(f.path));
  const exportsList = files.filter((f) => !f.path.includes("/") && /\.(pdf|html)$/i.test(f.path));
  const dataFiles = files.filter((f) => !f.path.includes("/") && /\.(json|txt|xml)$/i.test(f.path));
  const pdf = exportsList.find((f) => f.path.endsWith(".pdf"));
  const htmlReport = exportsList.find((f) => /report.*\.html$/i.test(f.path));
  const v = file ? "file" : view || (data || running ? "overview" : "log");
  const doneFiles = files.map((f) => f.path);
  const boardAgents = AGENTS.map(({ id, name, icon, phase, role, file, when }) => ({ id, name, icon, phase, role, file, when }));
  const phases = Array.isArray(data?.action_plan) ? data!.action_plan : (data?.action_plan as { phases?: [] } | undefined)?.phases ?? [];

  const side = (
    <>
      <div className="px-4 pb-2"><div className="truncate font-bold">{host}</div><div className="mt-1"><StatusPill status={run.status} /></div></div>
      <SideGroup title="Report">
        <SideLink to={href(id, { view: "overview" })} active={v === "overview"}>Overview</SideLink>
        <SideLink to={href(id, { view: "categories" })} active={v === "categories"}>Categories &amp; findings</SideLink>
        <SideLink to={href(id, { view: "competitors" })} active={v === "competitors"}>Competitors</SideLink>
        <SideLink to={href(id, { view: "plan" })} active={v === "plan"}>Action plan</SideLink>
        <SideLink to={href(id, { view: "shots" })} active={v === "shots"}>Screenshots ({shots.length})</SideLink>
        <SideLink to={href(id, { view: "team" })} active={v === "team"}>Agent team</SideLink>
        <SideLink to={href(id, { view: "log" })} active={v === "log"}>Live activity</SideLink>
      </SideGroup>
      {top.length > 0 && <SideGroup title="Documents"><FileLinks id={id} files={top} current={file} /></SideGroup>}
      {findings.length > 0 && <SideGroup title={`Agent findings (${findings.length})`}><FileLinks id={id} files={findings} current={file} strip="findings/" /></SideGroup>}
      {[...flowGroups.entries()].map(([g, fs]) => <SideGroup key={g} title={`Flow · ${g}`}><FileLinks id={id} files={fs} current={file} strip={`flows/${g}/`} /></SideGroup>)}
      {exportsList.length > 0 && <SideGroup title="Exports"><FileLinks id={id} files={exportsList} current={file} /></SideGroup>}
      {dataFiles.length > 0 && <SideGroup title="Data"><FileLinks id={id} files={dataFiles} current={file} /></SideGroup>}
    </>
  );

  return (
    <RunShell side={side}>
      {v === "file" && file && <Card><FileView id={id} dir={dir} rel={file} /></Card>}
      {v === "team" && <AgentBoard runId={id} running={running} agents={boardAgents} doneFiles={doneFiles} />}
      {v === "log" && (
        <Card title={<span className="flex items-center gap-3">Live activity {running && <CancelRunButton id={id} />}</span>}>
          {run.error && <div className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{run.error}</div>}
          <LiveLog id={id} running={running} />
        </Card>
      )}

      {v === "overview" && (
        <>
          <section className="panel flex flex-wrap items-center gap-6 p-6">
            <ScoreRing score={data?.summary?.health_score ?? run.score ?? null} size={130} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-600">AI deep audit · SEO health score</div>
              <h1 className="truncate text-2xl font-bold">{host}</h1>
              <div className="muted">{data?.summary?.business_type}</div>
              <div className="muted mt-2 flex flex-wrap gap-3 text-xs">
                {run.finishedAt && <span>Finished {run.finishedAt.toLocaleString()}</span>}
                <span>{findings.length} agent reports · {[...flowGroups.values()].flat().length} flow files · {shots.length} screenshots</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              {pdf && <a className="btn btn-primary" href={fileUrl(id, pdf.path, true)}>Download PDF</a>}
              {htmlReport && <a className="btn" href={fileUrl(id, htmlReport.path)} target="_blank" rel="noopener">HTML report</a>}
              {running ? <CancelRunButton id={id} /> : <PrintButton />}
            </div>
          </section>
          {running && <><AgentBoard runId={id} running agents={boardAgents} doneFiles={doneFiles} /><p className="muted text-[12.5px]">The report fills in as agents finish. You can close this page; we email you when it is ready. Raw activity is under Live activity.</p></>}
          {!data && !running && <Card><div className="muted">No audit-data.json in this run{run.error ? `: ${run.error}` : "."} Open the files on the left for whatever was produced.</div></Card>}
          {data && (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Top issues">
                <ul className="space-y-2">{(data.summary?.top_findings ?? []).map((f, i) => (
                  <li key={i} className={`panel2 rounded-lg border-l-4 px-3 py-2 text-sm ${sevBorder(fsev(f))}`}>{fsev(f) && <span className="mr-2"><SevBadge s={fsev(f)} /></span>}{ftitle(f)}</li>
                ))}</ul>
              </Card>
              <Card title="Quick wins"><ul className="list-disc space-y-1.5 pl-5 text-sm">{(data.summary?.quick_wins ?? []).map((w, i) => <li key={i}>{w}</li>)}</ul></Card>
            </div>
          )}
          {data?.categories && (
            <Card title="Category scores">
              <div className="space-y-2">{data.categories.map((c, i) => (
                <Link key={i} href={`${href(id, { view: "categories" })}#cat-${i}`} className="grid grid-cols-[minmax(120px,220px)_1fr_44px] items-center gap-3 text-sm hover:opacity-80">
                  <span className="truncate">{c.name}</span>
                  <span className="panel2 h-3 overflow-hidden rounded-full"><span className="block h-full rounded-full" style={{ width: `${c.score ?? 0}%`, background: scoreColor(c.score) }} /></span>
                  <b style={{ color: scoreColor(c.score) }}>{c.score ?? "–"}</b>
                </Link>
              ))}</div>
            </Card>
          )}
          {findings.length > 0 && (
            <Card title="Agent reports">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{findings.map((f) => {
                const key = f.path.replace(/^findings\//, "").replace(/\.md$/, "");
                return <Link key={f.path} href={href(id, { file: f.path })} className="panel2 rounded-xl border line p-3 hover:border-brand-500"><div className="font-semibold">{AGENT_LABEL[key] ?? key}</div><div className="muted text-xs">seo-{key} · {kb(f.size)}</div></Link>;
              })}</div>
            </Card>
          )}
          {flowGroups.size > 0 && (
            <Card title="Flows">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[...flowGroups.entries()].map(([g, fs]) => (
                <Link key={g} href={href(id, { file: (fs.find((x) => /\.(html|md)$/.test(x.path)) ?? fs[0]).path })} className="panel2 rounded-xl border line p-3 hover:border-brand-500">
                  <div className="font-semibold capitalize">{g.replace(/-/g, " ")}</div><div className="muted text-xs">{fs.length} file{fs.length === 1 ? "" : "s"}</div>
                </Link>
              ))}</div>
            </Card>
          )}
        </>
      )}

      {v === "categories" && ((data?.categories ?? []).length === 0 ? <Card><div className="muted">No categories yet.</div></Card> : data!.categories!.map((c, i) => (
        <section key={i} id={`cat-${i}`} className="panel scroll-mt-6 p-5">
          <div className="mb-3 flex items-center gap-4"><ScoreRing score={c.score ?? null} size={64} /><h2 className="text-lg font-bold">{c.name}</h2></div>
          {(c.what_works ?? []).length > 0 && <div className="mb-4"><h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-low">What works</h4><ul className="list-disc space-y-1 pl-5 text-sm">{c.what_works!.map((w, j) => <li key={j}>{w}</li>)}</ul></div>}
          <div className="space-y-2">{(c.findings ?? []).map((f, j) => (
            <div key={j} className={`panel2 rounded-lg border-l-4 px-4 py-3 ${sevBorder(fsev(f))}`}>
              <div className="font-semibold">{fsev(f) && <span className="mr-2"><SevBadge s={fsev(f)} /></span>}{ftitle(f)}</div>
              {typeof f !== "string" && (f.description || f.evidence) && <p className="mt-1 text-sm">{f.description || f.evidence}</p>}
              {typeof f !== "string" && f.recommendation && <p className="mt-1 text-sm text-low"><b>Fix:</b> {f.recommendation}</p>}
            </div>
          ))}</div>
        </section>
      )))}

      {v === "competitors" && (
        <>
          {(data?.competitors ?? []).length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">{data!.competitors!.map((c, i) => (
              <Card key={i} title={c.domain || c.name}>
                {c.why && <p className="muted mb-2 text-sm">{c.why}</p>}
                {(c.strengths ?? []).length > 0 && <><h4 className="text-xs font-bold uppercase">Strengths</h4><ul className="mb-2 list-disc pl-5 text-sm">{c.strengths!.map((s, j) => <li key={j}>{s}</li>)}</ul></>}
                {(c.we_lack ?? []).length > 0 && <><h4 className="text-xs font-bold uppercase text-crit">We lack</h4><ul className="list-disc pl-5 text-sm">{c.we_lack!.map((s, j) => <li key={j}>{s}</li>)}</ul></>}
              </Card>
            ))}</div>
          )}
          <Card title="Competitor gap analysis"><MarkdownFile dir={dir} rel="findings/competitors.md" fallback={<div className="muted">findings/competitors.md is not there yet.</div>} /></Card>
        </>
      )}

      {v === "plan" && (
        <>
          {phases.length > 0 && (
            <Card title="Action plan">
              <div className="grid gap-3 md:grid-cols-2">{phases.map((p, i) => (
                <div key={i} className="panel2 rounded-xl border line p-4">
                  <div className="font-bold">{p.name} <span className="muted text-xs font-normal">{p.timeframe}</span></div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{(p.items ?? []).map((it, j) => <li key={j}>{String(it)}</li>)}</ul>
                </div>
              ))}</div>
            </Card>
          )}
          <Card title="ACTION-PLAN.md"><MarkdownFile dir={dir} rel="ACTION-PLAN.md" fallback={<div className="muted">ACTION-PLAN.md is not there yet.</div>} /></Card>
        </>
      )}

      {v === "shots" && (
        <Card title={`Screenshots (${shots.length})`}>
          {shots.length === 0 ? <div className="muted">No screenshots.</div> : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{shots.map((s) => (
              <a key={s.path} href={fileUrl(id, s.path)} target="_blank" rel="noopener" className="panel2 overflow-hidden rounded-xl border line">
                <img src={fileUrl(id, s.path)} alt={s.path} loading="lazy" className="h-52 w-full object-cover object-top" />
                <div className="muted p-2 text-xs">{s.path.replace(/^screenshots\//, "")}</div>
              </a>
            ))}</div>
          )}
        </Card>
      )}
    </RunShell>
  );
}
