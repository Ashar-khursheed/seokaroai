import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/client";
import { config } from "@/lib/config";
import { sendContact } from "./actions";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about SEOKaroAI, plans for agencies, or a problem with an audit? Send us a message.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <section className="mx-auto grid max-w-5xl gap-8 px-4 pt-10 sm:gap-10 sm:px-6 sm:pt-16 md:grid-cols-[1fr_1.2fr]">
      <div className="min-w-0">
        <h1 className="break-words text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">Talk to us</h1>
        <p className="muted mt-4 text-base leading-relaxed sm:text-lg">Questions about plans, agency pricing, or an audit that did not look right? We read every message.</p>
        <p className="mt-6 break-words">Email: <a className="break-all font-semibold text-brand-500" href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a></p>
      </div>
      <div className="panel min-w-0 p-5 sm:p-6">
        <ActionForm action={sendContact} resetOnOk>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Name</span><input name="name" required maxLength={120} className="input" autoComplete="name" /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Email</span><input name="email" type="email" required className="input" autoComplete="email" /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Company (optional)</span><input name="company" maxLength={160} className="input" autoComplete="organization" /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Message</span><textarea name="message" required minLength={10} rows={6} className="input" /></label>
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <SubmitButton className="btn btn-primary w-full justify-center" pendingText="Sending…">Send message</SubmitButton>
        </ActionForm>
      </div>
    </section>
  );
}
