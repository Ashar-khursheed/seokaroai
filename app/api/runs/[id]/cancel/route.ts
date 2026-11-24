import { NextResponse } from "next/server";
import { ownedRun } from "@/lib/access";
import { cancelRun } from "@/lib/runs";
import { sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const { id } = await ctx.params;
  if (!(await ownedRun(id))) return new Response("Not found", { status: 404 });
  return NextResponse.json({ ok: await cancelRun(id) });
}
