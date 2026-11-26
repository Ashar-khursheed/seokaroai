import { ownedRun } from "@/lib/access";
import { runFolder } from "@/lib/files";
import { ensureRunFiles } from "@/lib/run-files";
import { renderRunExportHtml } from "@/lib/report-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const found = await ownedRun(decodeURIComponent(id));
  if (!found) return new Response("Not found", { status: 404 });

  const running = found.run.status === "running" || found.run.status === "queued";
  if (!running) await ensureRunFiles(found.run.id);

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";
  const autoPrint = url.searchParams.get("print") === "1";

  const html = renderRunExportHtml(found.run, runFolder(found.run.id), autoPrint);
  const safeName = found.run.id.replace(/[^a-z0-9._-]/gi, "-") + "-report.html";
  const headers: Record<string, string> = {
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  };
  if (download) headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
  return new Response(html, { headers });
}
