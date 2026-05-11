'use client';

import { useRef, useState, useEffect } from 'react';
import type { VocabWord } from '@/lib/db';

interface VocabPhaseProps {
  vocabWords: VocabWord[];
  onDefinitionChange: (word: string, definition: string) => void;
  onStart2nd: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabPhase({ vocabWords, onDefinitionChange, onStart2nd }: VocabPhaseProps) {
  const wordListKey = vocabWords.map((v) => v.word).join(',');
  const prevKeyRef = useRef('');
  const [shuffledDefs, setShuffledDefs] = useState<string[]>([]);

  useEffect(() => {
    if (wordListKey !== prevKeyRef.current) {
      prevKeyRef.current = wordListKey;
      setShuffledDefs(shuffle(vocabWords.map((v) => v.definition)));
    } else {
      setShuffledDefs((prev) => {
        const defSet = new Map(vocabWords.map((v) => [v.definition, true]));
        return prev.map((d) => (defSet.has(d) ? d : '')).concat(
          vocabWords.map((v) => v.definition).filter((d) => d && !prev.includes(d)),
        );
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordListKey]);

  const filledCount = vocabWords.filter((v) => v.definition.trim()).length;
  const hasAny = filledCount > 0;

  return (
    <div className="space-y-6">
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          opacity: 0.5,
          color: 'var(--color-ink)',
        }}
      >
        只查这个词在这篇文章里的意思，只记一个中文释义
      </p>

      {/* Vocab input list */}
      {vocabWords.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '17px',
            fontWeight: 300,
            fontStyle: 'italic',
            opacity: 0.4,
            color: 'var(--color-ink)',
          }}
        >
          没有标记生词
        </p>
      ) : (
        <div className="space-y-2.5">
          {vocabWords.map((v, i) => (
            <div key={v.word} className="flex items-center gap-3">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  opacity: 0.4,
                  color: 'var(--color-ink)',
                  width: '20px',
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {i + 1}.
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--color-ink)',
                  width: '128px',
                  flexShrink: 0,
                }}
              >
                {v.word}
              </span>
              <input
                type="text"
                value={v.definition}
                onChange={(e) => onDefinitionChange(v.word, e.target.value)}
                placeholder="中文释义…"
                className="flex-1 outline-none transition-colors rounded-lg px-3 py-1.5"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 300,
                  background: 'var(--bg-2)',
                  border: '1px solid rgba(0,0,0,0.10)',
                  color: 'var(--color-ink)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-terracotta)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(198,93,59,0.08)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Shuffled comparison panel */}
      {hasAny && (
        <div
          className="paper-texture rounded-lg overflow-hidden"
          style={{
            background: 'var(--bg-1)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px dashed rgba(0,0,0,0.10)', background: 'var(--bg-2)' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                opacity: 0.6,
                color: 'var(--color-ink)',
              }}
            >
              对照纸（释义顺序已打乱）
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                opacity: 0.35,
                color: 'var(--color-ink)',
              }}
            >
              找不到？去右列找——找的过程就是记忆
            </span>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-3 space-y-1.5" style={{ borderRight: '1px dashed rgba(0,0,0,0.10)' }}>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  opacity: 0.35,
                  marginBottom: '8px',
                  color: 'var(--color-ink)',
                }}
              >
                单词（按出现顺序）
              </p>
              {vocabWords.map((v) => (
                <div
                  key={v.word}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--color-ink)',
                    padding: '2px 0',
                  }}
                >
                  {v.word}
                </div>
              ))}
            </div>
            <div className="p-3 space-y-1.5">
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  opacity: 0.35,
                  marginBottom: '8px',
                  color: 'var(--color-ink)',
                }}
              >
                释义（随机顺序）
              </p>
              {shuffledDefs.map((def, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: 300,
                    color: 'var(--color-ink)',
                    padding: '2px 0',
                    opacity: def ? 1 : 0.3,
                  }}
                >
                  {def || '—'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onStart2nd}
        className="pv-btn w-full py-3 rounded-lg cursor-pointer"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          background: 'var(--color-ink)',
          color: 'var(--color-mustard)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        开始第二遍阅读 →
      </button>
    </div>
  );
}

/* ─ Collapsible vocab reference panel ───────────────────────────────────── */
interface VocabRefPanelProps {
  vocabWords: VocabWord[];
  shuffledDefs: string[];
}

export function VocabRefPanel({ vocabWords, shuffledDefs }: VocabRefPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (vocabWords.length === 0) return null;

  return (
    <div
      className="paper-texture rounded-lg overflow-hidden mb-4 flex-shrink-0"
      style={{
        background: 'var(--bg-1)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left cursor-pointer transition-colors"
        style={{ borderBottom: collapsed ? 'none' : '1px dashed rgba(0,0,0,0.10)', background: 'var(--bg-2)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'; }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            opacity: 0.6,
            color: 'var(--color-ink)',
          }}
        >
          对照纸 — 记不住的去右列找
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            opacity: 0.35,
            color: 'var(--color-ink)',
          }}
        >
          {collapsed ? '展开 ▼' : '折叠 ▲'}
        </span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-2 max-h-48 overflow-y-auto">
          <div className="p-3 space-y-1" style={{ borderRight: '1px dashed rgba(0,0,0,0.10)' }}>
            {vocabWords.map((v) => (
              <div
                key={v.word}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--color-ink)',
                  padding: '1px 0',
                }}
              >
                {v.word}
              </div>
            ))}
          </div>
          <div className="p-3 space-y-1">
            {shuffledDefs.map((def, i) => (
              <div
                key={i}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: 'var(--color-ink)',
                  padding: '1px 0',
                  opacity: def ? 1 : 0.3,
                }}
              >
                {def || '—'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
