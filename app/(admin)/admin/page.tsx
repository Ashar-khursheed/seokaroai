import Link from "next/link";
import { and, count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getPlan, PLANS } from "@/lib/plans";
import { monthStart } from "@/lib/usage";
import { integrations } from "@/lib/integrations";
import { billingConfigured } from "@/lib/billing/paddle";
import { rankTrackingAvailable } from "@/lib/engine/ranks";
import { workerInfo } from "@/lib/worker";
import { Card, KIND_LABEL, StatusPill, timeAgo } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { runAutomationsNow } from "./actions";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  const since = monthStart();
  const d = db();
  const [[users], [verified], [newUsers], paid, runsByKind, [aiCost], [rankCost], [unread], recent, failing] = await Promise.all([
    d.select({ n: count() }).from(schema.users),
    d.select({ n: count() }).from(schema.users).where(sql`${schema.users.emailVerifiedAt} is not null`),
    d.select({ n: count() }).from(schema.users).where(gte(schema.users.createdAt, since)),
    d.select({ plan: schema.users.plan, cycle: schema.users.billingCycle, n: count() }).from(schema.users)
      .where(sql`${schema.users.plan} <> 'free' and ${schema.users.planStatus} in ('active','trialing','past_due')`).groupBy(schema.users.plan, schema.users.billingCycle),
    d.select({ kind: schema.runs.kind, status: schema.runs.status, n: count() }).from(schema.runs).where(gte(schema.runs.createdAt, since)).groupBy(schema.runs.kind, schema.runs.status),
    d.select({ v: sum(schema.runs.costUsd) }).from(schema.runs).where(gte(schema.runs.createdAt, since)),
    d.select({ v: sum(schema.rankChecks.costUsd), n: count() }).from(schema.rankChecks).where(gte(schema.rankChecks.checkedAt, since)),
    d.select({ n: count() }).from(schema.contactMessages).where(isNull(schema.contactMessages.handledAt)),
    d.select().from(schema.users).orderBy(desc(schema.users.createdAt)).limit(8),
    d.select().from(schema.runs).where(and(eq(schema.runs.status, "failed"), gte(schema.runs.createdAt, since))).orderBy(desc(schema.runs.createdAt)).limit(8),
  ]);
  const mrr = paid.reduce((a, p) => a + Number(p.n) * (p.cycle === "yearly" ? getPlan(p.plan).priceYearly / 12 : getPlan(p.plan).priceMonthly), 0);
  const paidCount = paid.reduce((a, p) => a + Number(p.n), 0);
  const cost = Number(aiCost.v ?? 0) + Number(rankCost.v ?? 0);
  const kinds = ["quick", "deep", "keyword"].map((k) => ({
    k, done: runsByKind.filter((r) => r.kind === k && r.status === "done").reduce((a, r) => a + Number(r.n), 0),
    failed: runsByKind.filter((r) => r.kind === k && r.status === "failed").reduce((a, r) => a + Number(r.n), 0),
  }));
  const w = workerInfo();
  const integ = await integrations();
  const checks: [string, boolean, string][] = [
    ["AI: Claude", !!integ.ai.anthropicKey, "Deep audits, keyword battles, auto-fix"],
    ["AI: OpenAI", !!integ.ai.openaiKey, "Optional alternative, choose in Settings"],
    ["Payments (Paddle)", await billingConfigured(), "Keys, prices and webhook in Integrations"],
    ["Rank tracking (DataForSEO)", await rankTrackingAvailable(), "Live Google results and daily positions"],
    ["Email (SMTP)", !!integ.smtp.host, "Without SMTP, emails go to data/outbox"],
    ["PageSpeed (Google API key)", !!integ.google.apiKey, "Performance scores in site audits"],
    ["Background worker", w.enabled, `Worker ${w.id} · ${w.running.length} running`],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Overview · {since.toLocaleString("en-US", { month: "long", year: "numeric" })}</h1>
        <form action={runAutomationsNow}><SubmitButton className="btn" pendingText="Running…">Run automations now</SubmitButton></form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="MRR (estimate)" value={`$${mrr.toFixed(0)}`} sub={`${paidCount} paying customers`} />
        <Kpi label="AI + data cost this month" value={`$${cost.toFixed(2)}`} sub={`${Number(rankCost.n)} rank checks`} />
        <Kpi label="Gross margin (estimate)" value={mrr ? `${Math.round(((mrr - cost) / mrr) * 100)}%` : "–"} sub="MRR minus AI and data cost" />
        <Kpi label="Users" value={String(users.n)} sub={`${verified.n} confirmed · ${newUsers.n} new this month`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Runs this month">
          <table className="w-full text-sm"><tbody>{kinds.map((k) => (
            <tr key={k.k} className="border-b line last:border-0"><td className="py-2">{KIND_LABEL[k.k]}</td><td className="text-right">{k.done} done</td><td className="text-right text-rose-600">{k.failed} failed</td></tr>
          ))}</tbody></table>
        </Card>
        <Card title="Plans">
          <table className="w-full text-sm"><tbody>{Object.values(PLANS).filter((p) => p.code !== "free").map((p) => {
            const n = paid.filter((x) => x.plan === p.code).reduce((a, x) => a + Number(x.n), 0);
            return <tr key={p.code} className="border-b line last:border-0"><td className="py-2">{p.name}</td><td className="text-right">{n} customers</td></tr>;
          })}</tbody></table>
          <Link href="/admin/messages" className="mt-3 inline-block text-sm text-brand-500">{unread.n} unread messages →</Link>
        </Card>
        <Card title="Setup checklist">
          <ul className="space-y-2 text-sm">{checks.map(([l, ok, hint]) => (
            <li key={l} className="flex gap-2"><span className={ok ? "text-emerald-600" : "text-rose-600"}>{ok ? "✓" : "✗"}</span><span><b>{l}</b><br /><span className="muted text-xs">{hint}</span></span></li>
          ))}</ul>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Newest users">
          <table className="w-full text-sm"><tbody>{recent.map((u) => (
            <tr key={u.id} className="border-b line last:border-0"><td className="py-2">{u.email}<div className="muted text-xs">{u.name}</div></td><td>{getPlan(u.plan).name}</td><td className="muted text-right text-xs">{timeAgo(u.createdAt)}</td></tr>
          ))}</tbody></table>
        </Card>
        <Card title="Recent failures">
          {failing.length === 0 ? <p className="muted text-sm">No failed runs this month.</p> : (
            <table className="w-full text-sm"><tbody>{failing.map((r) => (
              <tr key={r.id} className="border-b line align-top last:border-0"><td className="py-2"><Link href={`/app/runs/${encodeURIComponent(r.id)}`} className="hover:text-brand-500">{r.title}</Link><div className="text-xs text-rose-600">{r.error?.slice(0, 140)}</div></td><td><StatusPill status={r.status} /></td></tr>
            ))}</tbody></table>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="panel p-5"><div className="muted text-xs font-bold uppercase tracking-wider">{label}</div><div className="mt-1 text-3xl font-semibold tracking-[-0.02em]">{value}</div><div className="muted mt-1 text-xs">{sub}</div></div>;
}
