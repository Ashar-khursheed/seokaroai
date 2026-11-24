import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";
import { monthlyUsage } from "@/lib/usage";
import { COUNTRIES, LANGUAGES } from "@/lib/config";
import { ownedProject, userProjects } from "@/lib/queries";
import { rankTrackingAvailable } from "@/lib/engine/ranks";
import { ActionForm, SubmitButton } from "@/components/client";
import { startBattle } from "../../actions";

export const metadata = { title: "Keyword battle" };

export default async function NewBattle({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const plan = effectivePlan(user);
  const usage = await monthlyUsage(user.id);
  const projects = await userProjects(user.id);
  const project = sp.projectId ? await ownedProject(user, Number(sp.projectId)) : null;
  const left = plan.limits.battles - usage.keyword;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Keyword battle</h1>
      <p className="muted mt-1">We measure the top 3 Google results for your keyword and your page in exactly the same way, then list what to change, with the competitor evidence for each recommendation. Takes 5 to 15 minutes.</p>
      <div className="panel mt-6 p-6">
        <ActionForm action={startBattle}>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Keyword</span>
            <input name="keyword" required maxLength={200} defaultValue={sp.keyword ?? ""} className="input" placeholder="commercial coffee machine dubai" /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Your page URL</span>
            <input name="targetUrl" required defaultValue={sp.targetUrl ?? project?.url ?? ""} className="input" placeholder="https://www.example.com/coffee-machines" />
            <span className="muted mt-1 block text-xs">The exact page you want to rank for this keyword.</span></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-semibold">Country</span>
              <select name="country" defaultValue={project?.country ?? "United States"} className="input">{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Language</span>
              <select name="language" defaultValue={project?.language ?? "English"} className="input">{LANGUAGES.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          {projects.length > 0 && (
            <label className="block"><span className="mb-1 block text-sm font-semibold">Website (optional)</span>
              <select name="projectId" defaultValue={project?.id ?? ""} className="input"><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          )}
          <label className="block"><span className="mb-1 block text-sm font-semibold">Notes for the agent (optional)</span>
            <input name="notes" maxLength={2000} className="input" placeholder="e.g. we cannot change the product names" /></label>
          {!(await rankTrackingAvailable()) && (
            <p className="rounded-lg border border-high/30 bg-high/10 p-3 text-[12.5px] leading-relaxed">
              Live Google data is not connected yet, so the top 3 come from web search. They are close to Google but not an exact ranking, and the report says so.
              {user.role === "admin" && <> Connect DataForSEO in <a href="/admin/integrations" className="font-medium text-brand-500 underline">Admin → Integrations</a> to use the live Google top 10.</>}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton className="btn btn-primary" pendingText="Starting…">Start battle</SubmitButton>
            <span className="muted text-sm">{left > 0 ? `${left} of ${plan.limits.battles} left this month` : <>No battles left this month · <Link href="/app/billing" className="text-brand-500">upgrade</Link></>}</span>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
