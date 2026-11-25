import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { config } from "@/lib/config";
import { integrations } from "@/lib/integrations";
import { Card, timeAgo } from "@/components/ui";

export const metadata = { title: "Email log" };

export default async function Emails() {
  const rows = await db().select().from(schema.emailLog).orderBy(desc(schema.emailLog.createdAt)).limit(300);
  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em]">Email log</h1>
      {!(await integrations()).smtp.host && <p className="break-words rounded-lg bg-amber-50 p-3 text-sm text-amber-900">SMTP is not configured: emails are written to <code className="break-all">{config.dataDir}\outbox</code> instead of being sent.</p>}
      <Card>
        <div className="table-wrap"><table className="w-full text-sm">
          <thead><tr className="muted border-b line text-left text-xs"><th className="py-2 pr-3">To</th><th className="pr-3">Type</th><th className="pr-3">Subject</th><th className="pr-3">Status</th><th>When</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b line align-top last:border-0">
              <td className="py-2 pr-3">{r.toEmail}</td><td className="pr-3 text-xs">{r.kind}</td><td className="wrap min-w-[12rem] pr-3">{r.subject}{r.error && <div className="break-words text-xs text-rose-600">{r.error}</div>}</td>
              <td className={`pr-3 ${r.status === "failed" ? "text-rose-600" : r.status === "outbox" ? "text-amber-600" : "text-emerald-600"}`}>{r.status}</td><td className="muted text-xs">{timeAgo(r.createdAt)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
