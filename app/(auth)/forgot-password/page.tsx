import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/client";
import { forgotPassword } from "../actions";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function Forgot() {
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Forgot your password?</h1>
      <p className="muted mt-1 text-sm">Enter your email and we will send you a reset link.</p>
      <ActionForm action={forgotPassword} className="mt-6 space-y-4">
        <label className="block"><span className="mb-1 block text-sm font-semibold">Email</span><input name="email" type="email" required autoComplete="email" className="input" /></label>
        <SubmitButton className="btn btn-brand w-full justify-center py-3" pendingText="Sending…">Send reset link</SubmitButton>
      </ActionForm>
      <p className="muted mt-6 text-center text-sm"><Link href="/login" className="text-brand-500">Back to log in</Link></p>
    </div>
  );
}
