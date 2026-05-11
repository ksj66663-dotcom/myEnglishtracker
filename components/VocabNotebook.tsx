'use client';

import { useState, useEffect } from 'react';
import type { VocabWord, GrammarNote } from '@/lib/db';

interface VocabNotebookProps {
  onClose: () => void;
  vocabWords: VocabWord[];
  grammarNotes: GrammarNote[];
  synced: boolean;
  articlesCount: number;
  currentDateStr: string;
}

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SyncIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    width="14" height="14"
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={spinning ? { animation: 'spin-once 0.8s ease' } : {}}
  >
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

interface SyncSession {
  date: string;
  wordCount: number;
  message: string;
}

export default function VocabNotebook({
  onClose, vocabWords, grammarNotes, synced, articlesCount, currentDateStr,
}: VocabNotebookProps) {
  const [syncSessions, setSyncSessions] = useState<SyncSession[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [stampVisible, setStampVisible] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Load sync history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vocab-sync-sessions');
      if (stored) setSyncSessions(JSON.parse(stored) as SyncSession[]);
    } catch {}
  }, []);

  const handleSync = async () => {
    if (!vocabWords.length) return;
    setSyncing(true); setSyncMsg(''); setSyncSuccess(false);
    try {
      const words = vocabWords.filter((v) => v.word).map((v) => ({ word: v.word, context: '' }));
      const res = await fetch('/api/eudic/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words }),
      });
      const data = await res.json() as { synced?: number; errors?: number; error?: string };
      if (res.ok) {
        const errNote = data.errors ? ` (${data.errors} failed)` : '';
        const msg = `Synced ${data.synced ?? 0} words${errNote}`;
        setSyncMsg(msg); setSyncSuccess(true);
        setStampVisible(true);
        const newSession: SyncSession = {
          date: currentDateStr,
          wordCount: data.synced ?? 0,
          message: msg,
        };
        const updated = [newSession, ...syncSessions].slice(0, 10);
        setSyncSessions(updated);
        localStorage.setItem('vocab-sync-sessions', JSON.stringify(updated));
      } else {
        setSyncMsg(data.error ?? 'Sync failed');
      }
    } finally { setSyncing(false); }
  };

  const wordCount = vocabWords.length;
  const grammarCount = grammarNotes.length;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(31,31,31,0.55)',
      position: 'fixed', inset: 0, zIndex: 100,
      backdropFilter: 'blur(2px)',
      padding: '16px',
    }}>
      <div style={{
        display: 'flex',
        width: 'min(96vw, 1100px)',
        height: 'min(90vh, 740px)',
        borderRadius: '4px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        animation: 'notebook-open 0.25s ease',
      }}>

        {/* ── LEFT PAGE — Word & Grammar List ─────────────────────────────── */}
        <div className="notebook-page-left lined-paper" style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="page-header-strip">
            <span>VOCABULARY LOG</span>
            <span>ARTICLE {articlesCount}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', marginTop: '8px' }}>
            <button onClick={onClose} className="circle-btn-sm" aria-label="Close" title="Close (Esc)">
              <CloseIcon />
            </button>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.45, color: 'var(--color-ink)' }}>
              {wordCount} WORDS · {grammarCount} GRAMMAR NOTES
            </div>
          </div>

          {/* Vocabulary word list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {wordCount === 0 ? (
              <div style={{ paddingTop: '24px', fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 300, color: 'var(--color-ink)', opacity: 0.35, lineHeight: 1.6 }}>
                No vocabulary recorded today. Open the Reading Log and complete Pass I to mark unknown words.
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.45, color: 'var(--color-ink)', marginBottom: '12px' }}>
                  TODAY&apos;S VOCABULARY
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {vocabWords.map((v, i) => (
                    <div
                      key={v.word}
                      className="ledger-row"
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.3, color: 'var(--color-ink)', width: '20px', textAlign: 'right', flexShrink: 0, paddingTop: '1px' }}>
                        {i + 1}.
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-ink)', letterSpacing: '0.04em' }}>
                          {v.word}
                        </div>
                        {v.definition && (
                          <div style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '0.95rem', fontWeight: 300, color: 'var(--color-ink)', opacity: 0.65, marginTop: '2px' }}>
                            {v.definition}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Grammar notes section */}
            {grammarCount > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.45, color: 'var(--color-ink)', marginBottom: '12px' }}>
                  GRAMMAR NOTES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {grammarNotes.map((n, i) => (
                    <div key={n.sentenceIndex} className="folded-note" style={{ marginLeft: 0, padding: '8px 12px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.4, color: 'var(--color-ink)', marginBottom: '4px' }}>
                        NOTE {i + 1}
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '0.9rem', fontWeight: 300, color: 'var(--color-ink)', opacity: 0.7, marginBottom: '4px', lineHeight: 1.4 }}>
                        &ldquo;{n.sentence.slice(0, 80)}{n.sentence.length > 80 ? '…' : ''}&rdquo;
                      </div>
                      {n.note ? (
                        <div style={{ fontFamily: 'var(--font-utility)', fontSize: '11px', color: 'var(--color-ink)', opacity: 0.8 }}>
                          {n.note}
                        </div>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-ink)', opacity: 0.3 }}>
                          — note pending —
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Spine ──────────────────────────────────────────────────────────── */}
        <div style={{
          width: '20px', minWidth: '20px',
          background: 'linear-gradient(to right, rgba(31,31,31,0.12), rgba(31,31,31,0.04), transparent)',
          flexShrink: 0,
        }} />

        {/* ── RIGHT PAGE — Eudic Sync ──────────────────────────────────────── */}
        <div className="notebook-page-right" style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-warm-gray)', opacity: 1 }}>
          <div className="page-header-strip" style={{ borderBottomColor: 'rgba(31,31,31,0.1)' }}>
            <span>EUDIC DICTIONARY</span>
            <span>{synced ? '— SYNCED' : '— PENDING'}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Sync status wax seal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <div
                  className="wax-seal"
                  style={{
                    width: 80, height: 80,
                    animation: stampVisible ? 'stamp-press 0.3s ease' : undefined,
                  }}
                >
                  <div className="wax-seal-inner" style={{ width: 66, height: 66, gap: '4px' }}>
                    {synced || syncSuccess ? (
                      <>
                        <CheckCircleIcon />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink)', opacity: 0.8 }}>SYNCED</span>
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink)', opacity: 0.5 }}>
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink)', opacity: 0.5 }}>PENDING</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.6rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1, marginBottom: '6px' }}>
                  Eudic Sync
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, color: 'var(--color-ink)', lineHeight: 1.6 }}>
                  {wordCount} WORDS READY<br />
                  COMPLETE READING WORKFLOW FIRST
                </div>
              </div>
            </div>

            {/* Word count summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(31,31,31,0.05)', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }}>{wordCount}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.45, color: 'var(--color-ink)', marginTop: '4px' }}>WORDS TODAY</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(31,31,31,0.05)', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }}>{grammarCount}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.45, color: 'var(--color-ink)', marginTop: '4px' }}>GRAMMAR NOTES</div>
              </div>
            </div>

            {/* Sync message */}
            {syncMsg && (
              <div style={{
                padding: '10px 14px',
                background: syncSuccess ? 'rgba(255,194,51,0.15)' : 'rgba(198,93,59,0.1)',
                border: `1px solid ${syncSuccess ? 'rgba(255,194,51,0.3)' : 'rgba(198,93,59,0.2)'}`,
                borderRadius: '3px',
                fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--color-ink)',
              }}>
                {syncMsg}
              </div>
            )}

            {/* Manual sync button */}
            {!synced && (
              <button
                onClick={handleSync}
                disabled={syncing || wordCount === 0}
                style={{
                  width: '100%', padding: '12px',
                  background: wordCount > 0 ? 'var(--color-ink)' : 'rgba(31,31,31,0.1)',
                  color: wordCount > 0 ? 'var(--color-mustard)' : 'rgba(31,31,31,0.3)',
                  border: 'none', borderRadius: '3px',
                  cursor: (syncing || wordCount === 0) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: syncing ? 0.7 : 1,
                }}
              >
                <SyncIcon spinning={syncing} />
                {syncing ? 'SYNCING…' : wordCount > 0 ? `SYNC ${wordCount} WORDS TO EUDIC` : 'NO WORDS TO SYNC'}
              </button>
            )}

            {/* Sync sessions history */}
            {syncSessions.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.45, color: 'var(--color-ink)', marginBottom: '10px' }}>
                  SYNC HISTORY
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {syncSessions.map((session, i) => (
                    <div key={i} className="ledger-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.55, color: 'var(--color-ink)' }}>
                        {session.date}
                      </span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 300, fontStyle: 'italic', color: 'var(--color-ink)', opacity: 0.7 }}>
                        {session.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API token note */}
            <div style={{ marginTop: 'auto', padding: '10px 12px', background: 'rgba(31,31,31,0.04)', border: '1px dashed rgba(31,31,31,0.1)', borderRadius: '3px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.4, color: 'var(--color-ink)', marginBottom: '4px' }}>
                EUDIC API TOKEN
              </div>
              <div style={{ fontFamily: 'var(--font-utility)', fontSize: '10px', color: 'var(--color-ink)', opacity: 0.5, lineHeight: 1.5 }}>
                Configure your API token in Settings (gear icon on the desk). Uses NIS authorization prefix.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
