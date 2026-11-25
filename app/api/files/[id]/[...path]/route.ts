import fs from "node:fs";
import path from "node:path";
import { ownedRun } from "@/lib/access";
import { MIME, runFolder, safeJoin } from "@/lib/files";
import { ensureRunFiles } from "@/lib/run-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string; path: string[] }> }) {
  const { id, path: parts } = await ctx.params;
  if (!(await ownedRun(id))) return new Response("Not found", { status: 404 });
  const rel = parts.map(decodeURIComponent).join("/");
  const file = safeJoin(runFolder(id), rel);
  if (!file || /(^|\/)(prompt\.md|events\.jsonl)$/.test(rel)) return new Response("Not found", { status: 404 });
  if (!fs.existsSync(file)) await ensureRunFiles(id, { onlyPath: rel });
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return new Response("Not found", { status: 404 });
  const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string> = { "Content-Type": type, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" };
  // Agent-written HTML is untrusted: run it in an opaque-origin sandbox.
  if (type.startsWith("text/html")) headers["Content-Security-Policy"] = "sandbox allow-scripts allow-popups";
  if (new URL(req.url).searchParams.get("download")) headers["Content-Disposition"] = `attachment; filename="${path.basename(file).replace(/"/g, "")}"`;
  return new Response(fs.readFileSync(file), { headers });
}
