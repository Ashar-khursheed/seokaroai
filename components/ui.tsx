export const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;

const SEV_STYLE: Record<string, string> = {
  critical: "bg-crit/12 text-crit ring-crit/25",
  high: "bg-high/12 text-high ring-high/25",
  medium: "bg-med/12 text-med ring-med/25",
  low: "bg-low/12 text-low ring-low/25",
  info: "bg-[var(--panel2)] muted ring-[var(--line)]",
};
const SEV_BORDER: Record<string, string> = {
  critical: "border-l-crit", high: "border-l-high", medium: "border-l-med", low: "border-l-low", info: "border-l-[var(--line-strong)]",
};

export function sevKey(s?: string) {
  const k = String(s ?? "info").toLowerCase();
  return k in SEV_STYLE ? k : "info";
}

export function SevBadge({ s }: { s?: string }) {
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${SEV_STYLE[sevKey(s)]}`}>{s || "Info"}</span>;
}

export function sevBorder(s?: string) {
  return SEV_BORDER[sevKey(s)];
}

export function scoreColor(n: number | null | undefined) {
  if (n == null) return "var(--muted)";
  return n >= 80 ? "#10b981" : n >= 60 ? "#3b82f6" : n >= 40 ? "#f59e0b" : "#f43f5e";
}

/** Circular score that draws itself on load. */
export function ScoreRing({ score, size = 120, label = "/100" }: { score: number | null | undefined; size?: number; label?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = score == null ? 0 : Math.max(0, Math.min(100, score));
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={score == null ? "Not scored yet" : `Score ${score} of 100`} className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--panel2)" strokeWidth="7" />
      {score != null && (
        <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" className="ring-anim"
          style={{ ["--ring-len" as string]: String(c) }} strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} transform="rotate(-90 50 50)" />
      )}
      <text x="50" y={label ? 54 : 58} textAnchor="middle" fontSize="27" fontWeight="600" fill="currentColor" style={{ fontVariantNumeric: "tabular-nums" }}>{score == null ? "–" : score}</text>
      {label && <text x="50" y="69" textAnchor="middle" fontSize="9" fill="var(--muted)">{label}</text>}
    </svg>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "text-brand-500 ring-brand-500/30 bg-brand-500/10",
    queued: "muted ring-[var(--line)] bg-[var(--panel2)]",
    done: "text-low ring-low/30 bg-low/10",
    failed: "text-crit ring-crit/30 bg-crit/10",
    cancelled: "muted ring-[var(--line)] bg-[var(--panel2)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${map[status] ?? map.queued}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${status === "running" || status === "queued" ? "live-dot" : ""}`} />
      {status}
    </span>
  );
}

export function Card({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel min-w-0 p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-[13px] font-medium text-[var(--muted)]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.03em]">{title}</h1>
        {subtitle && <p className="muted mt-1 text-[14px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} KB`);

export function fileUrl(id: string, p: string, download = false) {
  return `/api/files/${encodeURIComponent(id)}/${p.split("/").map(encodeURIComponent).join("/")}${download ? "?download=1" : ""}`;
}

/** Tiny line chart. `invert` for rank positions (lower is better, drawn higher). */
export function Sparkline({ values, width = 120, height = 32, invert = false, color = "#1f86ff" }: { values: (number | null)[]; width?: number; height?: number; invert?: boolean; color?: string }) {
  const pts = values.map((v, i) => ({ v, i })).filter((p) => p.v != null) as { v: number; i: number }[];
  if (pts.length < 2) return <span className="muted text-xs">–</span>;
  const min = Math.min(...pts.map((p) => p.v)), max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 1;
  const x = (i: number) => (i / Math.max(1, values.length - 1)) * (width - 4) + 2;
  const y = (v: number) => { const t = (v - min) / span; return 2 + (invert ? t : 1 - t) * (height - 4); };
  const d = pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r="2.4" fill={color} />
    </svg>
  );
}

/** Score-over-time area chart. */
export function ScoreChart({ points, height = 170 }: { points: { score: number | null; at: Date | null }[]; height?: number }) {
  const pts = points.filter((p) => p.score != null && p.at) as { score: number; at: Date }[];
  if (pts.length < 2) return <div className="muted grid h-36 place-items-center text-[13px]">The trend appears after two audits.</div>;
  const W = 640, H = height, pad = 26;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const y = (s: number) => H - pad - (s / 100) * (H - pad * 2);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.score)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Score history">
      <defs><linearGradient id="sc-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1f86ff" stopOpacity=".22" /><stop offset="1" stopColor="#1f86ff" stopOpacity="0" /></linearGradient></defs>
      {[0, 50, 100].map((g) => <g key={g}><line x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeDasharray="3 4" /><text x={2} y={y(g) + 3} fontSize="9.5" fill="var(--muted)">{g}</text></g>)}
      <path d={`${d} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="url(#sc-fill)" />
      <path d={d} fill="none" stroke="#1f86ff" strokeWidth="2.2" strokeLinejoin="round" />
      {pts.map((p, i) => <g key={i}><circle cx={x(i)} cy={y(p.score)} r="3.4" fill="var(--panel)" stroke={scoreColor(p.score)} strokeWidth="2" /><title>{`${p.score} · ${p.at.toLocaleDateString()}`}</title></g>)}
      <text x={pad} y={H - 6} fontSize="9.5" fill="var(--muted)">{pts[0].at.toLocaleDateString()}</text>
      <text x={W - pad} y={H - 6} fontSize="9.5" fill="var(--muted)" textAnchor="end">{pts[pts.length - 1].at.toLocaleDateString()}</text>
    </svg>
  );
}

export function Position({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="muted">–</span>;
  const cls = value <= 3 ? "bg-low/12 text-low" : value <= 10 ? "bg-brand-500/12 text-brand-500" : value <= 20 ? "bg-high/12 text-high" : "bg-[var(--panel2)] muted";
  return <span className={`inline-block min-w-[2.2rem] rounded-md px-1.5 py-0.5 text-center text-[13px] font-semibold tabular-nums ${cls}`}>{value}</span>;
}

/** Position change: positive = moved up (better). */
export function Delta({ from, to }: { from: number | null | undefined; to: number | null | undefined }) {
  if (from == null && to == null) return <span className="muted">–</span>;
  if (from == null) return <span className="text-xs font-medium text-low">new</span>;
  if (to == null) return <span className="text-xs font-medium text-crit">lost</span>;
  const d = from - to;
  if (!d) return <span className="muted text-xs">±0</span>;
  return <span className={`text-xs font-semibold tabular-nums ${d > 0 ? "text-low" : "text-crit"}`}>{d > 0 ? "↑" : "↓"}{Math.abs(d)}</span>;
}

export function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const col = limit <= 0 ? "var(--line-strong)" : pct >= 100 ? "#f43f5e" : pct >= 80 ? "#f59e0b" : "#1f86ff";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[12.5px]"><span>{label}</span><span className="muted tabular-nums">{limit > 0 ? `${used} / ${limit.toLocaleString()}` : "not in plan"}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--panel2)]"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: col }} /></div>
    </div>
  );
}

export function timeAgo(d: Date | null | undefined) {
  if (!d) return "never";
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 30 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return d.toLocaleDateString();
}

export const KIND_LABEL: Record<string, string> = { quick: "Site audit", deep: "AI deep audit", keyword: "Keyword battle", fix: "AI auto-fix" };
export const KIND_ICON: Record<string, string> = { quick: "ScanSearch", deep: "BrainCircuit", keyword: "Swords", fix: "WandSparkles" };

export function Empty({ icon = "Sparkles", title, text, action }: { icon?: string; title: string; text?: string; action?: React.ReactNode }) {
  // icon rendered by caller-provided element to keep this file free of client/icon imports
  void icon;
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <div className="text-[15px] font-medium">{title}</div>
      {text && <p className="muted mt-1.5 max-w-sm text-[14px]">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
