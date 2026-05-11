import { NextRequest, NextResponse } from 'next/server';
import { EUDIC_BASE, buildEudicHeaders, getEudicToken, mapEudicStatus } from '@/lib/eudic';

interface WordWithContext {
  word: string;
  context: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getEudicToken();
    if (!token) {
      return NextResponse.json(
        { code: 'TOKEN_MISSING', error: 'Token not configured — save your Eudic OpenAPI token in Settings first' },
        { status: 400 },
      );
    }

    const body = await request.json() as { words?: WordWithContext[] };
    const words = body.words ?? [];

    if (words.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    let synced = 0;
    const errors: string[] = [];

    for (const { word, context } of words) {
      if (!word) continue;

      const res = await fetch(`${EUDIC_BASE}/studylist/word`, {
        method: 'POST',
        headers: buildEudicHeaders(token),
        body: JSON.stringify({
          language: 'en',
          word,
          context_line: context || '',
          category_ids: [0],
        }),
      });

      if (res.ok) { synced++; continue; }

      const text = await res.text();
      console.error('EUDIC SYNC RESPONSE:', { word, status: res.status, body: text });
      const mapped = mapEudicStatus(res.status);
      errors.push(`${word}: ${mapped.message} ${text}`);
    }

    if (errors.length > 0 && synced === 0) {
      return NextResponse.json(
        { code: 'UPSTREAM_ERROR', error: `Eudic API error: ${errors[0]}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ synced, errors: errors.length });
  } catch (err) {
    console.error('EUDIC API ERROR:', err);
    const error = err instanceof Error ? err : new Error(String(err));
    const isNetworkError = error.name === 'TypeError' || /fetch failed/i.test(error.message);
    return NextResponse.json(
      {
        code: isNetworkError ? 'NETWORK_ERROR' : 'ROUTE_ERROR',
        error: isNetworkError ? 'Network connection failed' : 'API route error',
        details: error.message,
      },
      { status: isNetworkError ? 502 : 500 },
    );
  }
}
