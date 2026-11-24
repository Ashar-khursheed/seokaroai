import Link from "next/link";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, parseJson, schema } from "@/lib/db";
import { effectivePlan } from "@/lib/plans";
import { aiAllowance, fmtReset, monthlyUsage } from "@/lib/usage";
import { rankBuckets, recentRuns, userProjects } from "@/lib/queries";
import { rankTrackingAvailable } from "@/lib/engine/ranks";
import { AutoRefresh } from "@/components/client";
import { Reveal } from "@/components/motion";
import { Icon } from "@/components/icons";
import { AllowanceMeter, Card, Delta, KIND_ICON, KIND_LABEL, Meter, PageHeader, Position, ScoreRing, StatusPill, timeAgo } from "@/components/ui";

export const metadata = { title: "Overview" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const plan = effectivePlan(user);
  const [projects, usage, runs, allowance] = await Promise.all([userProjects(user.id), monthlyUsage(user.id), recentRuns({ userId: user.id, limit: 8 }), aiAllowance(user)]);
  const isAdmin = user.role === "admin";
  const ids = projects.map((p) => p.id);
  const kws = ids.length ? await db().select().from(schema.keywords).where(inArray(schema.keywords.projectId, ids)) : [];
  const movers = kws
    .filter((k) => k.lastCheckedAt && k.position !== k.previousPosition && (k.previousPosition != null || k.position != null))
    .sort((a, b) => Math.abs((b.previousPosition ?? 101) - (b.position ?? 101)) - Math.abs((a.previousPosition ?? 101) - (a.position ?? 101)))
    .slice(0, 8);
  const battles = await db().select().from(schema.runs)
    .where(and(eq(schema.runs.userId, user.id), eq(schema.runs.kind, "keyword"), isNotNull(schema.runs.finishedAt)))
    .orderBy(desc(schema.runs.createdAt)).limit(3);
  const running = runs.some((r) => r.status === "running" || r.status === "queued");
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const totals = rankBuckets(kws);
  const first = user.name ? user.name.split(" ")[0] : "";

  return (
    <div className="space-y-8">
      <AutoRefresh active={running} ms={10000} />
      {sp.verified === "1" && <Notice tone="ok">Email confirmed. You are all set.</Notice>}
      {!isAdmin && allowance.pct >= 80 && (
        <Notice tone="warn">
          {allowance.pct >= 100
            ? `This month's AI allowance is used up. AI audits, keyword battles, auto-fixes and rank checks pause until ${fmtReset(allowance.resetsAt)}; site audits keep working.`
            : `You have used ${allowance.pct}% of this month's AI allowance. It resets on ${fmtReset(allowance.resetsAt)}.`}
          {plan.code !== "agency" && <> <Link href="/app/billing" className="font-medium underline">See plans</Link></>}
        </Notice>
      )}
      {sp.verified === "invalid" && <Notice tone="warn">That confirmation link is invalid or expired. Use “Resend email” above.</Notice>}

      <PageHeader
        title={sp.welcome ? `Welcome${first ? `, ${first}` : ""}` : `Good to see you${first ? `, ${first}` : ""}`}
        subtitle={<>{plan.name} plan · usage resets on the 1st</>}
        actions={<>
          <Link href="/app/battles/new" className="btn"><Icon name="Swords" size={15} />Keyword battle</Link>
          <Link href="/app/projects/new" className="btn btn-primary"><Icon name="Plus" size={15} />Add website</Link>
        </>}
      />

      {projects.length > 0 && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border line bg-[var(--line)] md:grid-cols-4">
          {[["Websites", projects.length, "Globe"], ["Keywords in top 10", totals.top10, "TrendingUp"], ["Tracked keywords", totals.total, "Target"], ["Reports this month", usage.quick + usage.deep + usage.keyword + usage.fix, "FileText"]].map(([l, v, ic]) => (
            <div key={l as string} className="bg-[var(--panel)] p-5">
              <div className="muted flex items-center gap-2 text-[12.5px]"><Icon name={ic as string} size={14} />{l}</div>
              <div className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">{v}</div>
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <section className="panel relative overflow-hidden">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="relative grid place-items-center px-6 py-20 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border line bg-[var(--panel2)] text-brand-500"><Icon name="Globe" size={22} /></span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight">Add your first website</h2>
            <p className="muted mt-2 max-w-md text-[15px]">We run a site audit straight away and start tracking the keywords you add. Connect WordPress, Shopify or GitHub later to ship fixes.</p>
            <Link href="/app/projects/new" className="btn btn-brand mt-6"><Icon name="Plus" size={15} />Add website</Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => {
            const b = rankBuckets(kws.filter((k) => k.projectId === p.id));
            return (
              <Reveal key={p.id} delay={i * 50}>
                <Link href={`/app/projects/${p.id}`} className="panel card-hover flex h-full gap-5 p-5">
                  <ScoreRing score={p.lastScore} size={78} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="muted truncate text-[13px]">{p.domain} · {p.country}</div>
                    <div className="mt-3 flex gap-4 text-[12.5px]">
                      <span><b className="tabular-nums">{b.top3}</b> <span className="muted">top 3</span></span>
                      <span><b className="tabular-nums">{b.top10}</b> <span className="muted">top 10</span></span>
                      <span><b className="tabular-nums">{b.total}</b> <span className="muted">tracked</span></span>
                    </div>
                    <div className="muted mt-2 text-[12px]">Audited {timeAgo(p.lastAuditAt)}</div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Recent reports" className="xl:col-span-2" action={<Link href="/app/runs" className="muted text-[12.5px] hover:text-[var(--ink)]">View all</Link>}>
          {runs.length === 0 ? <p className="muted text-[14px]">No reports yet.</p> : (
            <div className="-mx-2">
              {runs.map((r) => {
                const s = parseJson<{ top_issues?: { title: string }[] }>(r.summary, {});
                return (
                  <Link key={r.id} href={`/app/runs/${encodeURIComponent(r.id)}`} className="flex items-center gap-3.5 rounded-xl px-2 py-2.5 transition hover:bg-[var(--panel2)]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border line text-brand-500"><Icon name={KIND_ICON[r.kind] ?? "FileText"} size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">{r.title}</div>
                      <div className="muted truncate text-[12.5px]">{KIND_LABEL[r.kind]} · {timeAgo(r.createdAt)}{s.top_issues?.[0] ? ` · ${s.top_issues[0].title}` : ""}</div>
                    </div>
                    {r.score != null && <span className="text-[15px] font-semibold tabular-nums">{r.score}</span>}
                    <StatusPill status={r.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
        <Card title="Usage this month" action={plan.code !== "agency" ? <Link href="/app/billing" className="text-[12.5px] font-medium text-brand-500">Upgrade</Link> : undefined}>
          <div className="space-y-4">
            {!isAdmin && <AllowanceMeter pct={allowance.pct} resets={fmtReset(allowance.resetsAt)} note={false} />}
            <Meter label="Websites" used={usage.projects} limit={plan.limits.projects} />
            <Meter label="Site audits" used={usage.quick} limit={plan.limits.quickAudits} />
            <Meter label="AI deep audits" used={usage.deep} limit={plan.limits.deepAudits} />
            <Meter label="Keyword battles" used={usage.keyword} limit={plan.limits.battles} />
            <Meter label="AI auto-fixes" used={usage.fix} limit={plan.limits.fixes} />
            <Meter label="Tracked keywords" used={usage.keywords} limit={plan.limits.keywords} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Biggest ranking moves">
          {!(await rankTrackingAvailable()) && <p className="muted mb-3 text-[12.5px]">Live rank tracking is not switched on for this server yet.</p>}
          {movers.length === 0 ? <p className="muted text-[14px]">Moves appear after the second check of a keyword.</p> : (
            <table className="w-full text-[14px]"><tbody>{movers.map((k) => (
              <tr key={k.id} className="border-b line last:border-0">
                <td className="py-2.5"><Link href={`/app/projects/${k.projectId}?tab=rankings`} className="font-medium hover:text-brand-500">{k.keyword}</Link><div className="muted text-[12px]">{projectName.get(k.projectId)}</div></td>
                <td className="py-2 text-right"><Position value={k.position} /></td>
                <td className="w-14 py-2 text-right"><Delta from={k.previousPosition} to={k.position} /></td>
              </tr>
            ))}</tbody></table>
          )}
        </Card>
        <Card title="Latest keyword battles" action={<Link href="/app/battles/new" className="text-[12.5px] font-medium text-brand-500">New battle</Link>}>
          {battles.length === 0 ? <p className="muted text-[14px]">See exactly what the top 3 results do that your page does not.</p> : battles.map((r) => (
            <Link key={r.id} href={`/app/runs/${encodeURIComponent(r.id)}`} className="flex items-center gap-3 border-b line py-2.5 last:border-0 hover:opacity-80">
              <Icon name="Swords" size={15} className="text-brand-500" /><span className="flex-1 truncate text-[14px]">{r.title}</span>
              {r.score != null && <b className="tabular-nums">{r.score}</b>}<StatusPill status={r.status} />
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) {
  return <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px] ${tone === "ok" ? "border-low/30 bg-low/10" : "border-high/30 bg-high/10"}`}><Icon name={tone === "ok" ? "CircleCheck" : "TriangleAlert"} size={16} className={tone === "ok" ? "text-low" : "text-high"} />{children}</div>;
}
