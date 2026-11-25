"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";

/**
 * "Computer folder" connector. Uses the File System Access API (Chrome, Edge, Opera on desktop):
 * the browser reads the folder, uploads a copy for the AI, and later writes approved changes back
 * with a backup in .seokaroai-backup/<run>/ inside the folder. Folder handles are kept in IndexedDB
 * so the user is not asked to pick the folder again after review.
 */

const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", "vendor", ".venv", "venv", "__pycache__", ".cache", "coverage", ".seokaroai-backup", ".turbo", ".vercel", ".output"]);
const TEXT = /\.(html?|php|liquid|jsx?|tsx?|mjs|cjs|vue|svelte|astro|json|xml|txt|md|mdx|css|scss|ya?ml|toml|twig|njk|hbs|ejs|py|rb|go|java|cs)$/i;
const MAX_FILE = 1024 * 1024;

type DirHandle = any; // FileSystemDirectoryHandle (File System Access API is not fully typed in lib.dom)

export const folderPickerSupported = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

// ------------------------------------------------------------------ IndexedDB handle store
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("seokaroai", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("handles");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function putHandle(key: string, h: DirHandle) {
  const d = await idb();
  await new Promise((res, rej) => { const t = d.transaction("handles", "readwrite"); t.objectStore("handles").put(h, key); t.oncomplete = res; t.onerror = () => rej(t.error); });
}
async function getHandle(key: string): Promise<DirHandle | null> {
  const d = await idb();
  return new Promise((res) => { const r = d.transaction("handles").objectStore("handles").get(key); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null); });
}

async function ensureWrite(h: DirHandle): Promise<boolean> {
  const opts = { mode: "readwrite" };
  if ((await h.queryPermission?.(opts)) === "granted") return true;
  return (await h.requestPermission?.(opts)) === "granted";
}

async function readFolder(root: DirHandle, onCount: (n: number) => void) {
  const files: { path: string; content: string }[] = [];
  let skipped = 0;
  const walk = async (dir: DirHandle, prefix: string) => {
    for await (const [name, h] of dir.entries()) {
      if (h.kind === "directory") { if (!SKIP.has(name) && !name.startsWith(".")) await walk(h, `${prefix}${name}/`); continue; }
      const rel = prefix + name;
      if (!TEXT.test(name)) { skipped++; continue; }
      const file: File = await h.getFile();
      if (file.size > MAX_FILE) { skipped++; continue; }
      files.push({ path: rel, content: await file.text() });
      if (files.length % 25 === 0) onCount(files.length);
      if (files.length > 4000) throw new Error("That folder has more than 4,000 code files. Pick the website's source folder.");
    }
  };
  await walk(root, "");
  onCount(files.length);
  return { files, skipped };
}

async function fileAt(root: DirHandle, rel: string, create: boolean): Promise<{ dir: DirHandle; name: string; file: DirHandle | null }> {
  const parts = rel.split("/");
  const name = parts.pop()!;
  let dir = root;
  for (const p of parts) dir = await dir.getDirectoryHandle(p, { create });
  let file: DirHandle | null = null;
  try { file = await dir.getFileHandle(name, { create }); } catch { file = null; }
  return { dir, name, file };
}

async function writeText(root: DirHandle, rel: string, text: string) {
  const { file } = await fileAt(root, rel, true);
  const w = await file.createWritable();
  await w.write(text);
  await w.close();
}

async function readText(root: DirHandle, rel: string): Promise<string | null> {
  try { const { file } = await fileAt(root, rel, false); return file ? await (await file.getFile()).text() : null; } catch { return null; }
}

// ------------------------------------------------------------------ start a fix
export function LocalFolderStart({ projectId, audits }: { projectId: number; audits: { id: string; title: string }[] }) {
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [instructions, setInstructions] = useState("");
  const [source, setSource] = useState("");
  const router = useRouter();
  useEffect(() => setSupported(folderPickerSupported()), []);

  async function start() {
    setMsg(null);
    let handle: DirHandle;
    try { handle = await (window as any).showDirectoryPicker({ id: `seokaroai-${projectId}`, mode: "readwrite" }); }
    catch { return; } // user closed the picker
    setBusy(true);
    try {
      setMsg({ tone: "info", text: "Reading files…" });
      const { files, skipped } = await readFolder(handle, (n) => setMsg({ tone: "info", text: `Reading files… ${n}` }));
      if (!files.length) throw new Error("No HTML, PHP, JavaScript, CSS or template files were found in that folder.");
      setMsg({ tone: "info", text: `Uploading ${files.length} files${skipped ? ` (${skipped} images or large files skipped)` : ""}…` });
      const res = await fetch("/api/fixes/local", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, instructions, sourceRunId: source, folderName: handle.name, files }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start the fix.");
      await putHandle(`run:${data.runId}`, handle);
      await putHandle(`conn:${data.connectorId}`, handle);
      router.push(`/app/runs/${encodeURIComponent(data.runId)}`);
    } catch (e) {
      setMsg({ tone: "error", text: String((e as Error).message) });
      setBusy(false);
    }
  }

  if (!supported) {
    return <p className="rounded-lg border border-high/30 bg-high/10 p-3 text-[13px]">Your browser cannot open local folders. Use Chrome or Edge on a computer, or connect GitHub instead.</p>;
  }
  return (
    <div className="space-y-3.5">
      <label className="block"><span className="mb-1.5 block text-[13px] font-medium">Fix findings from</span>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="input"><option value="">Latest audit</option>{audits.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
      <label className="block"><span className="mb-1.5 block text-[13px] font-medium">Instructions (optional)</span>
        <input value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={2000} className="input" placeholder="e.g. only change the templates in /views" /></label>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button type="button" onClick={start} disabled={busy} className="btn btn-brand w-full max-w-full whitespace-normal text-center sm:w-auto sm:whitespace-nowrap"><Icon name="Folder" size={15} className="shrink-0" />{busy ? "Working…" : "Choose folder and propose fixes"}</button>
        <span className="muted flex items-center gap-1.5 text-[12px]"><Icon name="Lock" size={12} className="shrink-0" />Only code and text files are read; nothing changes until you approve it.</span>
      </div>
      {msg && <p className={`text-[13px] ${msg.tone === "error" ? "text-crit" : "muted"}`}>{msg.text}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ apply / undo from the review page
async function folderFor(runId: string, connectorId: number): Promise<DirHandle> {
  let h = (await getHandle(`run:${runId}`)) ?? (await getHandle(`conn:${connectorId}`));
  if (!h) {
    if (!folderPickerSupported()) throw new Error("Open this page in Chrome or Edge on the computer that has the folder.");
    alert("Choose the same website folder you picked when you started this fix.");
    h = await (window as any).showDirectoryPicker({ mode: "readwrite" });
    await putHandle(`run:${runId}`, h);
  }
  if (!(await ensureWrite(h))) throw new Error("Write access to the folder was not granted.");
  return h;
}

async function mark(runId: string, body: object) {
  await fetch(`/api/fixes/${encodeURIComponent(runId)}/mark`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export function LocalApplyButton({ runId, connectorId, folderName }: { runId: string; connectorId: number; folderName: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();
  async function apply(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    const ids = [...(form?.querySelectorAll<HTMLInputElement>("input[name=change]:checked") ?? [])].map((i) => Number(i.value));
    if (!ids.length) { setMsg("Tick at least one change."); return; }
    setBusy(true);
    setMsg("");
    try {
      const root = await folderFor(runId, connectorId);
      const res = await fetch(`/api/fixes/${encodeURIComponent(runId)}/changes?ids=${ids.join(",")}`);
      const { changes } = (await res.json()) as { changes: { id: number; path: string; oldValue: string | null; newValue: string | null }[] };
      const applied: number[] = [];
      const failed: Record<string, string> = {};
      for (const c of changes) {
        try {
          const current = await readText(root, c.path);
          if (current != null) await writeText(root, `.seokaroai-backup/${runId}/${c.path}`, current);
          if (c.newValue == null) { const { dir, name } = await fileAt(root, c.path, false); await dir.removeEntry(name); }
          else await writeText(root, c.path, c.newValue);
          applied.push(c.id);
        } catch (err) {
          failed[c.id] = String((err as Error).message);
        }
      }
      await mark(runId, { applied, failed });
      setMsg(`${applied.length} file${applied.length === 1 ? "" : "s"} written to ${folderName}${Object.keys(failed).length ? `, ${Object.keys(failed).length} failed` : ""}. Backups are in .seokaroai-backup/.`);
      router.refresh();
    } catch (err) {
      setMsg(String((err as Error).message));
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="flex flex-wrap items-center gap-3">
      {msg && <span className="muted break-words text-[12.5px]">{msg}</span>}
      <button type="button" onClick={apply} disabled={busy} className="btn btn-brand"><Icon name="Folder" size={15} className="shrink-0" />{busy ? "Writing…" : "Apply to my folder"}</button>
    </span>
  );
}

export function LocalUndoButton({ runId, connectorId, changeId }: { runId: string; connectorId: number; changeId: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function undo() {
    setBusy(true);
    try {
      const root = await folderFor(runId, connectorId);
      const res = await fetch(`/api/fixes/${encodeURIComponent(runId)}/changes?ids=${changeId}`);
      const [c] = ((await res.json()) as { changes: { id: number; path: string; oldValue: string | null }[] }).changes;
      if (c.oldValue == null) { const { dir, name } = await fileAt(root, c.path, false); await dir.removeEntry(name); }
      else await writeText(root, c.path, c.oldValue);
      await mark(runId, { reverted: [changeId] });
      router.refresh();
    } catch (err) {
      alert(String((err as Error).message));
    } finally {
      setBusy(false);
    }
  }
  return <button type="button" onClick={undo} disabled={busy} className="btn !py-1 text-[12.5px]"><Icon name="Undo2" size={13} />{busy ? "Undoing…" : "Undo"}</button>;
}
