import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, parseJson, schema } from "@/lib/db";
import { hunks, lineDiff } from "@/lib/diff";
import { ActionForm, CancelRunButton, LiveLog, SubmitButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { Card, SevBadge, StatusPill } from "@/components/ui";
import { applyFixChanges, undoFix } from "@/app/(app)/app/connect-actions";
import { Markdown, type ViewProps } from "./shared";
import { LocalApplyButton, LocalUndoButton } from "@/components/local-folder";

const STATUS_STYLE: Record<string, string> = {
  proposed: "muted", applied: "text-low", failed: "text-crit", reverted: "muted line-through", skipped: "muted",
};

export async function FixView({ run, dir }: ViewProps) {
  const running = run.status === "running" || run.status === "queued";
  const changes = await db().select().from(schema.fixChanges).where(eq(schema.fixChanges.runId, run.id));
  const input = parseJson<{ connectorId: number }>(run.input, { connectorId: 0 });
  const [conn] = await db().select().from(schema.connectors).where(eq(schema.connectors.id, input.connectorId)).limit(1);
  const summary = parseJson<{ pr_url?: string }>(run.summary, {});
  const isCode = changes.some((c) => c.resourceType === "file") || conn?.kind === "github" || conn?.kind === "folder" || conn?.kind === "local";
  const pending = changes.filter((c) => ["proposed", "failed", "reverted"].includes(c.status));
  const fixSummary = fs.existsSync(path.join(dir, "FIX-SUMMARY.md")) ? fs.readFileSync(path.join(dir, "FIX-SUMMARY.md"), "utf8") : null;
  const applyLabel = conn?.kind === "github" ? "Create pull request" : conn?.kind === "folder" ? "Apply to folder (with backup)" : "Apply selected changes";

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center gap-5">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border line bg-[var(--panel)] text-brand-500"><Icon name="WandSparkles" size={24} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-brand-500">AI auto-fix</div>
          <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">{run.title}</h1>
          <div className="muted mt-1 flex flex-wrap items-center gap-3 text-[13px]"><StatusPill status={run.status} /><span>{changes.length} proposed · {changes.filter((c) => c.status === "applied").length} applied</span>{conn && <span>via {conn.name}</span>}</div>
        </div>
        {running && <CancelRunButton id={run.id} />}
      </section>

      {summary.pr_url && (
        <a href={summary.pr_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-low/30 bg-low/10 px-4 py-3 text-[14px]">
          <Icon name="GitPullRequest" size={17} className="text-low" />Pull request opened. Review and merge it on GitHub.<Icon name="ArrowUpRight" size={14} className="ml-auto" />
        </a>
      )}

      {(running || changes.length === 0) && <Card title={running ? "Working" : "Activity"}><LiveLog id={run.id} running={running} compact={running} />{run.error && <p className="mt-3 text-[13px] text-crit">{run.error}</p>}</Card>}

      {fixSummary && <Card title="What the agent changed"><Markdown src={fixSummary} /></Card>}

      {changes.length > 0 && (
        <ActionForm action={applyFixChanges} className="space-y-3">
          <input type="hidden" name="runId" value={run.id} />
          <div className="panel sticky top-16 z-20 flex flex-wrap items-center gap-3 px-4 py-3 backdrop-blur-xl lg:top-3">
            <span className="text-[14px] font-medium">{pending.length} change{pending.length === 1 ? "" : "s"} waiting for review</span>
            <span className="muted text-[12.5px]">Tick the ones you want, then apply.</span>
            <div className="ml-auto">{pending.length > 0 && (conn?.kind === "local"
              ? <LocalApplyButton runId={run.id} connectorId={conn.id} folderName={parseJson<{ folderName?: string }>(conn.config, {}).folderName ?? "your folder"} />
              : <SubmitButton className="btn btn-brand" pendingText="Applying…"><Icon name={conn?.kind === "github" ? "GitPullRequest" : "Check"} size={15} />{applyLabel}</SubmitButton>)}</div>
          </div>

          {changes.map((c) => {
            const selectable = ["proposed", "failed", "reverted"].includes(c.status);
            const diff = isCode && c.oldValue != null && c.newValue != null ? lineDiff(c.oldValue, c.newValue) : null;
            return (
              <div key={c.id} className="panel overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  {selectable ? <input type="checkbox" name="change" value={c.id} defaultChecked={c.status === "proposed"} className="h-4 w-4 accent-[#1f86ff]" aria-label={`Select change ${c.id}`} /> : <Icon name={c.status === "applied" ? "CircleCheck" : "Undo2"} size={16} className={STATUS_STYLE[c.status]} />}
                  {!isCode && <SevBadge s={c.severity} />}
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{isCode ? c.resourceId : <>{c.resourceLabel} <span className="muted">· {c.field.replace(/_/g, " ")}</span></>}</span>
                  {isCode && <span className="chip !py-0.5">{c.field}</span>}
                  <span className={`text-[12.5px] font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                </div>
                {c.reason && <p className="muted border-t line px-4 py-2.5 text-[13px]">{c.reason}</p>}
                {c.error && <p className="border-t line px-4 py-2 text-[13px] text-crit">{c.error}</p>}
                {!isCode ? (
                  <div className="grid border-t line font-mono text-[13px] md:grid-cols-2">
                    <div className="bg-crit/5 px-4 py-3"><div className="muted mb-1 font-sans text-[11px] uppercase tracking-wider">Now</div>{c.oldValue || <span className="muted italic">empty</span>}</div>
                    <div className="border-t line bg-low/5 px-4 py-3 md:border-l md:border-t-0"><div className="muted mb-1 font-sans text-[11px] uppercase tracking-wider">Proposed</div>{c.newValue}</div>
                  </div>
                ) : diff ? (
                  <details className="border-t line" open={changes.length <= 6}>
                    <summary className="muted cursor-pointer px-4 py-2 text-[12.5px]">Show diff · <span className="text-low">+{diff.filter((d) => d.t === "+").length}</span> <span className="text-crit">−{diff.filter((d) => d.t === "-").length}</span></summary>
                    <pre className="max-h-[460px] overflow-auto border-t line font-mono text-[12px] leading-[1.55]">
                      {hunks(diff).map((d, i) => d == null
                        ? <div key={i} className="muted bg-[var(--panel2)] px-4">⋯</div>
                        : <div key={i} className={`px-4 ${d.t === "+" ? "bg-low/10 text-low" : d.t === "-" ? "bg-crit/10 text-crit" : "muted"}`}><span className="mr-3 inline-block w-3 select-none">{d.t}</span>{d.s}</div>)}
                    </pre>
                  </details>
                ) : (
                  <p className="muted border-t line px-4 py-2.5 text-[12.5px]">{c.field === "deleted" ? "File deleted." : c.field === "added" ? `New file · ${(c.newValue ?? "").split("\n").length} lines` : "File is too large to show a diff."}</p>
                )}
                {c.status === "applied" && (!isCode || conn?.kind === "folder" || conn?.kind === "local") && (
                  <div className="border-t line px-4 py-2">
                    {conn?.kind === "local" ? <LocalUndoButton runId={run.id} connectorId={conn.id} changeId={c.id} /> : <button formAction={undoFix.bind(null, c.id, run.id)} className="btn !py-1 text-[12.5px]"><Icon name="Undo2" size={13} />Undo</button>}
                  </div>
                )}
              </div>
            );
          })}
        </ActionForm>
      )}
    </div>
  );
}
