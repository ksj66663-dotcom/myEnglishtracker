import { NextResponse } from 'next/server';
import {
  EUDIC_BASE,
  buildEudicHeaders,
  extractCategoryCount,
  getEudicToken,
  mapEudicStatus,
} from '@/lib/eudic';

export async function GET() {
  try {
    const token = await getEudicToken();
    if (!token) {
      return NextResponse.json(
        { ok: false, code: 'TOKEN_MISSING', message: 'Token not configured' },
        { status: 400 },
      );
    }

    const res = await fetch(`${EUDIC_BASE}/studylist/category?language=en`, {
      headers: buildEudicHeaders(token),
    });
    const responseText = await res.text();

    console.log('EUDIC TEST RESPONSE:', { status: res.status, body: responseText });

    if (!res.ok) {
      const mapped = mapEudicStatus(res.status);
      return NextResponse.json(
        { ok: false, code: mapped.code, message: mapped.message, details: responseText },
        { status: res.status },
      );
    }

    let payload: unknown = null;
    try { payload = responseText ? JSON.parse(responseText) : null; } catch { payload = null; }

    const categoryCount = extractCategoryCount(payload);

    return NextResponse.json({
      ok: true,
      code: null,
      categoryCount,
      message: `Connected ✓ — ${categoryCount} study list(s) detected`,
    });
  } catch (err) {
    console.error('EUDIC API ERROR:', err);
    const error = err instanceof Error ? err : new Error(String(err));
    const isNetworkError = error.name === 'TypeError' || /fetch failed/i.test(error.message);
    return NextResponse.json(
      {
        ok: false,
        code: isNetworkError ? 'NETWORK_ERROR' : 'ROUTE_ERROR',
        message: isNetworkError ? 'Network connection failed' : 'API route error',
        details: error.message,
      },
      { status: isNetworkError ? 502 : 500 },
    );
  }
}
