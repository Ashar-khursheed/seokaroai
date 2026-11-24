import os from "node:os";
import { and, asc, eq, inArray, isNotNull, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { config } from "@/lib/config";
import { createRun, executeRun } from "@/lib/runs";
import { checkRank, rankTrackingAvailable } from "@/lib/engine/ranks";
import { effectivePlan } from "@/lib/plans";
import { aiAllowance, runBlocked } from "@/lib/usage";
import { budgetAlerts } from "@/lib/budget-alerts";
import { sendMail } from "@/lib/email";
import { rankAlertEmail, weeklyDigestEmail, type DigestProject, type RankMove } from "@/lib/email/templates";

/**
 * Background worker, started once per server process from instrumentation.ts.
 *  - every 5 s: claim queued runs (atomic UPDATE) within the concurrency limits and execute them
 *  - every 2 min: automations (scheduled audits, rank checks + alerts, Monday digest)
 * Set WORKER_ENABLED=0 on extra web instances so only one process runs automations.
 */

const WORKER_ID = `${os.hostname()}-${process.pid}`;
const g = globalThis as unknown as { __skWorker?: { running: Set<string>; busyAuto: boolean } };

const AGENT_KINDS = ["deep", "keyword", "fix"];
const DAY = 864e5;

export function startWorker() {
  if (g.__skWorker || !config.workerEnabled || !process.env.DATABASE_URL) return;
  g.__skWorker = { running: new Set(), busyAuto: false };
  console.log(`[worker] started ${WORKER_ID}`);
  void recoverStale().then(() => {
    setInterval(() => void claimLoop().catch((e) => console.error("[worker] claim", e)), 5000);
    setInterval(() => void automations().catch((e) => console.error("[worker] automations", e)), 120_000);
    setTimeout(() => void automations().catch((e) => console.error("[worker] automations", e)), 15_000);
  }).catch((e) => console.error("[worker] recover", e));
}

/** Runs left 'running' by a dead process (no heartbeat for 3 minutes) are marked failed. */
async function recoverStale() {
  const cutoff = new Date(Date.now() - 3 * 60_000);
  await db().update(schema.runs).set({ status: "failed", error: "The server restarted while this run was in progress. It did not count against your allowance.", finishedAt: new Date() })
    .where(and(eq(schema.runs.status, "running"), or(isNull(schema.runs.heartbeatAt), lt(schema.runs.heartbeatAt, cutoff))));
}

async function claimLoop() {
  const st = g.__skWorker!;
  const running = [...st.running];
  const agentRunning = (await countRunningKinds(running)).agent;
  const quickRunning = running.length - agentRunning;
  const slots: { kinds: string[]; free: number }[] = [
    { kinds: AGENT_KINDS, free: config.maxAgentRuns - agentRunning },
    { kinds: ["quick"], free: config.maxQuickRuns - quickRunning },
  ];
  for (const s of slots) {
    if (s.free <= 0) continue;
    const queued = await db().select().from(schema.runs)
      .where(and(eq(schema.runs.status, "queued"), inArray(schema.runs.kind, s.kinds)))
      .orderBy(asc(schema.runs.createdAt)).limit(s.free);
    for (const r of queued) {
      const res = await db().update(schema.runs).set({ status: "running", worker: WORKER_ID, startedAt: new Date(), heartbeatAt: new Date() })
        .where(and(eq(schema.runs.id, r.id), eq(schema.runs.status, "queued")));
      if ((res[0] as { affectedRows?: number }).affectedRows !== 1) continue;
      st.running.add(r.id);
      void executeRun({ ...r, status: "running" }, WORKER_ID).finally(() => st.running.delete(r.id));
    }
  }
}

const kindCache = new Map<string, string>();
async function countRunningKinds(ids: string[]) {
  let agent = 0;
  for (const id of ids) {
    if (!kindCache.has(id)) {
      const [r] = await db().select({ kind: schema.runs.kind }).from(schema.runs).where(eq(schema.runs.id, id)).limit(1);
      kindCache.set(id, r?.kind ?? "quick");
    }
    if (AGENT_KINDS.includes(kindCache.get(id)!)) agent++;
  }
  return { agent };
}

async function automations() {
  const st = g.__skWorker!;
  if (st.busyAuto) return;
  st.busyAuto = true;
  try {
    await scheduledAudits();
    await rankChecks();
    await weeklyDigest();
  } finally {
    st.busyAuto = false;
  }
}

// ------------------------------------------------------------------ scheduled audits
async function scheduledAudits() {
  const now = new Date();
  const due = await db().select({ p: schema.projects, u: schema.users }).from(schema.projects)
    .innerJoin(schema.users, eq(schema.users.id, schema.projects.userId))
    .where(and(ne(schema.projects.autoAudit, "off"), isNotNull(schema.projects.nextAuditAt), lte(schema.projects.nextAuditAt, now), isNull(schema.users.suspendedAt)))
    .limit(20);
  for (const { p, u } of due) {
    const plan = effectivePlan(u);
    const every = (plan.autoAudits.includes(p.autoAudit as never) ? p.autoAudit : "monthly") === "weekly" ? 7 : 30;
    const blocked = await runBlocked(u, "quick");
    if (blocked) {
      await db().update(schema.projects).set({ nextAuditAt: new Date(Date.now() + DAY) }).where(eq(schema.projects.id, p.id));
      continue;
    }
    await createRun({
      userId: u.id, projectId: p.id, kind: "quick", trigger: "schedule", title: `${p.name} · scheduled audit`,
      input: { url: p.url, competitors: [], flows: [], model: "", budgetUsd: 0, maxPages: plan.limits.pagesPerAudit },
    });
    await db().update(schema.projects).set({ nextAuditAt: new Date(Date.now() + every * DAY) }).where(eq(schema.projects.id, p.id));
  }
}

// ------------------------------------------------------------------ rank tracking
const bigMove = (from: number | null, to: number | null) => {
  if (from === to) return false;
  if (from == null || to == null) return (from ?? to ?? 101) <= 10;
  return Math.abs(from - to) >= 3 || (from <= 10) !== (to <= 10);
};

async function rankChecks() {
  if (!(await rankTrackingAvailable())) return;
  const now = new Date();
  const due = await db().select({ k: schema.keywords, p: schema.projects, u: schema.users }).from(schema.keywords)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.keywords.projectId))
    .innerJoin(schema.users, eq(schema.users.id, schema.keywords.userId))
    .where(and(ne(schema.projects.rankFrequency, "off"), or(isNull(schema.keywords.nextCheckAt), lte(schema.keywords.nextCheckAt, now)), isNull(schema.users.suspendedAt)))
    .orderBy(asc(schema.keywords.nextCheckAt)).limit(40);
  const moves = new Map<number, { email: string; alerts: boolean; list: RankMove[] }>();
  // Rank checks are paid API calls and count toward the monthly AI allowance: when it is used up,
  // that customer's checks wait until the 1st (they got an email at 80% and at 100%).
  const left = new Map<number, Promise<number>>();
  const allowanceLeft = (u: (typeof due)[number]["u"]) => {
    if (u.role === "admin") return Promise.resolve(Infinity);
    if (!left.has(u.id)) left.set(u.id, aiAllowance(u).then((a) => a.remainingUsd));
    return left.get(u.id)!;
  };
  const checked = new Set<number>();
  let i = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (i < due.length) {
      const { k, p, u } = due[i++];
      if ((await allowanceLeft(u)) <= 0.01) {
        const n = new Date();
        await db().update(schema.keywords).set({ nextCheckAt: new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1, 1)) }).where(eq(schema.keywords.id, k.id));
        continue;
      }
      checked.add(u.id);
      const plan = effectivePlan(u);
      const freq = plan.rankFrequencies.includes(p.rankFrequency as never) ? p.rankFrequency : "weekly";
      const next = new Date(Date.now() + (freq === "daily" ? DAY : 7 * DAY));
      try {
        const r = await checkRank(k.keyword, p.domain, p.country, p.language);
        await db().insert(schema.rankChecks).values({ keywordId: k.id, position: r.position, url: r.url, topResults: JSON.stringify(r.top), source: r.source, costUsd: r.costUsd, checkedAt: new Date() });
        await db().update(schema.keywords).set({
          previousPosition: k.position, position: r.position, rankingUrl: r.url, lastCheckedAt: new Date(), nextCheckAt: next,
          bestPosition: r.position != null && (k.bestPosition == null || r.position < k.bestPosition) ? r.position : k.bestPosition,
        }).where(eq(schema.keywords.id, k.id));
        if (k.lastCheckedAt && bigMove(k.position, r.position)) {
          const m = moves.get(u.id) ?? { email: u.email, alerts: !!u.emailAlerts, list: [] };
          m.list.push({ keyword: k.keyword, project: p.name, from: k.position, to: r.position });
          moves.set(u.id, m);
        }
      } catch (e) {
        console.error("[worker] rank check", k.keyword, (e as Error).message);
        await db().update(schema.keywords).set({ nextCheckAt: new Date(Date.now() + 3 * 3600_000) }).where(eq(schema.keywords.id, k.id));
      }
    }
  }));
  for (const userId of checked) await budgetAlerts(userId).catch((e) => console.error("[worker] budgetAlerts", e));
  for (const [userId, m] of moves) {
    if (!m.alerts || !m.list.length) continue;
    const mail = rankAlertEmail(m.list, `${config.appUrl}/app`);
    await sendMail({ to: m.email, userId, kind: "rank_alert", ...mail });
  }
}

// ------------------------------------------------------------------ Monday digest
async function weeklyDigest() {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7), 8));
  if (now < monday) return;
  const users = await db().select().from(schema.users)
    // skip brand-new accounts: their first digest comes the Monday after they have some history
    .where(and(eq(schema.users.emailWeekly, 1), isNotNull(schema.users.emailVerifiedAt), isNull(schema.users.suspendedAt), lt(schema.users.createdAt, new Date(Date.now() - 3 * DAY)),
      or(isNull(schema.users.lastDigestAt), lt(schema.users.lastDigestAt, monday))))
    .limit(25);
  const weekAgo = new Date(Date.now() - 7 * DAY);
  for (const u of users) {
    await db().update(schema.users).set({ lastDigestAt: now }).where(eq(schema.users.id, u.id));
    const projects = await db().select().from(schema.projects).where(eq(schema.projects.userId, u.id));
    if (!projects.length) continue;
    const rows: DigestProject[] = [];
    for (const p of projects) {
      const kws = await db().select().from(schema.keywords).where(eq(schema.keywords.projectId, p.id));
      const prev = await db().select({ score: schema.runs.score }).from(schema.runs)
        .where(and(eq(schema.runs.projectId, p.id), eq(schema.runs.status, "done"), inArray(schema.runs.kind, ["quick", "deep"]), lt(schema.runs.finishedAt, weekAgo), isNotNull(schema.runs.score)))
        .orderBy(sql`${schema.runs.finishedAt} desc`).limit(1);
      const recent = kws.filter((k) => k.lastCheckedAt && k.lastCheckedAt >= weekAgo);
      rows.push({
        name: p.name, score: p.lastScore, prevScore: prev[0]?.score ?? null,
        top10: kws.filter((k) => k.position != null && k.position <= 10).length, tracked: kws.length,
        up: recent.filter((k) => k.position != null && (k.previousPosition == null || k.position < k.previousPosition)).length,
        down: recent.filter((k) => k.previousPosition != null && (k.position == null || k.position > k.previousPosition)).length,
      });
    }
    const mail = weeklyDigestEmail(u.name, rows, `${config.appUrl}/app`);
    await sendMail({ to: u.email, userId: u.id, kind: "weekly_digest", ...mail });
  }
}

export const workerInfo = () => ({ id: WORKER_ID, running: g.__skWorker ? [...g.__skWorker.running] : [], enabled: !!g.__skWorker });
// re-exported for admin "run now" buttons
export { rankChecks as runRankChecksNow, scheduledAudits as runScheduledAuditsNow };
