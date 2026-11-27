import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { effectivePlan } from "@/lib/plans";
import { connectorCreds } from "@/lib/connectors";
import {
  analyzePrFiles,
  formatPrComment,
  gatekeeperSecret,
  monthlyGatekeeperCount,
  recordGatekeeperLog,
  verifyGitHubSignature,
} from "@/lib/pr-gatekeeper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GH_API = "https://api.github.com";

async function ghFetch(token: string, urlPath: string, init: RequestInit = {}) {
  const res = await fetch(`${GH_API}${urlPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "SEOKaroAI-Gatekeeper",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(25_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${data?.message ?? "request failed"}`);
  return data;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const projectId = Number(url.searchParams.get("project"));
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return Response.json({ ok: false, error: "Missing project query parameter." }, { status: 400 });
  }

  const rawBody = await req.text();
  const secret = gatekeeperSecret(projectId);
  const sig = req.headers.get("x-hub-signature-256");
  if (!verifyGitHubSignature(rawBody, sig, secret)) {
    return Response.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  if (event === "ping") {
    return Response.json({ ok: true, message: "SEOKaroAI GitHub PR SEO Gatekeeper is connected." });
  }
  if (event !== "pull_request") {
    return Response.json({ ok: true, skipped: `Ignored event ${event}` });
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch { return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const action = String(payload?.action ?? "");
  if (!["opened", "synchronize", "reopened"].includes(action)) {
    return Response.json({ ok: true, skipped: `Ignored action ${action}` });
  }

  const [project] = await db().select().from(schema.projects).where(eq(schema.projects.id, projectId)).limit(1);
  if (!project) return Response.json({ ok: false, error: "Project not found." }, { status: 404 });

  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, project.userId)).limit(1);
  if (!user) return Response.json({ ok: false, error: "User not found." }, { status: 404 });

  const plan = effectivePlan(user);
  const limit = user.role === "admin" ? 10_000 : plan.limits.prChecks;
  if (limit <= 0) {
    return Response.json({ ok: false, error: "GitHub PR SEO Gatekeeper requires Starter plan or higher." }, { status: 403 });
  }
  const used = await monthlyGatekeeperCount(projectId);
  if (used >= limit) {
    return Response.json({ ok: false, error: `Monthly PR Gatekeeper limit (${limit}) reached on ${plan.name} plan.` }, { status: 429 });
  }

  const [conn] = await db()
    .select()
    .from(schema.connectors)
    .where(and(eq(schema.connectors.projectId, projectId), eq(schema.connectors.kind, "github")))
    .limit(1);
  if (!conn) return Response.json({ ok: false, error: "No GitHub connector found on this project." }, { status: 400 });

  const { secret: token } = connectorCreds(conn);
  if (!token) return Response.json({ ok: false, error: "GitHub token missing." }, { status: 400 });

  const repoFull = String(payload?.repository?.full_name ?? "");
  const prNumber = Number(payload?.pull_request?.number ?? 0);
  const prTitle = String(payload?.pull_request?.title ?? "");
  const prUrl = String(payload?.pull_request?.html_url ?? "");
  if (!repoFull || !prNumber) return Response.json({ ok: false, error: "Invalid PR payload." }, { status: 400 });

  try {
    const files = (await ghFetch(token, `/repos/${repoFull}/pulls/${prNumber}/files?per_page=100`)) as {
      filename: string;
      status?: string;
      patch?: string;
    }[];
    const issues = analyzePrFiles(files);
    const { status, body } = formatPrComment(repoFull, prNumber, issues);

    // Update existing SEOKaroAI comment if present, otherwise post a new one.
    const existing = (await ghFetch(token, `/repos/${repoFull}/issues/${prNumber}/comments?per_page=50`)) as {
      id: number;
      body?: string;
    }[];
    const prev = existing.find((c) => c.body?.includes("<!-- seokaroai-pr-gatekeeper -->"));
    if (prev) {
      await ghFetch(token, `/repos/${repoFull}/issues/comments/${prev.id}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
    } else {
      await ghFetch(token, `/repos/${repoFull}/issues/${prNumber}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    }

    await recordGatekeeperLog({
      projectId,
      repo: repoFull,
      prNumber,
      prTitle,
      prUrl,
      status,
      issuesCount: issues.length,
      summary: issues.length ? issues.slice(0, 3).map((i) => `[${i.severity}] ${i.file}: ${i.message}`).join(" · ") : "No SEO regressions found.",
    });

    return Response.json({ ok: true, status, issues: issues.length });
  } catch (e) {
    return Response.json({ ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 500 });
  }
}
