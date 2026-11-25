"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";

export interface BoardAgent { id: string; name: string; icon: string; phase: string; role: string; file: string; when?: string }
interface Ev { t: number; kind: string; agent?: string; text: string }

const norm = (a?: string) => (a ?? "").replace(/^.*:/, "").trim().toLowerCase();
/** Does a "Wrote …" event refer to this agent's report file (or a file inside its report folder)? */
/** Agents may name reports "findings/seo-technical.md" or "findings/technical.md": treat both the same. */
export const canonPath = (p: string) => p.toLowerCase().replace(/\\/g, "/").replace(/(^|\/)seo-/g, "$1");
const fileHit = (raw: string, rawFile: string) => {
  if (!raw.startsWith("Wrote ")) return false;
  const text = "Wrote " + canonPath(raw.slice(6));
  const file = canonPath(rawFile);
  const parts = file.split("/");
  const last = parts[parts.length - 1];
  if (/\.\w+$/.test(file)) return text.endsWith(parts.slice(-2).join("/")) || text.endsWith("/" + last) || text === "Wrote " + last;
  return text.includes(last + "/");
};

/**
 * Live board of the agent team for an AI deep audit. Fed by the run's event stream: an agent is
 * "working" once it has activity, "done" when its report file exists or it reports finished.
 */
export function AgentBoard({ runId, running, agents, doneFiles }: { runId: string; running: boolean; agents: BoardAgent[]; doneFiles: string[] }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const router = useRouter();

  useEffect(() => {
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    const connect = () => {
      setEvents([]);
      es = new EventSource(`/api/runs/${encodeURIComponent(runId)}/events`);
      es.onmessage = (e) => { try { const ev = JSON.parse(e.data) as Ev; setEvents((p) => [...p.slice(-3000), ev]); } catch { /* ignore */ } };
      es.addEventListener("end", (e) => {
        es?.close();
        let retry = false;
        try { retry = !!JSON.parse((e as MessageEvent).data).retry; } catch { /* ignore */ }
        if (retry && !closed) timer = setTimeout(connect, 4000);
        else if (running) router.refresh();
      });
    };
    connect();
    return () => { closed = true; es?.close(); if (timer) clearTimeout(timer); };
  }, [runId, running, router]);

  const state = useMemo(() => {
    const out = new Map<string, { status: "waiting" | "working" | "done" | "skipped"; last?: string; steps: number }>();
    for (const a of agents) out.set(a.id, { status: doneFiles.map(canonPath).some((f) => f === canonPath(a.file) || f.startsWith(canonPath(a.file) + "/")) ? "done" : "waiting", steps: 0 });
    const finished = events.some((e) => e.kind === "done" || e.kind === "error");
    for (const e of events) {
      const who = norm(e.agent);
      let a = agents.find((x) => x.id === who);
      if (!a && !e.agent && e.kind !== "info") {
        a = agents.find((x) => x.id !== "orchestrator" && !x.id.startsWith("seo-") && fileHit(e.text, x.file)) ?? agents.find((x) => x.id === "orchestrator");
      }
      if (!a) continue;
      const s = out.get(a.id)!;
      s.steps++;
      if (e.kind !== "agent" || !/^Agent finished/.test(e.text)) s.last = e.text;
      if (s.status === "waiting") s.status = "working";
      if (/^Agent finished/.test(e.text) || fileHit(e.text, a.file)) s.status = "done";
      // a specialist writing its own findings file also counts as done
      for (const b of agents) if (b.id.startsWith("seo-") && fileHit(e.text, b.file)) out.get(b.id)!.status = "done";
    }
    if (finished || !running) for (const s of out.values()) {
      if (s.status === "working") s.status = "done";
      else if (s.status === "waiting") s.status = "skipped"; // not relevant to this site, or not reached
    }
    return out;
  }, [events, agents, doneFiles, running]);

  const skipped = [...state.values()].filter((s) => s.status === "skipped").length;
  const total = Math.max(1, agents.length - skipped);
  const done = [...state.values()].filter((s) => s.status === "done").length;
  const working = [...state.values()].filter((s) => s.status === "working").length;
  const pct = Math.round((done / total) * 100);
  const phases = Array.from(new Set(agents.map((a) => a.phase)));

  return (
    <div className="space-y-5">
      <div className="panel overflow-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border line text-brand-500">
            <Icon name="BrainCircuit" size={19} />
            {running && <span className="live-dot absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-500" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{running ? "Your agent team is working" : "Agent team"}</div>
            <div className="muted text-[13px]">{done} of {total} done{running && working ? ` · ${working} working now` : ""}{skipped ? ` · ${skipped} not needed for this site` : ""}</div>
          </div>
          <div className="shrink-0 text-2xl font-semibold tabular-nums">{pct}%</div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--panel2)]">
          <div className={`h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-400 transition-[width] duration-700 ${running ? "progress-glow" : ""}`} style={{ width: `${Math.max(pct, running ? 3 : 0)}%` }} />
        </div>
      </div>

      {phases.map((ph) => (
        <div key={ph}>
          <div className="muted mb-2 text-[12px] font-medium uppercase tracking-wider">{ph}</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {agents.filter((a) => a.phase === ph).map((a) => {
              const s = state.get(a.id)!;
              return (
                <div key={a.id} className={`agent-card panel relative min-w-0 p-3.5 sm:p-4 ${s.status === "working" && running ? "is-working" : ""} ${s.status === "waiting" || s.status === "skipped" ? "opacity-55" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border line ${s.status === "done" ? "bg-low/10 text-low" : "text-brand-500"}`}>
                      <Icon name={s.status === "done" ? "Check" : a.icon} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-[14px] font-medium">{a.name}</span>
                        {a.when && <span className="muted text-[11px]">for {a.when}</span>}
                      </div>
                      <div className={`mt-0.5 flex items-center gap-1.5 text-[12px] ${s.status === "done" ? "text-low" : s.status === "working" ? "text-brand-500" : "muted"}`}>
                        {s.status === "working" && running && <span className="live-dot h-1.5 w-1.5 rounded-full bg-current" />}
                        {s.status === "done" ? "Done" : s.status === "working" ? (running ? "Working" : "Stopped") : s.status === "skipped" ? "Not needed" : "Waiting"}
                        {s.steps > 0 && <span className="muted">· {s.steps} steps</span>}
                      </div>
                    </div>
                  </div>
                  <p className={`mt-3 line-clamp-2 min-h-[2.5em] break-words font-mono text-[11.5px] leading-snug ${s.status === "working" ? "" : "muted"}`}>
                    {s.status === "working" && s.last ? s.last : a.role}
                  </p>
                  {s.status === "working" && running && <div className="agent-shimmer mt-3 h-1 rounded-full" />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
