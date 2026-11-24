import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ownedRun } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** File changes of a fix run (owner only), for the browser to write into the user's local folder. */
export async function GET(req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  if (!(await ownedRun(runId))) return new Response("Not found", { status: 404 });
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const rows = await db().select().from(schema.fixChanges).where(eq(schema.fixChanges.runId, runId));
  const pick = rows.filter((r) => r.resourceType === "file" && (!ids.length || ids.includes(r.id)));
  return NextResponse.json({ changes: pick.map((r) => ({ id: r.id, path: r.resourceId, field: r.field, status: r.status, oldValue: r.oldValue, newValue: r.newValue })) });
}
