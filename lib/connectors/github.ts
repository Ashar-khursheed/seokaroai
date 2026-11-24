import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { ChangedFile, CodeDriver } from "./types";

/**
 * GitHub via a fine-grained personal access token (Contents: read & write, Pull requests: read & write)
 * on one repository. Code is downloaded as a tarball (no git needed); fixes go to a new branch and a
 * pull request. The default branch is never written to directly.
 */

const API = "https://api.github.com";
const MAX_REPO_KB = 150_000;

async function gh(token: string, p: string, init: RequestInit = {}) {
  const res = await fetch(API + p, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "SEOKaroAI", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* binary or empty */ }
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${data?.message ?? text.slice(0, 200)}`);
  return data;
}

const repoPath = (cfg: Record<string, string>) => {
  if (!/^[\w.-]+$/.test(cfg.owner) || !/^[\w.-]+$/.test(cfg.repo)) throw new Error("Owner and repository may only contain letters, numbers, '-', '_' and '.'");
  return `/repos/${cfg.owner}/${cfg.repo}`;
};

export const github: CodeDriver = {
  kind: "github",
  async test(cfg, token) {
    try {
      const r = await gh(token, repoPath(cfg));
      if (!r.permissions?.push) return { ok: false, message: "The token can read this repository but cannot push. Give it Contents and Pull requests write access." };
      if (r.size > MAX_REPO_KB) return { ok: false, message: `Repository is ${(r.size / 1024).toFixed(0)} MB; the limit is ${MAX_REPO_KB / 1000} MB.` };
      return { ok: true, message: `Connected to ${r.full_name} (default branch ${r.default_branch}).` };
    } catch (e) {
      return { ok: false, message: String((e as Error).message) };
    }
  },
  async fetchCode(cfg, token, dest) {
    const r = await gh(token, repoPath(cfg));
    const branch = cfg.branch || r.default_branch;
    const res = await fetch(`${API}${repoPath(cfg)}/tarball/${encodeURIComponent(branch)}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "SEOKaroAI" }, signal: AbortSignal.timeout(300_000),
    });
    if (!res.ok) throw new Error(`GitHub tarball ${res.status}`);
    fs.mkdirSync(dest, { recursive: true });
    const tgz = `${dest}.tar.gz`;
    fs.writeFileSync(tgz, Buffer.from(await res.arrayBuffer()));
    const t = spawnSync("tar", ["-xzf", tgz, "-C", dest, "--strip-components=1"], { windowsHide: true });
    fs.rmSync(tgz, { force: true });
    if (t.status !== 0) throw new Error(`Could not unpack the repository: ${String(t.stderr).slice(0, 200)}`);
  },
};

/** Commit the changed files to a new branch and open a pull request. Returns the PR URL. */
export async function openPullRequest(cfg: Record<string, string>, token: string, files: ChangedFile[], title: string, body: string, branchName: string): Promise<string> {
  const rp = repoPath(cfg);
  const repo = await gh(token, rp);
  const base = cfg.branch || repo.default_branch;
  const ref = await gh(token, `${rp}/git/ref/heads/${encodeURIComponent(base)}`);
  const baseSha = ref.object.sha;
  const baseCommit = await gh(token, `${rp}/git/commits/${baseSha}`);
  const tree = [];
  for (const f of files) {
    if (f.content == null) { tree.push({ path: f.path, mode: "100644", type: "blob", sha: null }); continue; }
    const blob = await gh(token, `${rp}/git/blobs`, { method: "POST", body: JSON.stringify({ content: Buffer.from(f.content, "utf8").toString("base64"), encoding: "base64" }) });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh(token, `${rp}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }) });
  const commit = await gh(token, `${rp}/git/commits`, { method: "POST", body: JSON.stringify({ message: title, tree: newTree.sha, parents: [baseSha] }) });
  await gh(token, `${rp}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: commit.sha }) });
  const pr = await gh(token, `${rp}/pulls`, { method: "POST", body: JSON.stringify({ title, head: branchName, base, body }) });
  return pr.html_url;
}

export const relPath = (root: string, abs: string) => path.relative(root, abs).split(path.sep).join("/");
