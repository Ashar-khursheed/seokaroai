import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { and, eq } from "drizzle-orm";
import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { db, parseJson, schema } from "@/lib/db";
import { config } from "@/lib/config";
import { getAiSettings, providerReady } from "@/lib/ai/settings";
import { runOpenAIAgent, type AgentEvent } from "@/lib/ai/openai-agent";
import { priceFor } from "@/lib/ai/pricing";

/** Hard ceiling on what any single AI run may spend, whatever the plan or input says. */
export const MAX_RUN_USD = 3;

const PHASE1_WRAP = `BUDGET NOTICE: phase 1 has used most of its share. Stop running tools. Using what you already
have, write any findings/*.md and findings/competitors.md that are still missing (mark gaps "not measured"),
then reply with a one-line summary. Only write_file calls are allowed now.`;
import { makeGuard } from "@/lib/guard";
import { auditPrompt, keywordPrompt, auditPhases, keywordPhases, type Phases } from "@/lib/prompts";
import { liveTop10 } from "@/lib/engine/ranks";
import { runQuickAudit, summarizeQuick } from "@/lib/engine/quick";
import { sendMail } from "@/lib/email";
import { runDoneEmail } from "@/lib/email/templates";
import { effectivePlan } from "@/lib/plans";
import { readJson, runFolder, type AuditInput, type KeywordInput } from "@/lib/files";
import { aiAllowance, type RunKind } from "@/lib/usage";
import { budgetAlerts } from "@/lib/budget-alerts";
import type { Run } from "@/lib/db/schema";

export interface RunEvent {
  t: number;
  kind: "info" | "agent" | "tool" | "text" | "error" | "done";
  agent?: string;
  text: string;
}

interface Live { id: string; emitter: EventEmitter; abort: AbortController }
const g = globalThis as unknown as { __skLive?: Map<string, Live> };
const live = (g.__skLive ??= new Map());

export const getLive = (id: string) => live.get(id);

function slug(s: string, max = 40) {
  return s.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || "run";
}

function stamp() {
  return new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) + Math.random().toString(36).slice(2, 6);
}

export function emit(id: string, ev: Omit<RunEvent, "t">) {
  const full: RunEvent = { t: Date.now(), ...ev };
  try { fs.appendFileSync(path.join(runFolder(id), "events.jsonl"), JSON.stringify(full) + "\n"); } catch { /* ignore */ }
  live.get(id)?.emitter.emit("event", full);
}

/** Insert a queued run. The worker picks it up. */
export async function createRun(o: {
  userId: number; projectId: number | null; kind: RunKind; trigger?: "manual" | "schedule"; input: AuditInput | KeywordInput | import("@/lib/fixes").FixInput; title: string;
  /** Runs after the run folder exists and before the run is queued (e.g. to write uploaded files). */
  beforeQueue?: (dir: string) => void | Promise<void>;
}): Promise<string> {
  const prefix = o.kind === "keyword" ? `kw-${slug((o.input as KeywordInput).keyword)}` : o.kind === "fix" ? `fix-p${(o.input as { projectId: number }).projectId}` : `${o.kind}-${slug((o.input as AuditInput).url)}`;
  const id = `${prefix}-${stamp()}`.slice(0, 100);
  fs.mkdirSync(runFolder(id), { recursive: true });
  if (o.beforeQueue) await o.beforeQueue(runFolder(id));
  await db().insert(schema.runs).values({
    id, userId: o.userId, projectId: o.projectId, kind: o.kind, triggerType: o.trigger ?? "manual", status: "queued",
    title: o.title.slice(0, 300), input: JSON.stringify(o.input), createdAt: new Date(),
  });
  emit(id, { kind: "info", text: "Queued" });
  return id;
}

export async function cancelRun(id: string): Promise<boolean> {
  const l = live.get(id);
  if (l) { l.abort.abort(); return true; }
  const r = await db().update(schema.runs).set({ status: "cancelled", finishedAt: new Date(), error: "Cancelled" })
    .where(and(eq(schema.runs.id, id), eq(schema.runs.status, "queued")));
  return (r[0] as { affectedRows?: number }).affectedRows === 1;
}

// ------------------------------------------------------------------ execution
export async function executeRun(run: Run, workerId: string) {
  const l: Live = { id: run.id, emitter: new EventEmitter(), abort: new AbortController() };
  l.emitter.setMaxListeners(50);
  live.set(run.id, l);
  const beat = setInterval(() => {
    void db().update(schema.runs).set({ heartbeatAt: new Date() }).where(eq(schema.runs.id, run.id)).catch(() => {});
  }, 30_000);
  emit(run.id, { kind: "info", text: `Started on ${workerId}` });

  let status: "done" | "failed" | "cancelled" = "done";
  let error: string | null = null;
  let score: number | null = null;
  let summary: Record<string, unknown> = {};
  let cost: number | null = null;
  let turns: number | null = null;
  try {
    const dir = runFolder(run.id);
    if (run.kind === "quick") {
      const input = parseJson<AuditInput>(run.input, { url: "" } as AuditInput);
      const report = await runQuickAudit(input.url, dir, input.maxPages ?? 10, (m) => emit(run.id, { kind: "tool", text: m }));
      summary = summarizeQuick(report);
      score = report.score;
      if (report.pages.every((p) => p.score == null)) throw new Error("No page could be fetched. Check that the site is online and not blocking bots.");
    } else if (run.kind === "fix") {
      const fx = await import("@/lib/fixes");
      const { isCms } = await import("@/lib/connectors");
      const input = parseJson<import("@/lib/fixes").FixInput>(run.input, {} as never);
      const say = (text: string, kind: "info" | "tool" | "text" | "error" = "info") => emit(run.id, { kind, text });
      const ai = await getAiSettings();
      if (!(await providerReady(ai.provider))) throw new Error(`AI is not configured on this server (${ai.provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"} missing).`);
      const [conn] = await db().select().from(schema.connectors).where(eq(schema.connectors.id, input.connectorId)).limit(1);
      if (!conn) throw new Error("The connector was deleted.");
      if (isCms(conn.kind)) {
        const r = await fx.proposeCmsFixes(run, input, say);
        summary = { connector: conn.kind, proposed: r.proposed };
      } else {
        await fx.prepareCodeWorkspace(run, input, say);
        const r = await runAgent(run, dir, l.abort);
        cost = r.cost; turns = r.turns;
        if (r.error) { status = l.abort.signal.aborted ? "cancelled" : "failed"; error = r.error; }
        const n = await fx.collectCodeChanges(run, conn.id, say);
        summary = { connector: conn.kind, proposed: n };
      }
    } else {
      const r = await runAgent(run, dir, l.abort);
      cost = r.cost; turns = r.turns;
      if (r.error) { status = l.abort.signal.aborted ? "cancelled" : "failed"; error = r.error; }
      const s = run.kind === "deep" ? summarizeDeep(dir) : summarizeKeyword(dir);
      summary = s.summary; score = s.score;
      if (status === "done" && score == null && run.kind === "deep") { status = "failed"; error = "The audit finished without audit-data.json."; }
    }
  } catch (e) {
    status = l.abort.signal.aborted ? "cancelled" : "failed";
    error = String((e as Error)?.message ?? e).slice(0, 1000);
  } finally {
    clearInterval(beat);
  }

  await db().update(schema.runs).set({
    status, error, score, summary: JSON.stringify(summary), costUsd: cost, turns, finishedAt: new Date(), heartbeatAt: new Date(),
  }).where(eq(schema.runs.id, run.id));
  emit(run.id, { kind: status === "done" ? "done" : "error", text: status === "done" ? `Finished${cost != null ? ` · $${cost.toFixed(2)}` : ""}` : `${status}: ${error ?? ""}` });
  l.emitter.emit("end");
  live.delete(run.id);
  await afterRun(run, status, score, summary).catch((e) => console.error("[runs] afterRun", e));
  if (cost) await budgetAlerts(run.userId).catch((e) => console.error("[runs] budgetAlerts", e));
}

async function afterRun(run: Run, status: string, score: number | null, summary: Record<string, unknown>) {
  let prevScore: number | null = null;
  if (run.projectId && status === "done" && score != null && run.kind !== "keyword") {
    const [p] = await db().select().from(schema.projects).where(eq(schema.projects.id, run.projectId)).limit(1);
    prevScore = p?.lastScore ?? null;
    await db().update(schema.projects).set({ lastScore: score, lastAuditAt: new Date() }).where(eq(schema.projects.id, run.projectId));
  }
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, run.userId)).limit(1);
  if (!user || !user.emailRuns) return;
  // Scheduled audits only email when something got worse; the weekly digest covers the rest.
  if (run.triggerType === "schedule" && status === "done" && !(prevScore != null && score != null && score <= prevScore - 5)) return;
  const top = ((summary.top_issues as { title: string }[]) ?? []).map((i) => i.title);
  const mail = runDoneEmail({ title: run.title, kind: run.kind, score, status, url: `${config.appUrl}/app/runs/${encodeURIComponent(run.id)}`, topIssues: top });
  await sendMail({ to: user.email, userId: user.id, kind: "run_done", ...mail });
}

function summarizeDeep(dir: string) {
  const d = readJson<any>(path.join(dir, "audit-data.json"));
  if (!d) return { score: null, summary: {} };
  const top = (d.summary?.top_findings ?? []).map((f: any) => (typeof f === "string" ? { severity: "", title: f } : { severity: f.severity ?? "", title: f.title ?? f.issue ?? "" }));
  return {
    score: typeof d.summary?.health_score === "number" ? Math.round(d.summary.health_score) : null,
    summary: {
      business_type: d.summary?.business_type ?? "",
      categories: (d.categories ?? []).map((c: any) => ({ label: c.name, score: c.score ?? null })),
      top_issues: top.slice(0, 6),
      competitors: (d.competitors ?? []).map((c: any) => c.domain ?? c.name).filter(Boolean).slice(0, 6),
    },
  };
}

function summarizeKeyword(dir: string) {
  const c = readJson<any>(path.join(dir, "comparison.json"));
  const r = readJson<any>(path.join(dir, "recommendations.json"));
  const recs = Array.isArray(r) ? r : r?.recommendations ?? [];
  return {
    score: typeof c?.score === "number" ? Math.round(c.score) : null,
    summary: {
      our_position: c?.our_position ?? null,
      intent_match: c?.intent?.match ?? null,
      top_issues: recs.slice(0, 6).map((x: any) => ({ severity: x.priority ?? "", title: x.title ?? "" })),
      recommendations: recs.length,
    },
  };
}

// ------------------------------------------------------------------ Agent SDK
function describeTool(name: string, input: Record<string, unknown>): string {
  const s = (v: unknown, n = 140) => String(v ?? "").replace(/\s+/g, " ").slice(0, n);
  switch (name) {
    case "Agent": case "Task": return `Started agent ${s(input.subagent_type, 40) || "general"}: ${s(input.description, 100)}`;
    case "Bash": {
      const cmd = s(input.command, 400);
      const m = cmd.match(/claude-seo"?\s+run\s+([\w.-]+\.py)(.*)/);
      return m ? `Tool ${m[1]}${s(m[2], 100)}` : `$ ${s(cmd, 140)}`;
    }
    case "WebFetch": return `Fetch ${s(input.url)}`;
    case "WebSearch": return `Search “${s(input.query, 100)}”`;
    case "Write": case "Edit": return `Wrote ${s(input.file_path).split(/[\\/]/).slice(-2).join("/")}`;
    case "Skill": return `Skill ${s(input.skill ?? input.name, 60)}`;
    case "Read": return `Read ${s(input.file_path).split(/[\\/]/).slice(-2).join("/")}`;
    default: return name;
  }
}

async function runAgent(run: Run, dir: string, abort: AbortController): Promise<{ cost: number | null; turns: number | null; error: string | null }> {
  const ai = await getAiSettings();
  if (!(await providerReady(ai.provider))) return { cost: null, turns: null, error: `AI runs are not configured on this server (${ai.provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"} missing).` };
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, run.userId)).limit(1);
  const plan = effectivePlan(user!);
  // The monthly allowance caps every run too (admins are not metered against a plan).
  const left = user!.role === "admin" ? MAX_RUN_USD : (await aiAllowance(user!)).remainingUsd;
  if (left <= 0.05) return { cost: null, turns: null, error: "This month's AI allowance is used up. It resets on the 1st." };
  const exec = (prompt: string, model: string, budget: number, phases?: Phases) => {
    if (left < budget) emit(run.id, { kind: "info", text: `Run budget lowered to the allowance left this month` });
    return agentExec(run.id, dir, prompt, model, Math.min(budget, left), abort, phases);
  };
  if (run.kind === "fix") {
    const { codeFixPrompt } = await import("@/lib/fixes");
    const prompt = await codeFixPrompt(run, dir);
    return exec(prompt, ai.claudeModel, plan.fixBudgetUsd);
  }
  let prompt: string;
  let model: string;
  let budget: number;
  let phases: Phases;
  if (run.kind === "keyword") {
    const k = parseJson<KeywordInput>(run.input, {} as KeywordInput);
    model = k.model || ai.claudeModel;
    budget = Math.min(k.budgetUsd || plan.battleBudgetUsd, plan.battleBudgetUsd || 1);
    fs.writeFileSync(path.join(dir, "keyword.json"), JSON.stringify(k, null, 2));
    const serp = await liveTop10(k.keyword, k.country, k.language);
    if (serp) {
      fs.writeFileSync(path.join(dir, "serp.json"), JSON.stringify({ source: "dataforseo", ...serp }, null, 2));
      emit(run.id, { kind: "info", text: `Live Google top 10 fetched (${serp.results.length} results)` });
    } else {
      emit(run.id, { kind: "info", text: "Live SERP not available: the agent uses web search (directional)" });
    }
    prompt = keywordPrompt(k, !!serp);
    phases = keywordPhases(k, !!serp);
  } else {
    const a = parseJson<AuditInput>(run.input, {} as AuditInput);
    model = a.model || ai.claudeModel;
    budget = Math.min(a.budgetUsd || plan.deepBudgetUsd, plan.deepBudgetUsd || 3);
    prompt = auditPrompt(a);
    phases = auditPhases(a);
  }
  return exec(prompt, model, budget, phases);
}

/** Run an agent prompt in `dir` with the platform provider (Claude Agent SDK or OpenAI agent loop). */
export async function agentExec(runId: string, dir: string, prompt: string, claudeModel: string, budget: number, abort: AbortController, phases?: Phases): Promise<{ cost: number | null; turns: number | null; error: string | null }> {
  const ai = await getAiSettings();
  fs.writeFileSync(path.join(dir, "prompt.md"), prompt);
  if (ai.provider === "openai") {
    const cap = Math.min(budget, MAX_RUN_USD);
    const onEvent = (e: AgentEvent) => emit(runId, { kind: e.kind, text: e.text });
    const step = async (model: string, p: string, usd: number, maxTurns: number, wrapUp?: string) => {
      const r = await runOpenAIAgent({
        prompt: p, dir, model, signal: abort.signal, budgetUsd: usd, maxTurns, wrapUp, onEvent,
        price: priceFor(model, model === ai.openaiModel ? ai.openaiPrice : null),
      });
      emit(runId, { kind: "info", text: `${model}: ${r.usage.input.toLocaleString()} tokens in (${r.usage.cached.toLocaleString()} cached) / ${r.usage.output.toLocaleString()} out · $${r.costUsd.toFixed(2)}` });
      return r;
    };
    const strategyModel = ai.openaiStrategyModel?.trim();
    if (phases && strategyModel && strategyModel !== ai.openaiModel) {
      // Hybrid: the cheap model collects (tool-heavy), the strong model writes strategy from the files.
      emit(runId, { kind: "info", text: `Phase 1 · ${ai.openaiModel} runs the checks and collects data` });
      fs.writeFileSync(path.join(dir, "prompt-phase1.md"), phases.collect);
      const a = await step(ai.openaiModel, phases.collect, cap * 0.45, 60, PHASE1_WRAP);
      if (abort.signal.aborted) return { cost: a.costUsd, turns: a.turns, error: "Cancelled" };
      emit(runId, { kind: "info", text: `Phase 2 · ${strategyModel} writes the competitor analysis, strategy and reports` });
      fs.writeFileSync(path.join(dir, "prompt-phase2.md"), phases.strategy);
      const b = await step(strategyModel, phases.strategy, Math.max(0.3, cap - a.costUsd), 40);
      return { cost: a.costUsd + b.costUsd, turns: a.turns + b.turns, error: b.error };
    }
    emit(runId, { kind: "info", text: `OpenAI agent · ${ai.openaiModel}` });
    const r = await step(ai.openaiModel, prompt, cap, 70);
    return { cost: r.costUsd, turns: r.turns, error: r.error };
  }
  const run = { id: runId };
  const model = claudeModel;

  const labels = new Map<string, string>();
  let cost: number | null = null;
  let turns: number | null = null;
  let error: string | null = null;
  try {
    const q = query({
      prompt,
      options: {
        cwd: dir, model, maxBudgetUsd: Math.min(budget, MAX_RUN_USD), abortController: abort,
        settingSources: ["user"], permissionMode: "default", canUseTool: makeGuard(dir), disallowedTools: ["PowerShell"],
        env: { ...process.env, ANTHROPIC_API_KEY: await (await import("@/lib/integrations")).anthropicKey() },
        systemPrompt: { type: "preset", preset: "claude_code", append: "You run unattended inside SEOKaroAI for a paying customer. There is no human to answer questions: decide sensibly, note assumptions in CONTEXT.md or REPORT.md, and keep working until the requested files exist." },
      },
    });
    for await (const msg of q as AsyncIterable<SDKMessage>) {
      const m = msg as Record<string, any>;
      if (m.type === "system" && m.subtype === "init") emit(run.id, { kind: "info", text: `Agent team ready · ${m.model}` });
      else if (m.type === "system" && m.subtype === "task_started") emit(run.id, { kind: "agent", agent: m.subagent_type, text: `Agent running: ${m.description}` });
      else if (m.type === "assistant") {
        const parent: string | null = m.parent_tool_use_id ?? null;
        const agent = parent ? labels.get(parent) ?? "agent" : undefined;
        for (const b of m.message?.content ?? []) {
          if (b.type === "tool_use") {
            if (b.name === "Agent" || b.name === "Task") {
              labels.set(b.id, String(b.input?.subagent_type ?? "agent"));
              emit(run.id, { kind: "agent", agent: String(b.input?.subagent_type ?? "agent"), text: describeTool(b.name, b.input ?? {}) });
            } else emit(run.id, { kind: "tool", agent, text: describeTool(b.name, b.input ?? {}) });
          } else if (b.type === "text" && !parent && b.text?.trim()) emit(run.id, { kind: "text", text: b.text.trim().slice(0, 1200) });
        }
      } else if (m.type === "user" && !m.parent_tool_use_id) {
        // the orchestrator received a sub-agent's result: that agent is finished
        for (const b of m.message?.content ?? []) {
          if (b?.type === "tool_result" && labels.has(b.tool_use_id)) emit(run.id, { kind: "agent", agent: labels.get(b.tool_use_id), text: "Agent finished" });
        }
      } else if (m.type === "result") {
        cost = m.total_cost_usd ?? null;
        turns = m.num_turns ?? null;
        if (m.subtype !== "success") error = m.subtype === "error_max_budget_usd" ? `Stopped at the $${budget} spend cap for this run. Partial results are kept.` : String(m.subtype);
      }
    }
  } catch (e) {
    error = abort.signal.aborted ? "Cancelled" : String((e as Error)?.message ?? e).slice(0, 1000);
  }
  return { cost, turns, error };
}
