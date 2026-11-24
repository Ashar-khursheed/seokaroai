import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";
import { monthlyUsage } from "@/lib/usage";
import { COUNTRIES, LANGUAGES } from "@/lib/config";
import { ActionForm, SubmitButton } from "@/components/client";
import { createProject } from "../../actions";

export const metadata = { title: "Add website" };

export default async function NewProject() {
  const user = await requireUser();
  const plan = effectivePlan(user);
  const usage = await monthlyUsage(user.id);
  const full = usage.projects >= plan.limits.projects;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Add a website</h1>
      <p className="muted mt-1 text-sm">We run a site audit straight away and start tracking your keywords.</p>
      {full ? (
        <div className="panel mt-6 p-6">
          <p>Your {plan.name} plan includes {plan.limits.projects} website{plan.limits.projects === 1 ? "" : "s"}, and you are using all of them.</p>
          <Link href="/app/billing" className="btn btn-primary mt-4">Upgrade for more websites</Link>
        </div>
      ) : (
        <div className="panel mt-6 p-6">
          <ActionForm action={createProject}>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Website URL</span>
              <input name="url" required className="input" placeholder="https://www.example.com" /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Name (optional)</span>
              <input name="name" maxLength={120} className="input" placeholder="My store" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-semibold">Main market</span>
                <select name="country" className="input" defaultValue="United States">{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="block"><span className="mb-1 block text-sm font-semibold">Language</span>
                <select name="language" className="input" defaultValue="English">{LANGUAGES.map((c) => <option key={c}>{c}</option>)}</select></label>
            </div>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Keywords to track (optional)</span>
              <textarea name="keywords" rows={4} className="input" placeholder={"one keyword per line\nbest running shoes\nrunning shoes for flat feet"} />
              <span className="muted mt-1 block text-xs">Up to {plan.limits.keywords} keywords on your plan. You can add more later.</span></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Competitors (optional)</span>
              <textarea name="competitors" rows={2} className="input" placeholder={"competitor1.com\ncompetitor2.com"} /></label>
            <SubmitButton className="btn btn-primary w-full justify-center py-3" pendingText="Checking the site…">Add website and start audit</SubmitButton>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
