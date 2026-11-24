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
    <section className="mx-auto grid max-w-5xl gap-10 px-4 pt-16 sm:px-6 md:grid-cols-[1fr_1.2fr]">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">Talk to us</h1>
        <p className="muted mt-4 text-lg leading-relaxed">Questions about plans, agency pricing, or an audit that did not look right? We read every message.</p>
        <p className="mt-6">Email: <a className="font-semibold text-brand-500" href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a></p>
      </div>
      <div className="panel p-6">
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
