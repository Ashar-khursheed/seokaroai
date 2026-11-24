import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ownedRun } from "@/lib/access";
import { sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";

/** Record the outcome of changes the browser wrote to (or undid in) a local folder. */
export async function POST(req: Request, ctx: { params: Promise<{ runId: string }> }) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const { runId } = await ctx.params;
  if (!(await ownedRun(runId))) return new Response("Not found", { status: 404 });
  const body = await req.json().catch(() => null) as { applied?: number[]; reverted?: number[]; failed?: Record<string, string> } | null;
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const ids = (a?: number[]) => (Array.isArray(a) ? a.map(Number).filter((n) => Number.isInteger(n)) : []);
  const scope = (list: number[]) => and(eq(schema.fixChanges.runId, runId), inArray(schema.fixChanges.id, list));
  if (ids(body.applied).length) await db().update(schema.fixChanges).set({ status: "applied", error: null, appliedAt: new Date() }).where(scope(ids(body.applied)));
  if (ids(body.reverted).length) await db().update(schema.fixChanges).set({ status: "reverted" }).where(scope(ids(body.reverted)));
  for (const [id, msg] of Object.entries(body.failed ?? {})) {
    await db().update(schema.fixChanges).set({ status: "failed", error: String(msg).slice(0, 500) }).where(scope([Number(id)]));
  }
  return NextResponse.json({ ok: true });
}
