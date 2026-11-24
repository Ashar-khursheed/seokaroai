import fs from "node:fs";
import path from "node:path";
import type { ChangedFile, CodeDriver } from "./types";

/**
 * A folder on the server (self-hosted installs only, enabled with ALLOW_LOCAL_FOLDERS=1, admins only).
 * The agent edits a copy; changes reach the real folder only when someone applies them, and every
 * file it overwrites is backed up first.
 */

export const localFoldersAllowed = () => process.env.ALLOW_LOCAL_FOLDERS === "1";

const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", "vendor", ".venv", "venv", "__pycache__", ".cache", "coverage"]);
const MAX_FILE = 2 * 1024 * 1024;
const MAX_FILES = 20_000;

function checkPath(p: string): string {
  const abs = path.resolve(/*turbopackIgnore: true*/ p || "");
  const root = path.parse(abs).root;
  if (!p || abs === root || abs.length < root.length + 3) throw new Error("Choose a project folder, not a drive root.");
  if (/[\\/](windows|program files|system32|etc|usr|bin|boot)([\\/]|$)/i.test(abs)) throw new Error("System folders cannot be connected.");
  return abs;
}

export function copyTree(src: string, dest: string) {
  let n = 0;
  const walk = (s: string, d: string) => {
    fs.mkdirSync(d, { recursive: true });
    for (const e of fs.readdirSync(s, { withFileTypes: true })) {
      if (SKIP.has(e.name) || e.isSymbolicLink()) continue;
      const sp = path.join(s, e.name), dp = path.join(d, e.name);
      if (e.isDirectory()) walk(sp, dp);
      else if (e.isFile()) {
        if (fs.statSync(sp).size > MAX_FILE) continue;
        if (++n > MAX_FILES) throw new Error(`Folder has more than ${MAX_FILES} files.`);
        fs.copyFileSync(sp, dp);
      }
    }
  };
  walk(src, dest);
}

export const folder: CodeDriver = {
  kind: "folder",
  async test(cfg) {
    if (!localFoldersAllowed()) return { ok: false, message: "Server folders are disabled. Set ALLOW_LOCAL_FOLDERS=1 on a self-hosted install." };
    try {
      const abs = checkPath(cfg.path);
      if (!fs.statSync(abs).isDirectory()) return { ok: false, message: "That path is not a folder." };
      fs.accessSync(abs, fs.constants.R_OK | fs.constants.W_OK);
      return { ok: true, message: `Folder ready: ${abs}` };
    } catch (e) {
      return { ok: false, message: String((e as Error).message) };
    }
  },
  async fetchCode(cfg, _secret, dest) {
    if (!localFoldersAllowed()) throw new Error("Server folders are disabled.");
    copyTree(checkPath(cfg.path), dest);
  },
};

/** Write changed files into the real folder; overwritten files are copied to `backupDir` first. */
export function applyToFolder(cfg: Record<string, string>, files: ChangedFile[], backupDir: string) {
  const root = checkPath(cfg.path);
  for (const f of files) {
    const target = path.resolve(/*turbopackIgnore: true*/ root, f.path);
    if (!target.startsWith(root + path.sep)) throw new Error(`Refusing path outside the folder: ${f.path}`);
    if (fs.existsSync(target)) {
      const b = path.join(backupDir, f.path);
      fs.mkdirSync(path.dirname(b), { recursive: true });
      fs.copyFileSync(target, b);
    }
    if (f.content == null) fs.rmSync(target, { force: true });
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, f.content);
    }
  }
}
