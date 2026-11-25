import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get('url') || config.appUrl;
  const key = config.googleApiKey || process.env.GOOGLE_API_KEY || '';
  if (!key) {
    return new NextResponse(JSON.stringify({ error: 'Missing GOOGLE_API_KEY. Set the GOOGLE_API_KEY environment variable in your deployment.' }), { status: 501, headers: { 'Content-Type': 'application/json' } });
  }

  // Helper to call PageSpeed Insights v5 for a strategy
  async function runStrategy(strategy: 'mobile' | 'desktop') {
    const api = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=${strategy}&key=${encodeURIComponent(key)}`;
    const res = await fetch(api);
    if (!res.ok) return { error: `PSI ${strategy} returned ${res.status}` };
    const data = await res.json();
    // Extract LCP, CLS, INP where available
    const metrics = (data?.lighthouseResult?.audits) || {};
    const getMetric = (name: string) => {
      const m = metrics[name];
      if (!m) return null;
      if (m.numericValue !== undefined) return m.numericValue;
      return m.displayValue || null;
    };
    return {
      strategy,
      lcp: getMetric('largest-contentful-paint'),
      cls: getMetric('cumulative-layout-shift'),
      inp: getMetric('interactive'),
      raw: data,
    };
  }

  try {
    const [mobile, desktop] = await Promise.all([runStrategy('mobile'), runStrategy('desktop')]);
    return NextResponse.json({ url: target, mobile, desktop });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
