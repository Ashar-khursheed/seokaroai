import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

export interface AuditInput {
  url: string;
  competitors: string[];
  flows: string[];
  notes?: string;
  model: string;
  budgetUsd: number;
  maxPages?: number;
}

export interface KeywordInput {
  keyword: string;
  targetUrl: string;
  country: string;
  language: string;
  notes?: string;
  model: string;
  budgetUsd: number;
}

const ID_RE = /^[A-Za-z0-9._-]{1,100}$/;
export const isValidRunId = (id: string) => ID_RE.test(id) && !id.startsWith(".");

export function runsRoot() {
  return path.join(config.dataDir, "runs");
}

export function runFolder(id: string): string {
  if (!isValidRunId(id)) throw new Error("invalid run id");
  return path.join(runsRoot(), id);
}

/** Resolve a relative path inside a run folder, refusing anything that escapes it. */
export function safeJoin(root: string, rel: string): string | null {
  const resolved = path.resolve(root, rel);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) return null;
  return resolved;
}

export function readJson<T = unknown>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function readText(file: string, max = 2_000_000): string | null {
  try {
    if (fs.statSync(file).size > max) return null;
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

export interface FileEntry { path: string; size: number }

const SKIP_DIRS = new Set(["node_modules", ".git", "__pycache__"]);
const HIDDEN = new Set(["prompt.md", "events.jsonl"]);

export function listFiles(root: string, limit = 3000): FileEntry[] {
  const out: FileEntry[] = [];
  const walk = (dir: string, rel: string) => {
    if (out.length >= limit) return;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= limit) return;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), r); }
      else if (e.isFile() && !HIDDEN.has(r)) {
        try { out.push({ path: r, size: fs.statSync(path.join(dir, e.name)).size }); } catch { /* ignore */ }
      }
    }
  };
  walk(root, "");
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export const MIME: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8", ".json": "application/json; charset=utf-8", ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".xml": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8", ".tsv": "text/plain; charset=utf-8", ".jsonl": "text/plain; charset=utf-8",
  ".log": "text/plain; charset=utf-8", ".err": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "text/plain; charset=utf-8", ".pdf": "application/pdf",
};
