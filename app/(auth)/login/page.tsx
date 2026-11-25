import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/client";
import { login } from "../actions";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentUser()) redirect("/app");
  const { next } = await searchParams;
  return (
    <div>
      <h1 className="break-words text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-[28px]">Welcome back</h1>
      <p className="muted mt-1 text-sm">Log in to your SEOKaroAI account.</p>
      <ActionForm action={login} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <label className="block"><span className="mb-1 block text-sm font-semibold">Email</span><input name="email" type="email" required autoComplete="email" className="input" /></label>
        <label className="block">
          <span className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">Password <Link href="/forgot-password" className="font-normal text-brand-500">Forgot?</Link></span>
          <input name="password" type="password" required autoComplete="current-password" className="input" />
        </label>
        <SubmitButton className="btn btn-brand w-full justify-center py-3" pendingText="Logging in…">Log in</SubmitButton>
      </ActionForm>
      <p className="muted mt-6 text-center text-sm">New here? <Link href="/signup" className="font-semibold text-brand-500">Create a free account</Link></p>
    </div>
  );
}
