import { getAiSettings, providerReady, CLAUDE_MODELS } from "@/lib/ai/settings";
import { localFoldersAllowed } from "@/lib/connectors/folder";
import { ActionForm, SubmitButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { Card, PageHeader } from "@/components/ui";
import { saveAi } from "../actions";
import { priceFor } from "@/lib/ai/pricing";
import { MAX_RUN_USD } from "@/lib/runs";

export const metadata = { title: "Settings" };

export default async function AdminSettings() {
  const ai = await getAiSettings();
  const price = priceFor(ai.openaiModel);
  const ready = { claude: await providerReady("claude"), openai: await providerReady("openai") };
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Platform settings" subtitle="These apply to every customer's AI runs." />
      <Card title="AI provider">
        <ActionForm action={saveAi} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["claude", "Anthropic Claude", "Agent SDK with the full specialist sub-agent team. Best depth and parallel audits.", ready.claude, "ANTHROPIC_API_KEY"],
              ["openai", "OpenAI (ChatGPT)", "Single tool-using agent on the Responses API. Same tools and outputs, done one after another.", ready.openai, "OPENAI_API_KEY"],
            ] as const).map(([v, label, d, ok, env]) => (
              <label key={v} className="panel flex cursor-pointer gap-3 p-4 has-[:checked]:border-brand-500 has-[:checked]:shadow-[0_0_0_1px_var(--color-brand-500)]">
                <input type="radio" name="provider" value={v} defaultChecked={ai.provider === v} className="mt-1 accent-[#1f86ff]" />
                <span className="min-w-0 break-words">
                  <span className="block font-medium">{label}</span>
                  <span className="muted mt-1 block text-[13px] leading-snug">{d}</span>
                  <span className={`mt-2 flex items-center gap-1.5 text-[12px] ${ok ? "text-low" : "text-crit"}`}><Icon name={ok ? "CircleCheck" : "CircleAlert"} size={13} className="shrink-0" />{ok ? `${env} set` : `${env} missing in .env.local`}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[13px] font-medium">Claude model</span>
              <select name="claudeModel" defaultValue={ai.claudeModel} className="input">{CLAUDE_MODELS.map((m) => <option key={m}>{m}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-[13px] font-medium">OpenAI model · data collection</span>
              <input name="openaiModel" defaultValue={ai.openaiModel} className="input" placeholder="gpt-5-mini" />
              <span className="muted mt-1 block text-[12px]">Runs the checks, crawls and searches, where most tokens go. gpt-5-mini is about 5× cheaper than gpt-5.</span></label>
            <label className="block sm:col-start-2"><span className="mb-1.5 block text-[13px] font-medium">OpenAI model · strategy and report</span>
              <input name="openaiStrategyModel" defaultValue={ai.openaiStrategyModel ?? ""} className="input" placeholder="gpt-5 (empty = use one model)" />
              <span className="muted mt-1 block text-[12px]">Reads the collected findings in a fresh conversation and writes the competitor gaps, plans and reports for deep audits and keyword battles.</span></label>
          </div>
          <div>
            <p className="mb-2 break-words text-[13px] font-medium">OpenAI price, USD per 1M tokens <span className="muted font-normal">(used to meter the spend cap; blank uses {price.input}/{price.cachedInput}/{price.output} for {ai.openaiModel})</span></p>
            <div className="grid gap-3 sm:grid-cols-3">
              {([["priceInput", "Input", ai.openaiPrice?.input], ["priceCached", "Cached input", ai.openaiPrice?.cachedInput], ["priceOutput", "Output", ai.openaiPrice?.output]] as const).map(([n, l, v]) => (
                <label key={n} className="block"><span className="muted mb-1 block text-[12px]">{l}</span>
                  <input name={n} type="number" step="0.001" min="0" defaultValue={v ?? ""} className="input" /></label>
              ))}
            </div>
            <p className="muted mt-2 text-[12px]">Every AI run stops at its plan&apos;s spend cap and never above ${MAX_RUN_USD}. Deep audit: Starter $2.50, Pro/Agency $3. Keyword battle $1. Code fix $0.50 to $1.</p>
          </div>
          <SubmitButton className="btn btn-primary w-full sm:w-auto" pendingText="Saving…">Save AI settings</SubmitButton>
        </ActionForm>
      </Card>
      <Card title="Connectors">
        <ul className="space-y-2 text-[14px]">
          <li className="flex gap-2"><Icon name="CircleCheck" size={16} className="mt-0.5 shrink-0 text-low" /><span className="min-w-0 break-words">WordPress, Shopify and GitHub connectors are available to every customer.</span></li>
          <li className="flex gap-2"><Icon name={localFoldersAllowed() ? "CircleCheck" : "CircleAlert"} size={16} className={localFoldersAllowed() ? "mt-0.5 shrink-0 text-low" : "mt-0.5 shrink-0 muted"} />
            <span className="min-w-0 break-words">Server folders are {localFoldersAllowed() ? "enabled (admins only)" : "disabled"}. Set ALLOW_LOCAL_FOLDERS=1 on a self-hosted install to let admins connect a folder on this server.</span></li>
          <li className="flex gap-2"><Icon name="Lock" size={16} className="mt-0.5 shrink-0 muted" /><span className="min-w-0 break-words">Connector secrets are encrypted with ENCRYPTION_KEY (falls back to SESSION_SECRET). Changing it means reconnecting.</span></li>
        </ul>
      </Card>
    </div>
  );
}
