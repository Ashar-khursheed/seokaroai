import crypto from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { rawPool } from "@/lib/db";

export interface PrSeoIssue {
  severity: "Critical" | "High" | "Medium" | "Low";
  file: string;
  message: string;
}

export interface PrGatekeeperLogRow {
  id: number;
  project_id: number;
  repo: string;
  pr_number: number;
  pr_title: string;
  pr_url: string;
  status: "passed" | "warnings" | "failed";
  issues_count: number;
  summary: string;
  created_at: Date;
}

let tableReady: Promise<void> | null = null;

export function ensureGatekeeperTable(): Promise<void> {
  if (!tableReady) {
    tableReady = rawPool()
      .query(`
        CREATE TABLE IF NOT EXISTS pr_gatekeeper_logs (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          project_id BIGINT UNSIGNED NOT NULL,
          repo VARCHAR(200) NOT NULL,
          pr_number INT NOT NULL,
          pr_title VARCHAR(300) NOT NULL DEFAULT '',
          pr_url VARCHAR(500) NOT NULL DEFAULT '',
          status VARCHAR(16) NOT NULL DEFAULT 'passed',
          issues_count INT NOT NULL DEFAULT 0,
          summary TEXT NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          KEY ix_pr_gate_project (project_id, created_at),
          CONSTRAINT fk_pr_gate_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      .then(() => undefined)
      .catch((e) => {
        tableReady = null;
        throw e;
      });
  }
  return tableReady;
}

/** Deterministic per-project webhook secret derived from server secret (zero extra DB migrations). */
export function gatekeeperSecret(projectId: number): string {
  const base = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "seokaroai-gatekeeper";
  return "sk_wh_" + crypto.createHmac("sha256", base).update(`pr-gatekeeper:${projectId}`).digest("hex").slice(0, 32);
}

export function verifyGitHubSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Pure deterministic ($0 AI cost) SEO regression analyzer for GitHub Pull Request diffs.
 * Catches accidental noindex, robots Disallow:/, missing img alt, overlong titles/metas,
 * duplicate H1s, and generic anchor text before code merges to production.
 */
export function analyzePrFiles(files: { filename: string; status?: string; patch?: string }[]): PrSeoIssue[] {
  const issues: PrSeoIssue[] = [];
  const RELEVANT = /\.(tsx|jsx|ts|js|html|htm|md|mdx|astro|vue|svelte)$|robots\.txt$/i;

  for (const f of files) {
    if (f.status === "removed" || !RELEVANT.test(f.filename) || !f.patch) continue;
    const added = f.patch
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .map((l) => l.slice(1));
    const joined = added.join("\n");

    // 1. Accidental robots.txt Disallow: /
    if (/robots\.(txt|ts|js)$/i.test(f.filename) && /Disallow:\s*\/\s*$/im.test(joined)) {
      issues.push({ severity: "Critical", file: f.filename, message: "robots.txt adds `Disallow: /` — this blocks all search engines from crawling your site." });
    }

    // 2. Accidental noindex on public pages
    if (!/\/(app|admin|auth|login|signup)\b/i.test(f.filename) && /(content=["'][^"']*noindex|robots:\s*\{[^}]*index:\s*false)/i.test(joined)) {
      issues.push({ severity: "Critical", file: f.filename, message: "Added `noindex` directive on a public route — verify this page should be hidden from Google." });
    }

    // 3. Added <img> without alt attribute
    const imgTags = joined.match(/<img\b[^>]*>/gi) ?? [];
    const missingAlt = imgTags.filter((tag) => !/\balt\s*=/i.test(tag));
    if (missingAlt.length > 0) {
      issues.push({ severity: "High", file: f.filename, message: `Added ${missingAlt.length} <img> tag(s) without an \`alt\` attribute.` });
    }

    // 4. Overlong <title> or Next.js metadata title (> 65 chars)
    const titleMatches = [...joined.matchAll(/<title[^>]*>([^<{]{66,})<\/title>/gi), ...joined.matchAll(/\btitle\s*:\s*["'`]([^"'`\n]{66,})["'`]/g)];
    if (titleMatches.length > 0) {
      const len = titleMatches[0][1].trim().length;
      issues.push({ severity: "High", file: f.filename, message: `Title is ${len} characters (recommended ≤ 60 chars to avoid SERP truncation).` });
    }

    // 5. Overlong meta description (> 165 chars)
    const descMatches = [
      ...joined.matchAll(/name=["']description["'][^>]*content=["']([^"']{166,})["']/gi),
      ...joined.matchAll(/\bdescription\s*:\s*["'`]([^"'`\n]{166,})["'`]/g),
    ];
    if (descMatches.length > 0) {
      const len = descMatches[0][1].trim().length;
      issues.push({ severity: "Medium", file: f.filename, message: `Meta description is ${len} characters (recommended 120–160 chars).` });
    }

    // 6. Multiple <h1> tags added in one file
    const h1Count = (joined.match(/<h1\b/gi) ?? []).length;
    if (h1Count > 1) {
      issues.push({ severity: "Medium", file: f.filename, message: `Added ${h1Count} <h1> tags in one file (keep a single primary H1 per page).` });
    }

    // 7. Generic anchor text
    if (/<(?:a|Link)\b[^>]*>\s*(click here|read more|learn more)\s*<\/(?:a|Link)>/i.test(joined)) {
      issues.push({ severity: "Low", file: f.filename, message: "Generic link anchor text (`click here` / `read more` / `learn more`) — use descriptive keywords." });
    }
  }

  return issues;
}

export function formatPrComment(repo: string, prNumber: number, issues: PrSeoIssue[]): { status: "passed" | "warnings" | "failed"; body: string } {
  const hasCritical = issues.some((i) => i.severity === "Critical");
  const status: "passed" | "warnings" | "failed" = hasCritical ? "failed" : issues.length > 0 ? "warnings" : "passed";
  const marker = "<!-- seokaroai-pr-gatekeeper -->";
  const badge = status === "passed" ? "✅ **Passed — No SEO regressions detected**" : status === "failed" ? "🚨 **Critical SEO regression detected**" : `⚠️ **${issues.length} SEO warning${issues.length === 1 ? "" : "s"} found**`;

  const lines = [
    marker,
    `### SEOKaroAI · PR SEO Gatekeeper`,
    "",
    badge,
    "",
  ];
  if (issues.length > 0) {
    lines.push("| Severity | File | Finding |", "|---|---|---|");
    for (const i of issues.slice(0, 25)) {
      lines.push(`| **${i.severity}** | \`${i.file}\` | ${i.message.replace(/\|/g, "\\|")} |`);
    }
  } else {
    lines.push("Checked changed templates & metadata for accidental `noindex`, `robots.txt` blocks, missing `alt` attributes, overlong titles/descriptions, and duplicate H1s.");
  }
  lines.push("", `<sub>Automated $0-latency SEO check by <a href="https://seokaroai.com">SEOKaroAI</a> · PR #${prNumber} (${repo})</sub>`);
  return { status, body: lines.join("\n") };
}

export async function recentGatekeeperLogs(projectId: number, limit = 10): Promise<PrGatekeeperLogRow[]> {
  try {
    await ensureGatekeeperTable();
    const [rows] = await rawPool().query<RowDataPacket[]>(
      "SELECT * FROM pr_gatekeeper_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ?",
      [projectId, limit],
    );
    return rows as unknown as PrGatekeeperLogRow[];
  } catch {
    return [];
  }
}

export async function monthlyGatekeeperCount(projectId: number): Promise<number> {
  await ensureGatekeeperTable();
  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const [rows] = await rawPool().query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM pr_gatekeeper_logs WHERE project_id = ? AND created_at >= ?",
    [projectId, since],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function recordGatekeeperLog(o: {
  projectId: number;
  repo: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  status: "passed" | "warnings" | "failed";
  issuesCount: number;
  summary: string;
}) {
  await ensureGatekeeperTable();
  await rawPool().query(
    `INSERT INTO pr_gatekeeper_logs (project_id, repo, pr_number, pr_title, pr_url, status, issues_count, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [o.projectId, o.repo, o.prNumber, o.prTitle.slice(0, 300), o.prUrl.slice(0, 500), o.status, o.issuesCount, o.summary.slice(0, 2000), new Date()],
  );
}
