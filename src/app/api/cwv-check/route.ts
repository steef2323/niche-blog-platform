import { NextRequest, NextResponse } from 'next/server';

// Google PageSpeed Insights API endpoint for CWV monitoring
// Usage: GET /api/cwv-check?url=https://www.sipenpaints.nl
// Optional: ?strategy=mobile|desktop (default: mobile)
// Optional: set PAGESPEED_API_KEY env var for higher rate limits

const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const strategy = searchParams.get('strategy') === 'desktop' ? 'DESKTOP' : 'MOBILE';

  if (!url) {
    return NextResponse.json(
      { error: 'url parameter is required. Example: /api/cwv-check?url=https://www.sipenpaints.nl' },
      { status: 400 }
    );
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const apiKey = process.env.PAGESPEED_API_KEY;
  const params = new URLSearchParams({
    url,
    strategy,
    ...(apiKey ? { key: apiKey } : {}),
  });
  CATEGORIES.forEach(c => params.append('category', c));

  try {
    const psiRes = await fetch(`${PSI_API}?${params.toString()}`, {
      next: { revalidate: 0 }, // Never cache — always fresh scores
    });

    if (!psiRes.ok) {
      const errText = await psiRes.text();
      return NextResponse.json(
        { error: 'PageSpeed Insights API error', details: errText },
        { status: psiRes.status }
      );
    }

    const data = await psiRes.json();
    const lhr = data.lighthouseResult;
    const audits = lhr?.audits || {};

    // Extract Core Web Vitals
    const cwv = {
      lcp: audits['largest-contentful-paint']?.displayValue ?? null,
      cls: audits['cumulative-layout-shift']?.displayValue ?? null,
      inp: audits['interaction-to-next-paint']?.displayValue ?? null,
      fcp: audits['first-contentful-paint']?.displayValue ?? null,
      ttfb: audits['server-response-time']?.displayValue ?? null,
      tbt: audits['total-blocking-time']?.displayValue ?? null,
      speedIndex: audits['speed-index']?.displayValue ?? null,
    };

    // Category scores (0–100)
    const scores: Record<string, number | null> = {};
    for (const cat of CATEGORIES) {
      scores[cat] = lhr?.categories?.[cat]?.score != null
        ? Math.round(lhr.categories[cat].score * 100)
        : null;
    }

    const pass = (scores.performance ?? 0) >= 95;

    return NextResponse.json(
      {
        url,
        strategy: strategy.toLowerCase(),
        scores,
        cwv,
        pass,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    console.error('[cwv-check] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error running PageSpeed check' },
      { status: 500 }
    );
  }
}
