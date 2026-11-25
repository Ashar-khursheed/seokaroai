import { config } from "@/lib/config";
import { integrations, mask, sourceOf, type Integrations } from "@/lib/integrations";
import { PADDLE_PERMISSIONS } from "@/lib/billing/paddle";
import { ActionForm, SubmitButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { clearValue, paddleCatalog, paddleTest, paddleWebhook, saveAiKeys, saveDataforseo, saveGoogle, savePaddle, saveSmtp } from "./actions";

export const metadata = { title: "Integrations" };

type Src = "saved" | "env" | "none";

export default async function IntegrationsPage() {
  const i = await integrations();
  const src = async (sec: keyof Integrations, f: string) => sourceOf(sec, f);
  const p = i.paddle;
  const priceKeys = ["starter_monthly", "starter_yearly", "pro_monthly", "pro_yearly", "agency_monthly", "agency_yearly"];
  const pricesSet = priceKeys.filter((k) => p.prices[k]).length;
  const paddleReady = !!(p.apiKey && p.clientToken && p.webhookSecret && pricesSet === 6);
  const publicUrl = /^https:\/\//.test(config.appUrl) && !/localhost|127\.0\.0\.1/.test(config.appUrl);

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader title="Integrations" subtitle="Keys are stored encrypted in the database. Empty fields keep the current value; values from .env are used when nothing is saved here." />

      {/* ---------------- Paddle ---------------- */}
      <Section icon="CreditCard" title="Payments · Paddle Billing" status={paddleReady ? "Ready to take payments" : "Not ready"} ok={paddleReady}
        help={<>Paddle is the Merchant of Record: it charges cards and PayPal, handles invoices and sales tax worldwide, and pays you out. Start in <b>sandbox</b> with test cards, then switch to <b>production</b> after Paddle approves your account and domain.</>}>
        <ol className="muted mb-6 grid gap-2 text-[13px] sm:grid-cols-2">
          <Step n={1} done={!!p.apiKey}>Paddle → Developer tools → Authentication → create an <b>API key</b> with these permissions: {PADDLE_PERMISSIONS.join(", ")}.</Step>
          <Step n={2} done={!!p.clientToken}>Same page → create a <b>client-side token</b> (starts with test_ or live_).</Step>
          <Step n={3} done={pricesSet === 6}>Save, then press <b>Create plans in Paddle</b> below: Starter, Pro and Agency with monthly and yearly prices are made for you.</Step>
          <Step n={4} done={!!p.webhookSecret}>On the live server (https), press <b>Create webhook</b>. Then set your website as the default payment link in Paddle → Checkout settings.</Step>
        </ol>
        <ActionForm action={savePaddle} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Environment">
              <select name="env" defaultValue={p.env} className="input"><option value="production">Production (real payments)</option><option value="sandbox">Sandbox (testing)</option></select>
            </Field>
            <Secret label="API key" name="apiKey" value={p.apiKey} source={await src("paddle", "apiKey")} section="paddle" placeholder="pdl_live_apikey_…" />
            <Secret label="Client-side token" name="clientToken" value={p.clientToken} source={await src("paddle", "clientToken")} section="paddle" placeholder="live_…" reveal />
            <Secret label="Webhook secret" name="webhookSecret" value={p.webhookSecret} source={await src("paddle", "webhookSecret")} section="paddle" placeholder="pdl_ntfset_… secret, or the ntfset_… ID" />
          </div>
          <details className="rounded-xl border line p-4">
            <summary className="cursor-pointer text-[13.5px] font-medium">Price IDs <span className="muted font-normal">· {pricesSet}/6 set (filled automatically by Create plans)</span></summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {priceKeys.map((k) => (
                <Field key={k} label={k.replace("_", " · ")}><input name={`price_${k}`} defaultValue={p.prices[k] ?? ""} placeholder="pri_…" className="input font-mono text-[13px]" /></Field>
              ))}
            </div>
          </details>
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Saving…">Save and test</SubmitButton>
        </ActionForm>
        <div className="mt-5 grid gap-3 border-t line pt-5 sm:grid-cols-3">
          <ActionForm action={paddleCatalog} className="space-y-2">
            <SubmitButton className="btn w-full" pendingText="Creating…"><Icon name="Layers" size={15} />Create plans in Paddle</SubmitButton>
            <p className="muted text-[12px]">Creates any missing products and prices from your plan list and saves their IDs.</p>
          </ActionForm>
          <ActionForm action={paddleWebhook} className="space-y-2">
            <SubmitButton className="btn w-full" pendingText="Creating…"><Icon name="Workflow" size={15} />Create webhook</SubmitButton>
            <p className="muted break-words text-[12px]">{publicUrl ? `Points Paddle at ${config.appUrl}/api/webhooks/paddle and stores the secret.` : `Needs the live https address. APP_URL is ${config.appUrl} right now.`}</p>
          </ActionForm>
          <ActionForm action={paddleTest} className="space-y-2">
            <SubmitButton className="btn w-full" pendingText="Testing…"><Icon name="RefreshCw" size={15} />Test connection</SubmitButton>
            <p className="muted text-[12px]">Checks the API key and lists what is still missing.</p>
          </ActionForm>
        </div>
      </Section>

      {/* ---------------- DataForSEO ---------------- */}
      <Section icon="TrendingUp" title="Live Google data · DataForSEO" status={i.dataforseo.login && i.dataforseo.password ? "Connected" : "Off: keyword battles use web search"} ok={!!(i.dataforseo.login && i.dataforseo.password)}
        help={<>Powers <b>rank tracking</b> (daily Google positions, top 100) and the <b>live Google top 10</b> in keyword battles for any country and language. Without it, battles fall back to web search and say so in the report. Pay-as-you-go; a rank check costs a fraction of a cent. Get the API login and password at app.dataforseo.com → API access.</>}>
        <ActionForm action={saveDataforseo} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Secret label="API login (email)" name="login" value={i.dataforseo.login} source={await src("dataforseo", "login")} section="dataforseo" placeholder="you@example.com" reveal />
            <Secret label="API password" name="password" value={i.dataforseo.password} source={await src("dataforseo", "password")} section="dataforseo" placeholder="API password (not your account password)" />
          </div>
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Saving…">Save and test</SubmitButton>
        </ActionForm>
      </Section>

      {/* ---------------- AI ---------------- */}
      <Section icon="BrainCircuit" title="AI models" status={i.ai.anthropicKey || i.ai.openaiKey ? "Configured" : "Off: AI runs fail"} ok={!!(i.ai.anthropicKey || i.ai.openaiKey)}
        help={<>Deep audits, keyword battles and auto-fix use the provider chosen in <a className="text-brand-500 underline" href="/admin/settings">Settings</a>. Every run has a spend cap per plan.</>}>
        <ActionForm action={saveAiKeys} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Secret label="Anthropic API key" name="anthropicKey" value={i.ai.anthropicKey} source={await src("ai", "anthropicKey")} section="ai" placeholder="sk-ant-…" />
            <Secret label="OpenAI API key" name="openaiKey" value={i.ai.openaiKey} source={await src("ai", "openaiKey")} section="ai" placeholder="sk-…" />
          </div>
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Saving…">Save</SubmitButton>
        </ActionForm>
      </Section>

      {/* ---------------- SMTP ---------------- */}
      <Section icon="Mail" title="Email · SMTP" status={i.smtp.host ? `Sending via ${i.smtp.host}` : "Off: emails saved to data/outbox"} ok={!!i.smtp.host}
        help={<>Confirmation, password reset, report-ready, ranking alerts and the weekly report. Use a transactional provider (Amazon SES, Postmark, Brevo, Resend) and add SPF and DKIM for seokaroai.com.</>}>
        <ActionForm action={saveSmtp} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Host" className="sm:col-span-2"><input name="host" defaultValue={i.smtp.host} placeholder="smtp.example.com" className="input" /></Field>
            <Field label="Port"><input name="port" defaultValue={String(i.smtp.port)} className="input" /></Field>
            <Field label="Username"><input name="user" defaultValue={i.smtp.user} autoComplete="off" className="input" /></Field>
            <Secret label="Password" name="pass" value={i.smtp.pass} source={await src("smtp", "pass")} section="smtp" />
            <Field label="From"><input name="from" defaultValue={i.smtp.from} className="input" /></Field>
          </div>
          <label className="flex items-center gap-2 text-[13.5px]"><input type="checkbox" name="secure" defaultChecked={i.smtp.secure} className="accent-[#1f86ff]" />Use TLS from the start (port 465)</label>
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Saving…">Save and test</SubmitButton>
        </ActionForm>
      </Section>

      {/* ---------------- Google ---------------- */}
      <Section icon="Gauge" title="Google PageSpeed" status={i.google.apiKey ? "Connected" : "Off: performance not measured"} ok={!!i.google.apiKey}
        help={<>Adds Lighthouse and Core Web Vitals scores to site audits. Google Cloud console → enable PageSpeed Insights API → create an API key.</>}>
        <ActionForm action={saveGoogle} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1"><Secret label="API key" name="apiKey" value={i.google.apiKey} source={await src("google", "apiKey")} section="google" placeholder="AIza…" /></div>
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Saving…">Save</SubmitButton>
        </ActionForm>
      </Section>
    </div>
  );
}

function Section({ icon, title, status, ok, help, children }: { icon: string; title: string; status: string; ok: boolean; help: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b line px-4 py-4 sm:px-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border line text-brand-500"><Icon name={icon} size={17} /></span>
        <h2 className="min-w-0 flex-1 font-semibold">{title}</h2>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset ${ok ? "bg-low/10 text-low ring-low/30" : "bg-[var(--panel2)] muted ring-[var(--line)]"}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
        </span>
      </div>
      <div className="px-4 py-5 sm:px-6">
        <p className="muted mb-5 text-[13.5px] leading-relaxed">{help}</p>
        {children}
      </div>
    </section>
  );
}

function Step({ n, done, children }: { n: number; done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${done ? "bg-low text-white" : "border line"}`}>{done ? <Icon name="Check" size={12} /> : n}</span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-[13px] font-medium">{label}</span>{children}</label>;
}

function Secret({ label, name, value, source, section, placeholder, reveal = false }: { label: string; name: string; value: string; source: Src; section: string; placeholder?: string; reveal?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className="font-medium">{label}</span>
        {source !== "none" && (
          <span className="muted flex items-center gap-2 text-[11.5px]">
            {source === "env" ? "from .env" : "saved"}
            {source === "saved" && <button formAction={clearValue.bind(null, `${section}:${name}`)} className="text-crit hover:underline" formNoValidate>remove</button>}
          </span>
        )}
      </div>
      <input name={name} type={reveal ? "text" : "password"} autoComplete="off" placeholder={value ? (reveal ? value : mask(value)) : placeholder} className="input font-mono text-[13px]" />
    </div>
  );
}
