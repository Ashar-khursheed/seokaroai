import fs from "node:fs";
import path from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import { rawPool } from "@/lib/db";
import { listFiles, runFolder, safeJoin } from "@/lib/files";

const SKIP_DIRS = new Set(["node_modules", ".git", "__pycache__", "workspace", ".next", "dist", "out", "vendor"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB per file
const MAX_TOTAL_BYTES = 40 * 1024 * 1024; // 40 MB per run
const MAX_FILES = 400;

const inflight = new Map<string, Promise<number>>();

function collectPersistable(root: string): { rel: string; full: string; size: number }[] {
  const out: { rel: string; full: string; size: number }[] = [];
  let total = 0;
  const walk = (dir: string, rel: string) => {
    if (out.length >= MAX_FILES || total >= MAX_TOTAL_BYTES) return;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= MAX_FILES || total >= MAX_TOTAL_BYTES) return;
      const r = rel ? `${rel}/${e.name}` : e.name;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(full, r);
      } else if (e.isFile()) {
        if (r.length > 255) continue;
        try {
          const size = fs.statSync(full).size;
          if (size > MAX_FILE_BYTES || total + size > MAX_TOTAL_BYTES) continue;
          total += size;
          out.push({ rel: r, full, size });
        } catch { /* ignore */ }
      }
    }
  };
  walk(root, "");
  return out;
}

/**
 * Persist all report files for a run (JSON, markdown, HTML, PDF, screenshots, events.jsonl)
 * into MySQL `run_files` so reports survive redeploys and ephemeral disks.
 */
export async function saveRunFilesToDb(runId: string): Promise<number> {
  const dir = runFolder(runId);
  if (!fs.existsSync(dir)) return 0;
  const files = collectPersistable(dir);
  if (files.length === 0) return 0;

  const pool = rawPool();
  const now = new Date();
  let saved = 0;
  for (const f of files) {
    try {
      const content = fs.readFileSync(f.full);
      await pool.query(
        `INSERT INTO run_files (run_id, path, content, size, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content), size = VALUES(size), updated_at = VALUES(updated_at)`,
        [runId, f.rel, content, content.length, now],
      );
      saved++;
    } catch (e: any) {
      if (e?.code === "ER_NO_SUCH_TABLE") {
        console.warn("[run-files] run_files table missing — run npm run db:migrate");
        return saved;
      }
      console.error(`[run-files] failed saving ${runId}/${f.rel}:`, e?.message ?? e);
    }
  }
  return saved;
}

/**
 * Ensure a run's files exist on disk by restoring them from MySQL `run_files`
 * when the local run folder is empty (or when a specific file is missing).
 */
export async function ensureRunFiles(runId: string, opts?: { onlyPath?: string; force?: boolean }): Promise<number> {
  const dir = runFolder(runId);

  if (opts?.onlyPath) {
    const target = safeJoin(dir, opts.onlyPath);
    if (!target) return 0;
    if (!opts.force && fs.existsSync(target)) return 0;
    try {
      const [rows] = await rawPool().query<RowDataPacket[]>(
        "SELECT path, content FROM run_files WHERE run_id = ? AND path = ? LIMIT 1",
        [runId, opts.onlyPath],
      );
      if (!rows.length) return 0;
      const buf = Buffer.isBuffer(rows[0].content) ? rows[0].content : Buffer.from(rows[0].content);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, buf);
      return 1;
    } catch (e: any) {
      if (e?.code !== "ER_NO_SUCH_TABLE") console.error(`[run-files] restore ${runId}/${opts.onlyPath}:`, e?.message ?? e);
      return 0;
    }
  }

  if (!opts?.force && listFiles(dir, 1).length > 0) return 0;

  const existing = inflight.get(runId);
  if (existing) return existing;

  const task = (async () => {
    try {
      const [rows] = await rawPool().query<RowDataPacket[]>(
        "SELECT path, content FROM run_files WHERE run_id = ?",
        [runId],
      );
      if (!rows.length) return 0;
      fs.mkdirSync(dir, { recursive: true });
      let written = 0;
      for (const r of rows) {
        const rel = String(r.path ?? "");
        const target = safeJoin(dir, rel);
        if (!target) continue;
        const buf = Buffer.isBuffer(r.content) ? r.content : Buffer.from(r.content);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, buf);
        written++;
      }
      return written;
    } catch (e: any) {
      if (e?.code !== "ER_NO_SUCH_TABLE") console.error(`[run-files] restore ${runId}:`, e?.message ?? e);
      return 0;
    } finally {
      inflight.delete(runId);
    }
  })();

  inflight.set(runId, task);
  return task;
}
