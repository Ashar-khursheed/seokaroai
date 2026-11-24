import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { currentUser, rateLimit, sameOrigin } from "@/lib/auth";
import { ownedProject } from "@/lib/queries";
import { runBlocked } from "@/lib/usage";
import { createRun } from "@/lib/runs";
import { TEXT_EXT } from "@/lib/fixes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 4000;
const MAX_FILE = 1024 * 1024;
const MAX_TOTAL = 30 * 1024 * 1024;

/**
 * Start an auto-fix on files the user picked from a folder on their own computer (the browser reads
 * them with the File System Access API and posts them here). Files are written to the run's
 * original/ folder before the run is queued.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const body = await req.json().catch(() => null) as { projectId?: number; instructions?: string; sourceRunId?: string; folderName?: string; files?: { path: string; content: string }[] } | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const project = await ownedProject(user, Number(body.projectId));
  if (!project) return NextResponse.json({ error: "Website not found." }, { status: 404 });
  const blocked = await runBlocked(user, "fix");
  if (blocked) return NextResponse.json({ error: blocked }, { status: 402 });
  if (!rateLimit(`fix:${user.id}`, 4, 600)) return NextResponse.json({ error: "Please wait a few minutes before starting another fix." }, { status: 429 });

  const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length) return NextResponse.json({ error: "No supported files were found in that folder." }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: `That folder has more than ${MAX_FILES} code files. Pick the website's source folder instead.` }, { status: 413 });
  let total = 0;
  const clean: { path: string; content: string }[] = [];
  for (const f of files) {
    const rel = String(f.path ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
    if (!rel || rel.split("/").some((p) => p === ".." || p === "") || /^[a-zA-Z]:/.test(rel) || !TEXT_EXT.test(rel)) continue;
    const content = String(f.content ?? "");
    if (content.length > MAX_FILE) continue;
    total += content.length;
    if (total > MAX_TOTAL) return NextResponse.json({ error: "That folder is larger than 30 MB of code. Pick the website's source folder instead." }, { status: 413 });
    clean.push({ path: rel, content });
  }
  if (!clean.length) return NextResponse.json({ error: "No supported files were found in that folder." }, { status: 400 });

  const folderName = String(body.folderName ?? "folder").slice(0, 80);
  let [conn] = await db().select().from(schema.connectors).where(and(eq(schema.connectors.projectId, project.id), eq(schema.connectors.kind, "local"))).limit(1);
  if (!conn) {
    const res = await db().insert(schema.connectors).values({
      userId: user.id, projectId: project.id, kind: "local", name: `Computer · ${folderName}`, config: JSON.stringify({ folderName }),
      status: "ok", lastTestedAt: new Date(), createdAt: new Date(),
    });
    [conn] = await db().select().from(schema.connectors).where(eq(schema.connectors.id, Number((res[0] as { insertId: number }).insertId))).limit(1);
  } else {
    await db().update(schema.connectors).set({ name: `Computer · ${folderName}`, config: JSON.stringify({ folderName }) }).where(eq(schema.connectors.id, conn.id));
  }

  const runId = await createRun({
    userId: user.id, projectId: project.id, kind: "fix", title: `${project.name} · auto-fix in ${folderName}`,
    input: { projectId: project.id, connectorId: conn.id, sourceRunId: String(body.sourceRunId ?? "").slice(0, 100) || null, instructions: String(body.instructions ?? "").slice(0, 2000) },
    beforeQueue: (dir) => {
      const root = path.join(dir, "original");
      for (const f of clean) {
        const target = path.resolve(root, f.path);
        if (!target.startsWith(path.resolve(root) + path.sep)) continue;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, f.content);
      }
    },
  });
  return NextResponse.json({ runId, connectorId: conn.id, files: clean.length });
}
