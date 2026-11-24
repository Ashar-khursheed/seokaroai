import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { recentRuns } from "@/lib/queries";
import { AutoRefresh } from "@/components/client";
import { Card, KIND_LABEL, ScoreRing, StatusPill, timeAgo } from "@/components/ui";

export const metadata = { title: "All reports" };

export default async function Runs({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const user = await requireUser();
  const kinds = kind && ["quick", "deep", "keyword"].includes(kind) ? [kind] : undefined;
  const runs = await recentRuns({ userId: user.id, kinds, limit: 200 });
  const filter = (k: string | undefined, label: string) => (
    <Link href={k ? `/app/runs?kind=${k}` : "/app/runs"} className={`rounded-lg px-3 py-1.5 text-sm ${kind === k || (!kind && !k) ? "bg-brand-600 text-white" : "panel2"}`}>{label}</Link>
  );
  return (
    <div className="space-y-5">
      <AutoRefresh active={runs.some((r) => r.status === "running" || r.status === "queued")} ms={10000} />
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">All reports</h1>
      <div className="flex flex-wrap gap-2">{filter(undefined, "All")}{filter("quick", "Site audits")}{filter("deep", "AI deep audits")}{filter("keyword", "Keyword battles")}</div>
      <Card>
        {runs.length === 0 ? <p className="muted text-sm">No reports yet.</p> : (
          <div className="divide-y line">
            {runs.map((r) => (
              <Link key={r.id} href={`/app/runs/${encodeURIComponent(r.id)}`} className="flex items-center gap-4 py-3 hover:opacity-80">
                <ScoreRing score={r.score} size={48} label="" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{r.title}</div>
                  <div className="muted text-xs">{KIND_LABEL[r.kind]}{r.triggerType === "schedule" ? " · scheduled" : ""} · {timeAgo(r.createdAt)}</div>
                </div>
                <StatusPill status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
