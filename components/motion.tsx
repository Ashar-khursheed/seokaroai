"use client";

import { useEffect, useRef, useState } from "react";

/** Fades children up when they scroll into view (once). */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref as never} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

/** Counts from 0 to `to` when visible. */
export function CountUp({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  // Server HTML carries the real number; the count-up only runs in the browser once visible.
  const [v, setV] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref} className="tabular-nums">{v.toLocaleString()}{suffix}</span>;
}

/** Sets --mx/--my on the element so `.spotlight` can follow the cursor. */
export function Spotlight({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`spotlight ${className}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}

const SCRIPT: { agent: string; text: string; tone?: "ok" | "warn" | "crit" }[] = [
  { agent: "orchestrator", text: "Crawled 42 pages · business type: e-commerce" },
  { agent: "seo-technical", text: "robots.txt ok · sitemap.xml returns 404", tone: "crit" },
  { agent: "seo-content", text: "11 claims without a source on /", tone: "warn" },
  { agent: "seo-schema", text: "Offer price 0 contradicts /pricing ($39)", tone: "warn" },
  { agent: "seo-geo", text: "GPTBot, ClaudeBot, PerplexityBot allowed", tone: "ok" },
  { agent: "keyword-battle", text: "#1 covers pricing, setup and FAQs · you cover 1 of 3", tone: "warn" },
  { agent: "auto-fix", text: "Opened pull request: add sitemap + canonical tags", tone: "ok" },
];

/** Looping illustration of the agent team at work (example data, labelled as such). */
export function AgentConsole() {
  const [shown, setShown] = useState(1);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const line = SCRIPT[(shown - 1) % SCRIPT.length].text;
    if (typed.length < line.length) {
      const t = setTimeout(() => setTyped(line.slice(0, typed.length + 2)), 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setShown((s) => (s >= SCRIPT.length ? 1 : s + 1)); setTyped(""); }, 1100);
    return () => clearTimeout(t);
  }, [typed, shown]);
  const visible = SCRIPT.slice(0, shown);
  const tone = (t?: string) => (t === "crit" ? "text-crit" : t === "warn" ? "text-high" : t === "ok" ? "text-low" : "");
  return (
    <div className="panel overflow-hidden font-mono text-[12.5px] shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 border-b line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--line-strong)]" /><span className="h-2.5 w-2.5 rounded-full bg-[var(--line-strong)]" /><span className="h-2.5 w-2.5 rounded-full bg-[var(--line-strong)]" />
        <span className="muted ml-2 text-[11px]">audit · yourbrand.com · example</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-low"><span className="live-dot h-1.5 w-1.5 rounded-full bg-low" />live</span>
      </div>
      <div className="h-[250px] space-y-2 overflow-hidden p-4">
        {visible.map((l, i) => {
          const last = i === visible.length - 1;
          return (
            <div key={`${shown}-${i}`} className="flex gap-3 animate-fade-up" style={{ animationDuration: ".4s" }}>
              <span className="w-[112px] shrink-0 truncate text-brand-500">{l.agent}</span>
              <span className={`${tone(l.tone)} ${last ? "caret" : ""}`}>{last ? typed : l.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
