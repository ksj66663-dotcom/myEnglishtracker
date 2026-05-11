/**
 * migrate.mjs — one-time migration from local SQLite → Turso
 *
 * Uses node:sqlite (built-in, no install needed) to read ./data/ielts.db
 * Uses @libsql/client (already installed) to write to Turso
 *
 * Run: node migrate.mjs
 */

import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client';
import { readFileSync, existsSync } from 'node:fs';

// ── 1. Parse .env.local ───────────────────────────────────────────────────

function loadEnvFile(filePath = '.env.local') {
  if (!existsSync(filePath)) {
    console.error(`ERROR: ${filePath} not found.`);
    process.exit(1);
  }
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key) process.env[key] = val;
  }
}

loadEnvFile();

const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

console.log('\n── Environment ─────────────────────────────────────────────');
console.log(`TURSO_DATABASE_URL : ${TURSO_URL ?? '(not set)'}`);
console.log(`TURSO_AUTH_TOKEN   : ${TURSO_TOKEN ? TURSO_TOKEN.slice(0, 24) + '…' : '(not set)'}`);

// Guard: warn if the token looks like a URL (common paste mistake)
if (TURSO_TOKEN && TURSO_TOKEN.startsWith('libsql://')) {
  console.error('\nERROR: TURSO_AUTH_TOKEN looks like a URL, not a token.');
  console.error('       Run:  turso db tokens create ielts-tracker');
  console.error('       Then paste the resulting JWT string into .env.local as TURSO_AUTH_TOKEN');
  process.exit(1);
}

if (!TURSO_URL) {
  console.error('\nERROR: TURSO_DATABASE_URL is not set in .env.local');
  process.exit(1);
}

// ── 2. Open local SQLite ──────────────────────────────────────────────────

const LOCAL_PATH = './data/ielts.db';

if (!existsSync(LOCAL_PATH)) {
  console.log(`\nLocal DB not found at ${LOCAL_PATH} — nothing to migrate.`);
  process.exit(0);
}

const local = new DatabaseSync(LOCAL_PATH);
console.log(`\n✓ Opened local DB: ${LOCAL_PATH}`);

// ── 3. Connect to Turso ───────────────────────────────────────────────────

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
console.log('✓ Turso client created');

// ── 4. Create tables ──────────────────────────────────────────────────────

async function createTables() {
  console.log('\n── Creating tables in Turso (IF NOT EXISTS) ────────────────');

  await turso.execute(`
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
  console.log('  ✓ daily_records');

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);
  console.log('  ✓ settings');
}

// ── 5. Migrate daily_records ──────────────────────────────────────────────

async function migrateDailyRecords() {
  let rows;
  try {
    rows = local.prepare('SELECT * FROM daily_records ORDER BY day_number').all();
  } catch {
    console.warn('\n  ⚠  daily_records not found in local DB — skipping.');
    return 0;
  }

  console.log(`\n── Migrating daily_records: ${rows.length} row(s) ───────────────`);
  if (rows.length === 0) { console.log('  (empty table)'); return 0; }

  let n = 0;
  for (const r of rows) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO daily_records
              (id, day_number, date_str, tasks_done, notes,
               article_text, article_url, vocab_words, grammar_notes,
               reading_pass, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        r.id,
        r.day_number,
        r.date_str,
        r.tasks_done    ?? '[]',
        r.notes         ?? '',
        r.article_text  ?? '',
        r.article_url   ?? '',
        r.vocab_words   ?? '[]',
        r.grammar_notes ?? '[]',
        r.reading_pass  ?? 0,
        r.created_at    ?? new Date().toISOString(),
        r.updated_at    ?? new Date().toISOString(),
      ],
    });
    n++;
    console.log(`  ✓ [${n}/${rows.length}] day ${r.day_number} (${r.date_str})`);
  }
  return n;
}

// ── 6. Migrate settings ───────────────────────────────────────────────────

async function migrateSettings() {
  let rows;
  try {
    rows = local.prepare('SELECT * FROM settings').all();
  } catch {
    console.warn('\n  ⚠  settings not found in local DB — skipping.');
    return 0;
  }

  console.log(`\n── Migrating settings: ${rows.length} row(s) ───────────────────`);
  if (rows.length === 0) { console.log('  (empty table)'); return 0; }

  for (const r of rows) {
    await turso.execute({
      sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      args: [r.key, r.value ?? ''],
    });
    // Redact token value in log
    const display = r.key === 'eudic_token'
      ? r.value?.slice(0, 16) + '…'
      : r.value;
    console.log(`  ✓ ${r.key} = ${display}`);
  }
  return rows.length;
}

// ── 7. Verify ─────────────────────────────────────────────────────────────

async function verify() {
  console.log('\n── Verification ────────────────────────────────────────────');

  const dr = await turso.execute('SELECT COUNT(*) AS cnt FROM daily_records');
  const s  = await turso.execute('SELECT COUNT(*) AS cnt FROM settings');
  console.log(`  daily_records in Turso: ${dr.rows[0].cnt} row(s)`);
  console.log(`  settings in Turso:      ${s.rows[0].cnt} row(s)`);

  // Spot-check: read back the first record
  const sample = await turso.execute(
    'SELECT id, date_str, day_number, reading_pass, tasks_done FROM daily_records ORDER BY day_number LIMIT 1'
  );
  if (sample.rows.length > 0) {
    const row = {};
    sample.columns.forEach((col, i) => { row[col] = sample.rows[0][i]; });
    console.log('\n  Spot-check (first row):', JSON.stringify(row, null, 4));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  try {
    // Show local table list
    const tables = local
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map(t => t.name);
    console.log(`\nLocal tables: ${tables.join(', ') || '(none)'}`);

    await createTables();
    await migrateDailyRecords();
    await migrateSettings();
    await verify();

    console.log('\n✅  Migration complete.\n');
  } catch (err) {
    console.error('\n❌  Migration failed:', err.message ?? err);
    if (err.cause) console.error('    Cause:', err.cause);
    process.exit(1);
  } finally {
    try { local.close(); } catch {}
    try { turso.close(); } catch {}
  }
}

main();
