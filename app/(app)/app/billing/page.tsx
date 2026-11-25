import { requireUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { effectivePlan, PAID_PLANS, PLANS, type Cycle } from "@/lib/plans";
import { aiAllowance, fmtReset, monthlyUsage } from "@/lib/usage";
import { paddleSettings } from "@/lib/integrations";
import { billingConfigured, priceIdFor, signedCustomData } from "@/lib/billing/paddle";
import { CheckoutButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { AllowanceMeter, Card, Meter, PageHeader } from "@/components/ui";
import { openBillingPortal } from "../actions";

export const metadata = { title: "Billing" };

export default async function Billing({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const plan = effectivePlan(user);
  const [usage, allowance] = await Promise.all([monthlyUsage(user.id), aiAllowance(user)]);
  const cycle: Cycle = sp.cycle === "yearly" ? "yearly" : "monthly";
  const [ready, paddle] = await Promise.all([billingConfigured(), paddleSettings()]);
  const priceIds = Object.fromEntries(await Promise.all(PAID_PLANS.map(async (c) => [c, await priceIdFor(c, cycle)] as const)));
  const hasSub = !!user.paddleSubscriptionId && ["active", "trialing", "past_due", "paused"].includes(user.planStatus);
  const customData = signedCustomData(user.id);

  return (
    <div className="space-y-8">
      <PageHeader title="Billing" subtitle="Plans, usage and invoices" />
      {sp.checkout === "success" && <Notice icon="CircleCheck" tone="ok">Payment received. Your plan updates within a minute (refresh if it still shows the old plan).</Notice>}
      {sp.portal === "unavailable" && <Notice icon="TriangleAlert" tone="warn">The billing portal is not available right now. Email {config.supportEmail} and we will help.</Notice>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Current plan" className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold tracking-tight">{plan.name}</div>
              <div className="muted mt-1 text-[14px]">
                {plan.code === "free" ? "Free forever" : `$${user.billingCycle === "yearly" ? `${plan.priceYearly}/year` : `${plan.priceMonthly}/month`}`}
                {user.planStatus !== "active" && plan.code !== "free" && <> · status <b>{user.planStatus}</b></>}
                {user.planRenewsAt && plan.code !== "free" && <> · {user.planStatus === "canceled" ? "ends" : "renews"} {user.planRenewsAt.toLocaleDateString()}</>}
              </div>
            </div>
            {hasSub && <form action={openBillingPortal} className="w-full sm:w-auto"><button className="btn w-full max-w-full whitespace-normal text-center sm:w-auto sm:whitespace-nowrap"><Icon name="CreditCard" size={15} className="shrink-0" />Manage card, invoices &amp; cancellation</button></form>}
          </div>
          {user.planStatus === "past_due" && <p className="mt-4 rounded-lg border border-crit/30 bg-crit/10 p-3 text-[14px]">Your last payment failed. Update your card in the portal to keep your plan.</p>}
        </Card>
        <Card title="Usage this month">
          <div className="space-y-3.5">
            <AllowanceMeter pct={allowance.pct} resets={fmtReset(allowance.resetsAt)} />
            <Meter label="Site audits" used={usage.quick} limit={plan.limits.quickAudits} />
            <Meter label="AI deep audits" used={usage.deep} limit={plan.limits.deepAudits} />
            <Meter label="Keyword battles" used={usage.keyword} limit={plan.limits.battles} />
            <Meter label="AI auto-fixes" used={usage.fix} limit={plan.limits.fixes} />
            <Meter label="Tracked keywords" used={usage.keywords} limit={plan.limits.keywords} />
          </div>
        </Card>
      </div>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{hasSub ? "Change plan" : "Upgrade"}</h2>
          <div className="inline-flex w-fit max-w-full rounded-xl border line p-1" style={{ background: "var(--panel)" }}>
            <a href="?cycle=monthly" className={`rounded-lg px-3 py-1.5 text-[13px] font-medium sm:px-4 ${cycle === "monthly" ? "bg-[var(--ink)] text-[var(--bg)]" : "muted"}`}>Monthly</a>
            <a href="?cycle=yearly" className={`rounded-lg px-3 py-1.5 text-[13px] font-medium sm:px-4 ${cycle === "yearly" ? "bg-[var(--ink)] text-[var(--bg)]" : "muted"}`}>Yearly · 2 months free</a>
          </div>
        </div>
        {!ready && <Notice icon="Clock" tone="warn">Online payments are being set up. To upgrade now, email {config.supportEmail}.</Notice>}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PAID_PLANS.map((c) => {
            const p = PLANS[c];
            const current = plan.code === c;
            const priceId = priceIds[c];
            return (
              <div key={c} className={`panel flex flex-col p-4 sm:p-6 ${sp.plan === c || p.popular ? "border-brand-500/60 shadow-[0_0_0_1px_var(--color-brand-500)]" : ""}`}>
                <div className="flex items-center justify-between"><span className="font-semibold">{p.name}</span>{p.popular && <span className="chip !py-0.5 text-brand-500">Popular</span>}</div>
                <div className="mt-3 text-4xl font-semibold tracking-tight">${cycle === "yearly" ? p.priceYearly : p.priceMonthly}<span className="muted text-sm font-normal">/{cycle === "yearly" ? "year" : "month"}</span></div>
                <ul className="mt-5 flex-1 space-y-2 text-[13.5px]">{p.highlights.map((h) => <li key={h} className="flex gap-2"><Icon name="Check" size={15} className="mt-0.5 shrink-0 text-low" />{h}</li>)}</ul>
                <div className="mt-6">
                  {current ? <span className="btn w-full" aria-disabled>Current plan</span>
                    : hasSub ? <form action={openBillingPortal}><button className="btn btn-primary w-full">Switch to {p.name}</button></form>
                    : ready && priceId ? <CheckoutButton priceId={priceId} email={user.email} customData={customData} env={paddle.env} token={paddle.clientToken} label={`Upgrade to ${p.name}`} className="btn btn-brand w-full" />
                    : <a className="btn w-full" href={`mailto:${config.supportEmail}?subject=${encodeURIComponent(`Upgrade to ${p.name}`)}`}>Contact us</a>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="muted mt-4 text-[12.5px]">Payments are processed by Paddle.com, our Merchant of Record, which handles invoices and sales tax. Cancel anytime; you keep your plan until the end of the paid period.</p>
      </section>
    </div>
  );
}

function Notice({ icon, tone, children }: { icon: string; tone: "ok" | "warn"; children: React.ReactNode }) {
  return <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-[14px] sm:items-center ${tone === "ok" ? "border-low/30 bg-low/10" : "border-high/30 bg-high/10"}`}><Icon name={icon} size={16} className={`mt-0.5 shrink-0 sm:mt-0 ${tone === "ok" ? "text-low" : "text-high"}`} /><span className="min-w-0 flex-1">{children}</span></div>;
}
