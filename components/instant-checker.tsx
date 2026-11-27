"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";

function normalizeInput(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export default function InstantChecker() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const p = new URL(window.location.href);
      const q = p.searchParams.get("url");
      if (q) {
        setUrl(q);
        runCheck(q);
      }
    } catch {
      // ignore
    }
  }, []);

  async function runCheck(target?: string) {
    const raw = (target ?? url).trim();
    if (!raw) {
      setError("Enter a website URL (e.g. example.com)");
      return;
    }
    const normalized = normalizeInput(raw);
    setUrl(normalized);
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/instant-check?url=${encodeURIComponent(normalized)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Checker returned ${res.status}`);
      setResult(json);
      const u = new URL(window.location.href);
      u.searchParams.set("url", normalized);
      window.history.replaceState({}, "", u.toString());
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runCheck();
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="panel p-5 sm:p-6">
      <h3 className="text-lg font-semibold">Instant SEO checker</h3>
      <p className="muted mt-1 text-sm">Run a quick, no-signup check and get a shareable results link.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com or https://example.com"
          aria-label="Website URL"
          className="input flex-1"
        />
        <button type="submit" className="btn btn-brand justify-center px-5" disabled={loading}>
          {loading ? "Checking…" : "Run check"}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4 border-t line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wider muted">Scanned URL</div>
              <div className="mt-0.5 break-all text-sm font-semibold">{result.url}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border line bg-[var(--panel2)] px-3.5 py-2 text-center">
                <div className="text-[11px] font-medium uppercase muted">Quick Score</div>
                <div className="text-xl font-bold text-brand-600">{result.score ?? 0}/100</div>
              </div>
              <button type="button" onClick={copyShareLink} className="btn text-xs">
                {copied ? "Link copied!" : "Copy share link"}
              </button>
            </div>
          </div>

          {result.page?.error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
              {result.page.error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <CheckRow ok={Boolean(result.https)} label="HTTPS" value={result.https ? "Enabled" : "Not HTTPS"} />
            <CheckRow ok={Boolean(result.robots?.ok)} label="robots.txt" value={result.robots?.status || "—"} />
            <CheckRow ok={Boolean(result.sitemap?.ok)} label="sitemap.xml" value={result.sitemap?.status || "—"} />
            <CheckRow ok={Boolean(result.canonical)} label="Canonical tag" value={result.canonical || "Missing"} />
            <CheckRow
              ok={Boolean(result.title?.text) && result.title.length >= 20 && result.title.length <= 65}
              label={`Title (${result.title?.length ?? 0} chars)`}
              value={result.title?.text || "Missing"}
            />
            <CheckRow
              ok={Boolean(result.metaDescription?.text) && result.metaDescription.length >= 70 && result.metaDescription.length <= 165}
              label={`Meta description (${result.metaDescription?.length ?? 0} chars)`}
              value={result.metaDescription?.text || "Missing"}
            />
            <CheckRow ok={Boolean(result.h1)} label="H1 heading" value={result.h1 || "Missing"} />
            <CheckRow
              ok={(result.schemaCount ?? 0) > 0}
              label="Structured Data (JSON-LD)"
              value={result.schemaCount > 0 ? `${result.schemaCount} block(s) detected` : "None detected"}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border line bg-[var(--panel2)] p-4">
            <div className="text-sm">
              <strong>Want Core Web Vitals, competitor gaps &amp; 1-click Auto-Fix?</strong>
              <span className="muted block text-xs">Run a full 8-category multi-agent audit free on SEOKaroAI.</span>
            </div>
            <Link href="/signup" className="btn btn-brand text-xs">
              Start full free audit <Icon name="ArrowRight" size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckRow({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border line bg-white p-3.5">
      <Icon
        name={ok ? "CircleCheck" : "TriangleAlert"}
        size={16}
        className={`mt-0.5 shrink-0 ${ok ? "text-emerald-600" : "text-amber-500"}`}
      />
      <div className="min-w-0">
        <div className="text-xs font-semibold">{label}</div>
        <div className="muted mt-0.5 break-words text-xs leading-relaxed">{value}</div>
      </div>
    </div>
  );
}
