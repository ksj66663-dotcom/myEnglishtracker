import { createClient, type Client } from '@libsql/client';

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface VocabWord {
  word: string;
  definition: string;
}

export interface GrammarNote {
  sentenceIndex: number;
  sentence: string;
  note: string;
}

export interface DailyRecord {
  id: number;
  day_number: number;
  date_str: string;
  tasks_done: number[];
  notes: string;
  article_text: string;
  article_url: string;
  vocab_words: VocabWord[];
  grammar_notes: GrammarNote[];
  reading_pass: number;
  created_at: string;
  updated_at: string;
}

/* ── Client singleton ─────────────────────────────────────────────────────── */

let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL ?? 'file:./data/ielts.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

/* ── Schema init (runs once per process, idempotent) ─────────────────────── */

let _schemaInit: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!_schemaInit) {
    _schemaInit = (async () => {
      const db = getClient();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS daily_records (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          day_number    INTEGER NOT NULL,
          date_str      TEXT    NOT NULL UNIQUE,
          tasks_done    TEXT    NOT NULL DEFAULT '[]',
          notes         TEXT    NOT NULL DEFAULT '',
          article_text  TEXT    NOT NULL DEFAULT '',
          article_url   TEXT    NOT NULL DEFAULT '',
          vocab_words   TEXT    NOT NULL DEFAULT '[]',
          grammar_notes TEXT    NOT NULL DEFAULT '[]',
          reading_pass  INTEGER NOT NULL DEFAULT 0,
          created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
          updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL DEFAULT ''
        )
      `);
    })();
  }
  return _schemaInit;
}

/* ── Row parsing ──────────────────────────────────────────────────────────── */

type RawRow = Record<string, unknown>;

function parseRecord(row: RawRow): DailyRecord {
  return {
    id: Number(row.id),
    day_number: Number(row.day_number),
    date_str: String(row.date_str ?? ''),
    tasks_done: JSON.parse(String(row.tasks_done ?? '[]')) as number[],
    notes: String(row.notes ?? ''),
    article_text: String(row.article_text ?? ''),
    article_url: String(row.article_url ?? ''),
    vocab_words: JSON.parse(String(row.vocab_words ?? '[]')) as VocabWord[],
    grammar_notes: JSON.parse(String(row.grammar_notes ?? '[]')) as GrammarNote[],
    reading_pass: Number(row.reading_pass ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

/* ── Public API ───────────────────────────────────────────────────────────── */

export async function getRecord(dateStr: string): Promise<DailyRecord | null> {
  await ensureSchema();
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT * FROM daily_records WHERE date_str = ?',
    args: [dateStr],
  });
  if (result.rows.length === 0) return null;
  return parseRecord(result.rows[0] as unknown as RawRow);
}

export async function createRecord(dayNumber: number, dateStr: string): Promise<DailyRecord> {
  await ensureSchema();
  const db = getClient();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT OR IGNORE INTO daily_records
            (day_number, date_str, tasks_done, notes, created_at, updated_at)
          VALUES (?, ?, '[]', '', ?, ?)`,
    args: [dayNumber, dateStr, now, now],
  });
  const result = await db.execute({
    sql: 'SELECT * FROM daily_records WHERE date_str = ?',
    args: [dateStr],
  });
  return parseRecord(result.rows[0] as unknown as RawRow);
}

export async function updateRecord(
  dateStr: string,
  tasksDone: number[],
  notes: string,
): Promise<DailyRecord | null> {
  await ensureSchema();
  const db = getClient();
  const now = new Date().toISOString();
  const update = await db.execute({
    sql: `UPDATE daily_records
          SET tasks_done = ?, notes = ?, updated_at = ?
          WHERE date_str = ?`,
    args: [JSON.stringify(tasksDone), notes, now, dateStr],
  });
  if (update.rowsAffected === 0) return null;
  const result = await db.execute({
    sql: 'SELECT * FROM daily_records WHERE date_str = ?',
    args: [dateStr],
  });
  return parseRecord(result.rows[0] as unknown as RawRow);
}

export async function getAllRecords(): Promise<DailyRecord[]> {
  await ensureSchema();
  const db = getClient();
  const result = await db.execute(
    'SELECT * FROM daily_records ORDER BY day_number',
  );
  return result.rows.map((row) => parseRecord(row as unknown as RawRow));
}

export async function updateArticleData(
  dateStr: string,
  dayNumber: number,
  data: {
    article_text: string;
    article_url: string;
    vocab_words: VocabWord[];
    grammar_notes: GrammarNote[];
    reading_pass: number;
  },
): Promise<void> {
  await ensureSchema();
  const db = getClient();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT OR IGNORE INTO daily_records
            (day_number, date_str, tasks_done, notes, created_at, updated_at)
          VALUES (?, ?, '[]', '', ?, ?)`,
    args: [dayNumber, dateStr, now, now],
  });
  await db.execute({
    sql: `UPDATE daily_records
          SET article_text = ?, article_url = ?, vocab_words = ?,
              grammar_notes = ?, reading_pass = ?, updated_at = ?
          WHERE date_str = ?`,
    args: [
      data.article_text,
      data.article_url,
      JSON.stringify(data.vocab_words),
      JSON.stringify(data.grammar_notes),
      data.reading_pass,
      now,
      dateStr,
    ],
  });
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureSchema();
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT value FROM settings WHERE key = ?',
    args: [key],
  });
  if (result.rows.length === 0) return null;
  return String((result.rows[0] as unknown as RawRow).value ?? '');
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  const db = getClient();
  await db.execute({
    sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    args: [key, value],
  });
}
