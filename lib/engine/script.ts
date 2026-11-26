import fs from "node:fs";
import { spawn } from "node:child_process";
import { config } from "@/lib/config";

/** Bash used to run the POSIX launcher. On Windows this must be Git Bash, never WSL's bash.exe. */
function bashPath(): string | null {
  if (process.platform !== "win32") return null;
  const candidates = [process.env.CLAUDE_SEO_BASH, "C:\\Program Files\\Git\\bin\\bash.exe", "C:\\Program Files (x86)\\Git\\bin\\bash.exe"];
  return candidates.find((p) => p && fs.existsSync(p)) ?? null;
}

export interface ScriptResult {
  ok: boolean;
  code: number | null;
  json: any;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/** Pull the JSON document out of stdout (some tools print a banner line first). */
export function parseJsonOutput(stdout: string): any {
  const t = stdout.trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    const start = t.search(/[[{]/);
    if (start < 0) return null;
    for (let end = t.length; end > start; end = t.lastIndexOf(t[start] === "{" ? "}" : "]", end - 1)) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        if (end <= start) break;
      }
    }
    return null;
  }
}

/** Run one bundled claude-seo script through the launcher; never throws. */
export async function runScript(script: string, args: string[], timeoutSec = 120, cwd?: string): Promise<ScriptResult> {
  if (!/^[a-z_]+\.py$/.test(script)) throw new Error("bad script name");
  const bash = bashPath();
  const cmd = bash ?? config.launcherPath;
  const argv = bash ? [config.launcherPath, "run", script, ...args] : ["run", script, ...args];
  const extraEnv: Record<string, string> = {};
  try {
    const integ = await (await import("@/lib/integrations")).integrations();
    if (integ.google.apiKey) extraEnv.GOOGLE_API_KEY = integ.google.apiKey;
    if (integ.dataforseo.login && integ.dataforseo.password) {
      extraEnv.DATAFORSEO_LOGIN = integ.dataforseo.login;
      extraEnv.DATAFORSEO_PASSWORD = integ.dataforseo.password;
      extraEnv.DATAFORSEO_USERNAME = integ.dataforseo.login;
    }
  } catch { /* ignore if DB unavailable */ }
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const child = spawn(cmd, argv, {
      cwd,
      env: { ...process.env, ...extraEnv, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutSec * 1000);
    child.stdout.on("data", (d) => { if (stdout.length < 20_000_000) stdout += d; });
    child.stderr.on("data", (d) => { if (stderr.length < 200_000) stderr += d; });
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ ok: false, code: null, json: null, stdout, stderr: stderr + String(e), timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const json = parseJsonOutput(stdout);
      resolve({ ok: !timedOut && json != null, code, json, stdout, stderr, timedOut });
    });
  });
}
