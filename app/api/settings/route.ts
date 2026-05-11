import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
    const value = await getSetting(key);
    return NextResponse.json({ key, value: value ?? '' });
  } catch (err) {
    console.error('GET /api/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { key?: string; value?: string };
    const { key, value } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 });
    }
    const normalizedValue = key === 'eudic_token' ? value.trim() : value;
    await setSetting(key, normalizedValue);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
