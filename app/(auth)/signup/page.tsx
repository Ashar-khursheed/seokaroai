import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { ActionForm, SubmitButton } from "@/components/client";
import { signup } from "../actions";

export const metadata: Metadata = { title: "Create your free account", robots: { index: false } };

export default async function Signup({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  if (await currentUser()) redirect(plan ? `/app/billing?plan=${encodeURIComponent(plan)}` : "/app");
  const chosen = plan && plan !== "free" ? getPlan(plan) : null;
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Create your account</h1>
      <p className="muted mt-1 text-sm">{chosen ? `Start with the ${chosen.name} plan. You choose billing on the next step.` : "Free plan, no credit card. Upgrade anytime."}</p>
      <ActionForm action={signup} className="mt-6 space-y-4">
        <input type="hidden" name="plan" value={plan ?? ""} />
        <label className="block"><span className="mb-1 block text-sm font-semibold">Your name</span><input name="name" required maxLength={120} autoComplete="name" className="input" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Work email</span><input name="email" type="email" required autoComplete="email" className="input" /></label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Password</span>
          <input name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
          <span className="muted mt-1 block text-xs">At least 10 characters, with letters and a number.</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" required className="mt-1" />
          <span>I agree to the <Link href="/legal/terms" className="text-brand-500 underline">Terms</Link> and <Link href="/legal/privacy" className="text-brand-500 underline">Privacy Policy</Link>.</span>
        </label>
        <SubmitButton className="btn btn-brand w-full justify-center py-3" pendingText="Creating account…">Create account</SubmitButton>
      </ActionForm>
      <p className="muted mt-6 text-center text-sm">Already have an account? <Link href="/login" className="font-semibold text-brand-500">Log in</Link></p>
    </div>
  );
}
