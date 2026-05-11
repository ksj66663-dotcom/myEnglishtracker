import { NextRequest, NextResponse } from 'next/server';
import { getRecord, createRecord, updateRecord, getAllRecords } from '@/lib/db';
import { getDayNumber } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const all = searchParams.get('all');

    if (all === 'true') {
      const records = await getAllRecords();
      return NextResponse.json(records);
    }

    if (!dateStr) {
      return NextResponse.json({ error: 'date parameter required' }, { status: 400 });
    }

    const record = await getRecord(dateStr);
    return NextResponse.json(record);
  } catch (err) {
    console.error('GET /api/records error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { dateStr?: string };
    const { dateStr } = body;

    if (!dateStr) {
      return NextResponse.json({ error: 'dateStr required' }, { status: 400 });
    }

    const existing = await getRecord(dateStr);
    if (existing) {
      return NextResponse.json(existing);
    }

    const dayNumber = getDayNumber(dateStr);
    const record = await createRecord(dayNumber, dateStr);
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error('POST /api/records error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as {
      dateStr?: string;
      tasksDone?: number[];
      notes?: string;
    };
    const { dateStr, tasksDone, notes } = body;

    if (!dateStr) {
      return NextResponse.json({ error: 'dateStr required' }, { status: 400 });
    }

    let record = await getRecord(dateStr);
    if (!record) {
      const dayNumber = getDayNumber(dateStr);
      record = await createRecord(dayNumber, dateStr);
    }

    const updated = await updateRecord(
      dateStr,
      tasksDone !== undefined ? tasksDone : record.tasks_done,
      notes !== undefined ? notes : record.notes,
    );

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/records error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
