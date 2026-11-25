"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "./icons";

export default function InstantChecker() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-run when ?url= is present in the page URL
    try {
      const p = new URL(window.location.href);
      const q = p.searchParams.get("url");
      if (q) {
        setUrl(q);
        runCheck(q);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  async function runCheck(target?: string) {
    const t = (target || url || "").trim();
    if (!t) {
      setError("Enter a URL to check");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/instant-check?url=${encodeURIComponent(t)}`);
      if (!res.ok) throw new Error(`Checker returned ${res.status}`);
      const json = await res.json();
      setResult(json);
      // Update address bar with shareable URL
      const u = new URL(window.location.href);
      u.searchParams.set("url", t);
      window.history.replaceState({}, "", u.toString());
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h3 className="text-lg font-semibold">Instant SEO checker</h3>
      <p className="muted mt-2">Run a quick, no-signup check and get a shareable results link.</p>
      <div className="mt-4 flex gap-3">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="input flex-1" />
        <button className="btn btn-brand" onClick={() => runCheck()} disabled={loading}>{loading ? "Checking…" : "Run check"}</button>
      </div>
      {error && <div className="mt-3 text-rose-500">{error}</div>}
      {result && (
        <div className="mt-4 grid gap-3">
          <div className="flex items-center gap-3">
            <span className="font-medium">URL</span>
            <span className="muted break-all">{result.url}</span>
            <a className="ml-auto muted text-sm" href={window.location.href}>Share this result</a>
          </div>
          <div className="grid gap-2">
            <div className="flex items-start gap-3"><Icon name="Check" size={16} className="text-emerald-500" /><div><div className="font-medium">robots.txt</div><div className="muted">{result.robots?.status}</div></div></div>
            <div className="flex items-start gap-3"><Icon name="Check" size={16} className="text-emerald-500" /><div><div className="font-medium">sitemap.xml</div><div className="muted">{result.sitemap?.status}</div></div></div>
            <div className="flex items-start gap-3"><Icon name="Check" size={16} className="text-emerald-500" /><div><div className="font-medium">Title</div><div className="muted">{result.title?.text || "—"} <span className="ml-2 muted">({result.title?.length ?? 0} chars)</span></div></div></div>
            <div className="flex items-start gap-3"><Icon name="Check" size={16} className="text-emerald-500" /><div><div className="font-medium">Meta description</div><div className="muted">{result.metaDescription?.text || "—"} <span className="ml-2 muted">({result.metaDescription?.length ?? 0} chars)</span></div></div></div>
            <div className="flex items-start gap-3"><Icon name="Check" size={16} className="text-emerald-500" /><div><div className="font-medium">H1</div><div className="muted">{result.h1 || "—"}</div></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
