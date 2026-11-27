import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|\[?fe80:|\[?fc|\[?fd)/i;

function safeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProto);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname || !url.hostname.includes(".")) return null;
    if (PRIVATE_HOST_RE.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, ms = 10_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOKaroAI-Checker/2.0; +https://seokaroai.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  if (!target) return NextResponse.json({ error: "Please enter a website URL." }, { status: 400 });
  const safe = safeUrl(target);
  if (!safe) return NextResponse.json({ error: "Please enter a valid domain or URL (e.g. example.com)." }, { status: 400 });

  try {
    const parsed = new URL(safe);
    const origin = parsed.origin;
    const results: Record<string, any> = {
      url: safe,
      https: parsed.protocol === "https:",
    };

    // robots.txt & sitemap.xml in parallel
    const [robotsRes, sitemapRes, pageRes] = await Promise.allSettled([
      fetchWithTimeout(new URL("/robots.txt", origin).toString(), 6000),
      fetchWithTimeout(new URL("/sitemap.xml", origin).toString(), 6000),
      fetchWithTimeout(safe, 10_000),
    ]);

    results.robots =
      robotsRes.status === "fulfilled"
        ? { ok: robotsRes.value.status === 200, status: robotsRes.value.status === 200 ? "Found (200)" : `HTTP ${robotsRes.value.status}` }
        : { ok: false, status: "Not reachable" };

    results.sitemap =
      sitemapRes.status === "fulfilled"
        ? { ok: sitemapRes.value.status === 200, status: sitemapRes.value.status === 200 ? "Found (200)" : `HTTP ${sitemapRes.value.status}` }
        : { ok: false, status: "Not reachable" };

    let score = 0;
    if (results.https) score += 10;
    if (results.robots.ok) score += 10;
    if (results.sitemap.ok) score += 10;

    if (pageRes.status === "fulfilled") {
      const p = pageRes.value;
      results.httpStatus = p.status;
      const text = await p.text();

      const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;
      results.title = { text: title, length: title ? title.length : 0 };
      if (title && title.length >= 20 && title.length <= 65) score += 15;
      else if (title) score += 8;

      const metaMatch =
        text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
        text.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i);
      const meta = metaMatch ? metaMatch[1].replace(/\s+/g, " ").trim() : null;
      results.metaDescription = { text: meta, length: meta ? meta.length : 0 };
      if (meta && meta.length >= 70 && meta.length <= 165) score += 15;
      else if (meta) score += 8;

      const h1Match = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : null;
      results.h1 = h1;
      if (h1) score += 15;

      const canonicalMatch =
        text.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
        text.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
      results.canonical = canonicalMatch ? canonicalMatch[1].trim() : null;
      if (results.canonical) score += 10;

      const schemaMatches = text.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) ?? [];
      results.schemaCount = schemaMatches.length;
      if (schemaMatches.length > 0) score += 10;

      const imgTags = text.match(/<img\b[^>]*>/gi) ?? [];
      const missingAlt = imgTags.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;
      results.images = { total: imgTags.length, missingAlt };
      if (imgTags.length === 0 || missingAlt === 0) score += 5;
    } else {
      results.page = { error: "Could not fetch page HTML (site may block bots or timed out)." };
    }

    results.score = Math.min(100, score);
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
