import os from "node:os";
import path from "node:path";
import type { CanUseTool, PermissionResult } from "@anthropic-ai/claude-agent-sdk";

/**
 * Tool guard for unattended runs. Agents read untrusted web pages, so every tool call is
 * checked here: file writes stay inside the run folder (or the OS temp dir), shell commands
 * are limited to read-only utilities and the bundled claude-seo launcher, and anything else
 * (package installs, git, deletes, PowerShell, MCP servers) is refused with a reason the
 * agent can act on.
 */

const READ_ONLY_TOOLS = new Set([
  "Read", "Glob", "Grep", "WebFetch", "WebSearch", "Agent", "Task", "Skill", "TodoWrite",
  "ToolSearch", "BashOutput", "TaskOutput", "KillShell", "NotebookRead", "LS",
]);

const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

const SHELL_COMMANDS = new Set([
  // the bundled launcher is matched separately
  "curl", "ls", "cat", "head", "tail", "grep", "egrep", "fgrep", "rg", "wc", "sed", "awk", "echo",
  "printf", "mkdir", "cd", "pwd", "find", "sort", "uniq", "cut", "tr", "jq", "date", "test", "[",
  "[[", "true", "false", "cp", "mv", "touch", "openssl", "nslookup", "dig", "host", "unzip",
  "base64", "tee", "diff", "basename", "dirname", "realpath", "sleep", "export", "set", "seq",
  "column", "nl", "paste", "comm", "file", "stat", "du", "md5sum", "sha256sum", "xmllint",
  "gunzip", "zcat", "iconv", "timeout", "read", "local", "return", "exit", "break", "continue",
]);

const SHELL_KEYWORDS = new Set([
  "for", "in", "do", "done", "if", "then", "else", "elif", "fi", "while", "until", "case", "esac",
  "!", "{", "}", "function",
]);

function isInside(child: string, parent: string): boolean {
  const c = path.resolve(child).toLowerCase();
  const p = path.resolve(parent).toLowerCase();
  return c === p || c.startsWith(p + path.sep);
}

function deny(message: string): PermissionResult {
  return { behavior: "deny", message };
}

/** Split a shell command into simple-command segments and return the first word of each. */
export function commandHeads(command: string): string[] {
  const heads: string[] = [];
  const segments = command
    .replace(/\\\r?\n/g, " ")
    .split(/\|\||&&|;|\||\r?\n|\$\(|`|\(|\)|(?<![<>])&(?![>\d])/);
  for (let seg of segments) {
    seg = seg.trim();
    if (!seg) continue;
    // drop leading redirections like 2>/dev/null and env assignments like A=b
    const words = seg.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    let i = 0;
    while (i < words.length) {
      const w = words[i];
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w)) { i++; continue; }
      if (/^\d*[<>]/.test(w)) { i++; continue; }
      if (SHELL_KEYWORDS.has(w)) {
        // `for x in a b` : everything after `for` is data, not a command
        if (w === "for" || w === "case" || w === "in") { i = words.length; break; }
        i++;
        continue;
      }
      break;
    }
    if (i < words.length) heads.push(words[i].replace(/^["']|["']$/g, ""));
  }
  return heads;
}

function isLauncher(head: string): boolean {
  const h = head.replace(/\\/g, "/");
  return /(^|\/)claude-seo$/.test(h) && (h.includes(".claude/skills/seo/scripts") || h.startsWith("$HOME") || h.startsWith("~"));
}

/** Simple VAR=value assignments in the command, so `L=".../claude-seo"; "$L" run x.py` can be checked. */
function assignments(command: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const m of command.matchAll(/(?:^|[\s;&|(])([A-Za-z_][A-Za-z0-9_]*)=("[^"]*"|'[^']*'|[^\s;&|]+)/g)) {
    vars.set(m[1], m[2].replace(/^["']|["']$/g, ""));
  }
  return vars;
}

export function checkBash(command: string): string | null {
  if (/\brm\s+-[a-z]*r|\bdel\s|\bformat\s|\bshutdown\b|\breg\s+(add|delete)\b/i.test(command)) {
    return "Deleting files or changing the system is not allowed in this run.";
  }
  const vars = assignments(command);
  for (let head of commandHeads(command)) {
    const ref = head.match(/^\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?$/);
    if (ref && vars.has(ref[1])) head = vars.get(ref[1])!;
    if (isLauncher(head)) continue;
    const name = head.split("/").pop() || head;
    if (SHELL_COMMANDS.has(name)) continue;
    if (name === "xargs") continue; // xargs targets are checked as their own segment heads below
    if (["python", "python3", "py", "pip", "pip3"].includes(name)) {
      return 'Run bundled Python tools only through the launcher: "$HOME/.claude/skills/seo/scripts/claude-seo" run <script.py> ...';
    }
    return `Shell command "${name}" is not allowed in this run. Allowed: the claude-seo launcher, curl and read-only text utilities.`;
  }
  return null;
}

export function makeGuard(runDir: string): CanUseTool {
  const tmp = os.tmpdir();
  return async (toolName, input) => {
    if (READ_ONLY_TOOLS.has(toolName)) return { behavior: "allow", updatedInput: input };

    if (WRITE_TOOLS.has(toolName)) {
      const p = String(input.file_path ?? input.notebook_path ?? "");
      if (p && (isInside(p, runDir) || isInside(p, tmp))) return { behavior: "allow", updatedInput: input };
      return deny(`Write files only inside the run folder: ${runDir}`);
    }

    if (toolName === "Bash") {
      const reason = checkBash(String(input.command ?? ""));
      return reason ? deny(reason) : { behavior: "allow", updatedInput: input };
    }

    if (toolName === "PowerShell") return deny("Use the Bash tool for shell commands in this run.");

    if (toolName.startsWith("mcp__dataforseo__")) return { behavior: "allow", updatedInput: input };

    return deny(`Tool ${toolName} is not available in this run.`);
  };
}
