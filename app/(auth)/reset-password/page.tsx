import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/client";
import { resetPassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Link missing</h1>
        <p className="muted mt-2">Open the link from your email, or <Link href="/forgot-password" className="text-brand-500">ask for a new one</Link>.</p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Choose a new password</h1>
      <p className="muted mt-1 text-sm">You will be signed out on every other device.</p>
      <ActionForm action={resetPassword} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">New password</span>
          <input name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
          <span className="muted mt-1 block text-xs">At least 10 characters, with letters and a number.</span>
        </label>
        <SubmitButton className="btn btn-brand w-full justify-center py-3" pendingText="Saving…">Save password</SubmitButton>
      </ActionForm>
    </div>
  );
}
