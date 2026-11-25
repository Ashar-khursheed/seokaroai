import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Card, timeAgo } from "@/components/ui";
import { markHandled } from "../actions";

export const metadata = { title: "Messages" };

export default async function Messages() {
  const msgs = await db().select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt)).limit(200);
  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em]">Contact messages</h1>
      {msgs.length === 0 && <Card><p className="muted text-sm">No messages yet.</p></Card>}
      {msgs.map((m) => (
        <Card key={m.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 break-words"><b>{m.name}</b> · <a className="break-all text-brand-500" href={`mailto:${m.email}`}>{m.email}</a>{m.company && <span className="muted"> · {m.company}</span>}<div className="muted text-xs">{timeAgo(m.createdAt)}</div></div>
            {m.handledAt ? <span className="shrink-0 text-xs text-emerald-600">handled</span> : <form action={markHandled} className="shrink-0"><input type="hidden" name="id" value={m.id} /><button className="btn w-full !py-1 text-xs sm:w-auto">Mark handled</button></form>}
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm">{m.message}</p>
        </Card>
      ))}
    </div>
  );
}
