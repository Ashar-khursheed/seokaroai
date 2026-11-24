import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { consumeToken } from "@/lib/auth";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Email confirmation link target: marks the address verified and opens the dashboard. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = await consumeToken(token, "verify");
  if (!userId) return NextResponse.redirect(`${config.appUrl}/app?verified=invalid`);
  await db().update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
  return NextResponse.redirect(`${config.appUrl}/app?verified=1`);
}
