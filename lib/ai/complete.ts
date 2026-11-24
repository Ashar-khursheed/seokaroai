import { getAiSettings, type Provider } from "./settings";

/**
 * One-shot text completion with the platform's AI provider (used for fix plans and small tasks).
 * Returns the model text; with json=true the caller parses it with extractJson().
 */
export async function complete(o: { system: string; prompt: string; json?: boolean; maxTokens?: number; provider?: Provider }): Promise<{ text: string; provider: Provider; model: string }> {
  const s = await getAiSettings();
  const provider = o.provider ?? s.provider;
  const max = o.maxTokens ?? 8000;
  if (provider === "openai") {
    const key = await (await import("@/lib/integrations")).openaiKey();
    if (!key) throw new Error("OPENAI_API_KEY is not set.");
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: s.openaiModel, instructions: o.system, input: o.prompt, max_output_tokens: max,
        ...(o.json ? { text: { format: { type: "json_object" } } } : {}),
      }),
      signal: AbortSignal.timeout(240_000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`OpenAI: ${data?.error?.message ?? res.status}`);
    return { text: openaiText(data), provider, model: s.openaiModel };
  }
  const key = await (await import("@/lib/integrations")).anthropicKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: s.claudeModel, max_tokens: max, system: o.system,
      messages: [{ role: "user", content: o.json ? `${o.prompt}\n\nReply with one JSON document only.` : o.prompt }],
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Claude: ${data?.error?.message ?? res.status}`);
  return { text: (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join(""), provider, model: s.claudeModel };
}

export function openaiText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;
  return (data?.output ?? [])
    .filter((i: any) => i.type === "message")
    .flatMap((i: any) => i.content ?? [])
    .filter((c: any) => c.type === "output_text")
    .map((c: any) => c.text)
    .join("");
}

/** First JSON object/array in a model reply (tolerates ```json fences and prose around it). */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  for (const [open, close] of [["{", "}"], ["[", "]"]] as const) {
    const a = body.indexOf(open);
    const b = body.lastIndexOf(close);
    if (a >= 0 && b > a) {
      try { return JSON.parse(body.slice(a, b + 1)) as T; } catch { /* try next */ }
    }
  }
  return null;
}
