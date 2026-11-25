import Link from "next/link";
import { and, avg, count, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { monthStart } from "@/lib/usage";
import { getAiSettings, providerReady } from "@/lib/ai/settings";
import { AGENTS, PHASES } from "@/lib/agents-catalog";
import { Reveal, Spotlight } from "@/components/motion";
import { Icon } from "@/components/icons";
import { Card, PageHeader, StatusPill, timeAgo } from "@/components/ui";

export const metadata = { title: "Agents" };

export default async function AgentsPage() {
  const since = monthStart();
  const [ai, [stats], [okCount], recent] = await Promise.all([
    getAiSettings(),
    db().select({ n: count(), cost: avg(schema.runs.costUsd) }).from(schema.runs).where(and(eq(schema.runs.kind, "deep"), gte(schema.runs.createdAt, since))),
    db().select({ n: count() }).from(schema.runs).where(and(eq(schema.runs.kind, "deep"), eq(schema.runs.status, "done"), gte(schema.runs.createdAt, since))),
    db().select().from(schema.runs).where(eq(schema.runs.kind, "deep")).orderBy(desc(schema.runs.createdAt)).limit(6),
  ]);
  const ready = await providerReady(ai.provider);
  const total = Number(stats.n);

  return (
    <div className="space-y-8">
      <PageHeader title="AI agent team" subtitle="Who does what in an AI deep audit. Specialists run in parallel; strategy and report steps follow." />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border line bg-[var(--line)] min-[400px]:grid-cols-2 md:grid-cols-4">
        {[
          ["Provider", ai.provider === "openai" ? `OpenAI · ${ai.openaiModel}` : `Claude · ${ai.claudeModel}`, ready ? "Key set" : "Key missing"],
          ["Agents", String(AGENTS.length), `${AGENTS.filter((a) => a.phase === "Specialists").length} specialists in parallel`],
          ["Deep audits this month", String(total), `${okCount.n} finished`],
          ["Average AI cost", stats.cost != null ? `$${Number(stats.cost).toFixed(2)}` : "–", "per deep audit"],
        ].map(([l, v, sub]) => (
          <div key={l} className="min-w-0 bg-[var(--panel)] p-4 sm:p-5">
            <div className="muted text-[12.5px]">{l}</div>
            <div className="mt-1.5 truncate text-xl font-semibold tracking-tight">{v}</div>
            <div className={`mt-1 text-[12px] ${l === "Provider" && !ready ? "text-crit" : "muted"}`}>{sub}</div>
          </div>
        ))}
      </div>
      {ai.provider === "openai" && <p className="muted text-[13px]">On OpenAI there are no parallel sub-agents: one agent does each specialist's work in turn, writing the same report files.</p>}

      {PHASES.map((ph, pi) => (
        <section key={ph}>
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="grid h-6 w-6 place-items-center rounded-full border line font-mono text-[11px]">{pi + 1}</span>
            <h2 className="font-semibold">{ph}</h2>
            <span className="muted text-[12.5px]">{ph === "Plan" ? "Understand the site" : ph === "Specialists" ? "Audit every layer at the same time" : ph === "Strategy" ? "Competitors, clusters and content" : "Score, prioritise, plan"}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {AGENTS.filter((a) => a.phase === ph).map((a, i) => (
              <Reveal key={a.id} delay={i * 40}>
                <Spotlight className="panel card-hover h-full p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border line bg-[var(--panel2)] text-brand-500"><Icon name={a.icon} size={18} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{a.name}</span>{a.when && <span className="chip !py-0 text-[11px]">only for {a.when}</span>}</div>
                      <div className="muted break-all font-mono text-[11.5px]">{a.id}</div>
                    </div>
                  </div>
                  <p className="muted mt-3 text-[13.5px] leading-relaxed">{a.role}</p>
                  <ul className="mt-3 space-y-1.5 text-[13px]">{a.checks.map((c) => <li key={c} className="flex gap-2"><Icon name="Check" size={14} className="mt-0.5 shrink-0 text-low" />{c}</li>)}</ul>
                  <div className="muted mt-4 flex items-center gap-1.5 border-t line pt-3 font-mono text-[11.5px] break-all"><Icon name="FileText" size={12} />{a.file}</div>
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      <Card title="Latest deep audits" action={<Link href="/admin/runs" className="muted text-[12.5px] hover:text-[var(--ink)]">All runs</Link>}>
        {recent.length === 0 ? <p className="muted text-[14px]">No deep audits yet.</p> : (
          <div className="-mx-2">{recent.map((r) => (
            <Link key={r.id} href={`/app/runs/${encodeURIComponent(r.id)}?view=team`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-2 py-2.5 hover:bg-[var(--panel2)] sm:flex-nowrap">
              <Icon name="BrainCircuit" size={16} className="shrink-0 text-brand-500" />
              <span className="min-w-0 flex-1 truncate text-[14px]">{r.title}</span>
              <span className="muted text-[12px]">{timeAgo(r.createdAt)}</span>
              {r.costUsd != null && <span className="muted text-[12px]">${Number(r.costUsd).toFixed(2)}</span>}
              <StatusPill status={r.status} />
            </Link>
          ))}</div>
        )}
      </Card>
    </div>
  );
}
