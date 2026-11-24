import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";

/** Project owned by the user (admins can open any), or null. */
export async function ownedProject(user: User, id: number) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [p] = await db().select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
  if (!p || (p.userId !== user.id && user.role !== "admin")) return null;
  return p;
}

export async function userProjects(userId: number) {
  return db().select().from(schema.projects).where(eq(schema.projects.userId, userId)).orderBy(asc(schema.projects.name));
}

export async function projectKeywords(projectId: number) {
  return db().select().from(schema.keywords).where(eq(schema.keywords.projectId, projectId)).orderBy(asc(schema.keywords.keyword));
}

export async function recentRuns(o: { userId?: number; projectId?: number; kinds?: string[]; limit?: number }) {
  const conds = [];
  if (o.userId) conds.push(eq(schema.runs.userId, o.userId));
  if (o.projectId) conds.push(eq(schema.runs.projectId, o.projectId));
  if (o.kinds?.length) conds.push(inArray(schema.runs.kind, o.kinds));
  return db().select().from(schema.runs).where(conds.length ? and(...conds) : undefined).orderBy(desc(schema.runs.createdAt)).limit(o.limit ?? 20);
}

/** Score history (oldest first) for audits of one project. */
export async function scoreHistory(projectId: number, limit = 20) {
  const rows = await db().select({ score: schema.runs.score, at: schema.runs.finishedAt, kind: schema.runs.kind }).from(schema.runs)
    .where(and(eq(schema.runs.projectId, projectId), eq(schema.runs.status, "done"), inArray(schema.runs.kind, ["quick", "deep"])))
    .orderBy(desc(schema.runs.finishedAt)).limit(limit);
  return rows.filter((r) => r.score != null).reverse();
}

/** Position history per keyword over the last N days (null = not in top 100). */
export async function rankHistory(keywordIds: number[], days = 30) {
  if (!keywordIds.length) return new Map<number, { position: number | null; at: Date }[]>();
  const rows = await db().select({ k: schema.rankChecks.keywordId, position: schema.rankChecks.position, at: schema.rankChecks.checkedAt })
    .from(schema.rankChecks)
    .where(and(inArray(schema.rankChecks.keywordId, keywordIds), gte(schema.rankChecks.checkedAt, new Date(Date.now() - days * 864e5))))
    .orderBy(asc(schema.rankChecks.checkedAt));
  const map = new Map<number, { position: number | null; at: Date }[]>();
  for (const r of rows) map.set(r.k, [...(map.get(r.k) ?? []), { position: r.position, at: r.at }]);
  return map;
}

export async function latestTop10(keywordId: number) {
  const [r] = await db().select({ top: schema.rankChecks.topResults, at: schema.rankChecks.checkedAt }).from(schema.rankChecks)
    .where(eq(schema.rankChecks.keywordId, keywordId)).orderBy(desc(schema.rankChecks.checkedAt)).limit(1);
  return r ?? null;
}

export async function keywordCount(projectId: number) {
  const [r] = await db().select({ n: count() }).from(schema.keywords).where(eq(schema.keywords.projectId, projectId));
  return Number(r.n);
}

export function rankBuckets(kws: { position: number | null }[]) {
  const ranked = kws.filter((k) => k.position != null) as { position: number }[];
  return {
    top3: ranked.filter((k) => k.position <= 3).length,
    top10: ranked.filter((k) => k.position <= 10).length,
    top100: ranked.length,
    total: kws.length,
  };
}
