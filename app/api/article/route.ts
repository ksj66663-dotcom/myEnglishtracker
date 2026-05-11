import { NextRequest, NextResponse } from 'next/server';
import { getRecord, updateArticleData, createRecord } from '@/lib/db';
import { getDayNumber } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) return NextResponse.json({ error: 'date required' }, { status: 400 });

    const record = await getRecord(dateStr);
    if (!record) return NextResponse.json(null);

    return NextResponse.json({
      article_text: record.article_text,
      article_url: record.article_url,
      vocab_words: record.vocab_words,
      grammar_notes: record.grammar_notes,
      reading_pass: record.reading_pass,
    });
  } catch (err) {
    console.error('GET /api/article error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as {
      dateStr?: string;
      article_text?: string;
      article_url?: string;
      vocab_words?: unknown[];
      grammar_notes?: unknown[];
      reading_pass?: number;
    };

    const { dateStr } = body;
    if (!dateStr) return NextResponse.json({ error: 'dateStr required' }, { status: 400 });

    let record = await getRecord(dateStr);
    if (!record) {
      record = await createRecord(getDayNumber(dateStr), dateStr);
    }

    await updateArticleData(dateStr, getDayNumber(dateStr), {
      article_text: typeof body.article_text === 'string' ? body.article_text : record.article_text,
      article_url: typeof body.article_url === 'string' ? body.article_url : record.article_url,
      vocab_words: Array.isArray(body.vocab_words)
        ? (body.vocab_words as import('@/lib/db').VocabWord[])
        : record.vocab_words,
      grammar_notes: Array.isArray(body.grammar_notes)
        ? (body.grammar_notes as import('@/lib/db').GrammarNote[])
        : record.grammar_notes,
      reading_pass: typeof body.reading_pass === 'number' ? body.reading_pass : record.reading_pass,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/article error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
