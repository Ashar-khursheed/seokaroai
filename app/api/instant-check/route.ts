import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeUrl(u: string) {
  try {
    const url = new URL(u);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
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
  if (!target) return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  const safe = safeUrl(target);
  if (!safe) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });

  try {
    const origin = new URL(safe).origin;
    const results: any = { url: safe };

    // robots.txt
    try {
      const r = await fetchWithTimeout(new URL('/robots.txt', origin).toString());
      results.robots = { status: r.status === 200 ? 'found' : `status ${r.status}` };
    } catch (e: any) {
      results.robots = { status: 'error' };
    }

    // sitemap.xml
    try {
      const s = await fetchWithTimeout(new URL('/sitemap.xml', origin).toString());
      results.sitemap = { status: s.status === 200 ? 'found' : `status ${s.status}` };
    } catch (e: any) {
      results.sitemap = { status: 'error' };
    }

    // fetch page HTML
    try {
      const p = await fetchWithTimeout(safe);
      const text = await p.text();
      // title
      const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;
      results.title = { text: title, length: title ? title.length : 0 };
      // meta description
      const metaMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) || text.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i);
      const meta = metaMatch ? metaMatch[1].replace(/\s+/g, ' ').trim() : null;
      results.metaDescription = { text: meta, length: meta ? meta.length : 0 };
      // h1
      const h1Match = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null;
      results.h1 = h1;
    } catch (e) {
      results.page = { error: 'fetch failed' };
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
