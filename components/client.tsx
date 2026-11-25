"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

// ------------------------------------------------------------------ forms
export interface FormState { ok?: boolean; error?: string; message?: string }

export function SubmitButton({ children, className = "btn btn-primary", pendingText = "Working…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} aria-busy={pending}>{pending ? pendingText : children}</button>;
}

/** Form bound to a server action that returns FormState; shows the error or success message. */
export function ActionForm({ action, children, className = "space-y-4", resetOnOk = false }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>; children: React.ReactNode; className?: string; resetOnOk?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && resetOnOk) ref.current?.reset(); }, [state, resetOnOk]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {state.error && <div role="alert" className="break-words rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{state.error}</div>}
      {state.ok && state.message && <div role="status" className="break-words rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{state.message}</div>}
      {children}
    </form>
  );
}

export function ConfirmButton({ children, message, className = "btn" }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {pending ? "Working…" : children}
    </button>
  );
}

// ------------------------------------------------------------------ live run feed
interface Ev { t: number; kind: "info" | "agent" | "tool" | "text" | "error" | "done"; agent?: string; text: string }

const KIND_STYLE: Record<string, string> = {
  info: "muted", agent: "font-semibold text-brand-600 dark:text-brand-400", tool: "", text: "text-emerald-700 dark:text-emerald-400",
  error: "text-rose-600", done: "font-bold text-emerald-600",
};

export function LiveLog({ id, running, compact = false }: { id: string; running: boolean; compact?: boolean }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const [filter, setFilter] = useState("all");
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    const connect = () => {
      setEvents([]);
      es = new EventSource(`/api/runs/${encodeURIComponent(id)}/events`);
      es.onmessage = (e) => {
        try { const ev = JSON.parse(e.data) as Ev; setEvents((p) => [...p.slice(-1500), ev]); } catch { /* ignore */ }
      };
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
  }, [id, running, router]);

  useEffect(() => {
    const el = box.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 200) el.scrollTop = el.scrollHeight;
  }, [events]);

  const agents = Array.from(new Set(events.map((e) => e.agent).filter(Boolean))) as string[];
  const shown = filter === "all" ? events : events.filter((e) => (filter === "main" ? !e.agent : e.agent === filter));
  return (
    <div>
      {!compact && agents.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="muted">{agents.length} agents · {events.length} events</span>
          <select className="input max-w-full !w-auto !py-1 text-xs" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter activity">
            <option value="all">All activity</option>
            <option value="main">Orchestrator only</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}
      <div ref={box} className={`panel2 overflow-auto rounded-xl border line p-3 font-mono text-[12.5px] leading-relaxed ${compact ? "max-h-64" : "max-h-[70vh]"}`}>
        {shown.length === 0 && <div className="muted">{running ? "Waiting for the worker to pick this up…" : "No activity log is available for this run."}</div>}
        {shown.map((e, i) => (
          <div key={i} className={`whitespace-pre-wrap break-words ${KIND_STYLE[e.kind] ?? ""}`}>
            <span className="muted mr-2">{new Date(e.t).toLocaleTimeString()}</span>
            {e.agent && <span className="mr-2 rounded bg-brand-100 px-1.5 text-[11px] text-brand-700">{e.agent}</span>}
            {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AutoRefresh({ active, ms = 8000 }: { active: boolean; ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), ms);
    return () => clearInterval(t);
  }, [active, ms, router]);
  return null;
}

export function CancelRunButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button className="btn !border-rose-300 !text-rose-700" disabled={busy}
      onClick={async () => {
        if (!confirm("Stop this run? Files written so far are kept.")) return;
        setBusy(true);
        await fetch(`/api/runs/${encodeURIComponent(id)}/cancel`, { method: "POST" });
        router.refresh();
      }}>
      Stop run
    </button>
  );
}

export function PrintButton() {
  return <button className="btn" onClick={() => window.print()}>Print / save PDF</button>;
}

// ------------------------------------------------------------------ Paddle checkout
declare global {
  interface Window { Paddle?: any }
}

export function CheckoutButton({ priceId, email, customData, env, token, label, className = "btn btn-primary w-full justify-center" }: {
  priceId: string; email: string; customData: Record<string, string>; env: "sandbox" | "production"; token: string; label: string; className?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const init = () => {
      if (!window.Paddle) return;
      if (env === "sandbox") window.Paddle.Environment.set("sandbox");
      window.Paddle.Initialize({ token });
      setReady(true);
    };
    if (window.Paddle) { setReady(true); return; }
    const existing = document.getElementById("paddle-js");
    if (existing) { existing.addEventListener("load", init); return; }
    const s = document.createElement("script");
    s.id = "paddle-js";
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [env, token]);
  return (
    <button className={className} disabled={!ready}
      onClick={() => window.Paddle?.Checkout.open({
        items: [{ priceId: priceId.trim(), quantity: 1 }], customer: { email }, customData,
        settings: { displayMode: "overlay", theme: "light", successUrl: `${location.origin}/app/billing?checkout=success` },
      })}>
      {ready ? label : "Loading checkout…"}
    </button>
  );
}
