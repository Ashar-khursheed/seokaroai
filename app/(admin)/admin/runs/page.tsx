import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Card, KIND_LABEL, StatusPill, timeAgo } from "@/components/ui";

export const metadata = { title: "Runs" };

export default async function AdminRuns() {
  const rows = await db().select({ r: schema.runs, email: schema.users.email }).from(schema.runs)
    .innerJoin(schema.users, eq(schema.users.id, schema.runs.userId)).orderBy(desc(schema.runs.createdAt)).limit(200);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Runs</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="muted border-b line text-left text-xs"><th className="py-2">Run</th><th>User</th><th>Type</th><th>Status</th><th>Score</th><th>Cost</th><th>When</th></tr></thead>
            <tbody>{rows.map(({ r, email }) => (
              <tr key={r.id} className="border-b line align-top last:border-0">
                <td className="max-w-[340px] py-2"><Link href={`/app/runs/${encodeURIComponent(r.id)}`} className="font-medium hover:text-brand-500">{r.title}</Link>{r.error && <div className="truncate text-xs text-rose-600">{r.error}</div>}</td>
                <td className="text-xs">{email}</td><td>{KIND_LABEL[r.kind]}{r.triggerType === "schedule" ? " (auto)" : ""}</td>
                <td><StatusPill status={r.status} /></td><td>{r.score ?? "–"}</td>
                <td>{r.costUsd != null ? `$${Number(r.costUsd).toFixed(2)}` : "–"}</td><td className="muted text-xs">{timeAgo(r.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
