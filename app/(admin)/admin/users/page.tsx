import { desc, like, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getPlan, PLANS } from "@/lib/plans";
import { Card, timeAgo } from "@/components/ui";
import { setUserPlan, toggleSuspend, verifyUserEmail } from "../actions";

export const metadata = { title: "Users" };

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim().slice(0, 100);
  const users = await db().select().from(schema.users)
    .where(term ? or(like(schema.users.email, `%${term}%`), like(schema.users.name, `%${term}%`)) : undefined)
    .orderBy(desc(schema.users.createdAt)).limit(200);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Users</h1>
      <form className="flex max-w-md gap-2"><input name="q" defaultValue={term} placeholder="Search email or name" className="input" /><button className="btn">Search</button></form>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="muted border-b line text-left text-xs"><th className="py-2">User</th><th>Plan</th><th>Status</th><th>Signed up</th><th>Last login</th><th>Actions</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-b line align-top last:border-0">
                <td className="py-2.5"><b>{u.email}</b> {u.role === "admin" && <span className="rounded bg-amber-300 px-1 text-[10px] font-bold text-black">ADMIN</span>}<div className="muted text-xs">{u.name} · #{u.id} {u.emailVerifiedAt ? "· confirmed" : "· not confirmed"}</div></td>
                <td>{getPlan(u.plan).name}{u.billingCycle ? <span className="muted text-xs"> ({u.billingCycle})</span> : null}</td>
                <td>{u.suspendedAt ? <span className="text-rose-600">suspended</span> : u.planStatus}</td>
                <td className="muted text-xs">{timeAgo(u.createdAt)}</td>
                <td className="muted text-xs">{timeAgo(u.lastLoginAt)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    <form action={setUserPlan} className="flex gap-1"><input type="hidden" name="userId" value={u.id} />
                      <select name="plan" defaultValue={u.plan} className="input !w-auto !py-1 text-xs">{Object.values(PLANS).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select>
                      <button className="btn !px-2 !py-1 text-xs">Set</button></form>
                    {!u.emailVerifiedAt && <form action={verifyUserEmail}><input type="hidden" name="userId" value={u.id} /><button className="btn !px-2 !py-1 text-xs">Confirm email</button></form>}
                    {u.role !== "admin" && <form action={toggleSuspend}><input type="hidden" name="userId" value={u.id} /><button className={`btn !px-2 !py-1 text-xs ${u.suspendedAt ? "" : "!text-rose-600"}`}>{u.suspendedAt ? "Reactivate" : "Suspend"}</button></form>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="muted mt-3 text-xs">Setting a plan here is a manual override (for example a comped account). Paddle webhooks overwrite it when the customer's subscription changes.</p>
      </Card>
    </div>
  );
}
