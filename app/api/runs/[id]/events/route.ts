import fs from "node:fs";
import path from "node:path";
import { ownedRun } from "@/lib/access";
import { getLive, type RunEvent } from "@/lib/runs";
import { runFolder } from "@/lib/files";
import { ensureRunFiles } from "@/lib/run-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Server-sent events: replays events.jsonl, then streams new events while the run is live. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const found = await ownedRun(id);
  if (!found) return new Response("Not found", { status: 404 });
  const eventsPath = path.join(runFolder(id), "events.jsonl");
  if (!getLive(id) && !fs.existsSync(eventsPath)) {
    await ensureRunFiles(id, { onlyPath: "events.jsonl" });
  }
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown, event = "message") => controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        const lines = fs.readFileSync(path.join(runFolder(id), "events.jsonl"), "utf8").split("\n").filter(Boolean);
        for (const line of lines.slice(-800)) send(JSON.parse(line) as RunEvent);
      } catch { /* no events yet */ }
      const l = getLive(id);
      const pending = found.run.status === "queued";
      if (!l && !pending) { send({}, "end"); controller.close(); return; }
      if (!l) {
        // queued: tell the client to reconnect shortly
        send({ retry: true }, "end");
        controller.close();
        return;
      }
      const onEvent = (ev: RunEvent) => send(ev);
      const onEnd = () => { send({}, "end"); cleanup(); try { controller.close(); } catch { /* closed */ } };
      const ping = setInterval(() => { try { controller.enqueue(enc.encode(": ping\n\n")); } catch { cleanup(); } }, 20000);
      const cleanup = () => { clearInterval(ping); l.emitter.off("event", onEvent); l.emitter.off("end", onEnd); };
      l.emitter.on("event", onEvent);
      l.emitter.on("end", onEnd);
      req.signal.addEventListener("abort", cleanup);
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
