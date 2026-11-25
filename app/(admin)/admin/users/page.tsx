import { desc, like, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { effectivePlan, getPlan, PLANS } from "@/lib/plans";
import { monthlyAiSpend } from "@/lib/usage";
import { Card, timeAgo } from "@/components/ui";
import { setUserPlan, toggleSuspend, verifyUserEmail } from "../actions";

export const metadata = { title: "Users" };

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim().slice(0, 100);
  const users = await db().select().from(schema.users)
    .where(term ? or(like(schema.users.email, `%${term}%`), like(schema.users.name, `%${term}%`)) : undefined)
    .orderBy(desc(schema.users.createdAt)).limit(200);
  const spend = new Map(await Promise.all(users.map(async (u) => [u.id, await monthlyAiSpend(u.id)] as const)));
  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em]">Users</h1>
      <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row"><input name="q" defaultValue={term} placeholder="Search email or name" className="input min-w-0 flex-1" /><button className="btn w-full shrink-0 sm:w-auto">Search</button></form>
      <Card>
        <div className="table-wrap">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="muted border-b line text-left text-xs"><th className="py-2 pr-3">User</th><th className="pr-3">Plan</th><th className="pr-3">Status</th><th className="pr-3">AI cost this month</th><th className="pr-3">Signed up</th><th className="pr-3">Last login</th><th>Actions</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-b line align-top last:border-0">
                <td className="py-2.5 pr-3"><b>{u.email}</b> {u.role === "admin" && <span className="rounded bg-amber-300 px-1 text-[10px] font-bold text-black">ADMIN</span>}<div className="muted text-xs">{u.name} · #{u.id} {u.emailVerifiedAt ? "· confirmed" : "· not confirmed"}</div></td>
                <td className="pr-3">{getPlan(u.plan).name}{u.billingCycle ? <span className="muted text-xs"> ({u.billingCycle})</span> : null}</td>
                <td className="pr-3">{u.suspendedAt ? <span className="text-rose-600">suspended</span> : u.planStatus}</td>
                <td className="pr-3 tabular-nums text-xs">{(() => {
                  const s = spend.get(u.id) ?? 0; const cap = effectivePlan(u).aiBudgetUsd;
                  return <span className={u.role !== "admin" && s >= cap * 0.8 ? "text-high" : ""}>${s.toFixed(2)}{u.role === "admin" ? " · not metered" : ` / $${cap}`}</span>;
                })()}</td>
                <td className="muted pr-3 text-xs">{timeAgo(u.createdAt)}</td>
                <td className="muted pr-3 text-xs">{timeAgo(u.lastLoginAt)}</td>
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
