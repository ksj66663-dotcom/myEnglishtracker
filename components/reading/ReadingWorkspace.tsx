'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { VocabWord, GrammarNote } from '@/lib/db';
import PassHeader from './PassHeader';
import ArticleRenderer, { getSentencesFromText, type RenderMode } from './ArticleRenderer';
import VocabPhase, { VocabRefPanel } from './VocabPhase';

interface Props {
  dateStr: string;
  tasksDone: number[];
  onTaskTick: (taskId: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortVocabByAppearance(text: string, vocab: VocabWord[]): VocabWord[] {
  const lower = text.toLowerCase();
  return [...vocab].sort((a, b) => {
    const ia = lower.indexOf(a.word.toLowerCase());
    const ib = lower.indexOf(b.word.toLowerCase());
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  });
}

const PASS_CONFIG: Record<number, { label: string; buttonLabel: string; mode: RenderMode }> = {
  1: { label: '第1遍 · 通读，点击标记生词', buttonLabel: '第一遍完成 →', mode: 'vocab-mark' },
  3: { label: '第2遍 · 带着释义纸复读', buttonLabel: '第二遍完成 →', mode: 'vocab-show' },
  4: { label: '第3遍 · 再读一遍，越来越顺', buttonLabel: '第三遍完成 →', mode: 'vocab-show' },
  5: { label: '第4遍 · 点击标记读不懂的句子', buttonLabel: '第四遍完成 →', mode: 'sentence-mark' },
  6: { label: '第5遍 · 查语法书，填写笔记', buttonLabel: '第五遍完成 →', mode: 'sentence-show' },
  7: { label: '第6遍 · 从头顺读，轻松通畅', buttonLabel: '第六遍完成 →', mode: 'clean' },
  8: { label: '第7遍 · 直接读，意思自然浮现', buttonLabel: '第七遍完成 · 同步生词到欧陆 →', mode: 'clean' },
};

/* ─ Sub-components ────────────────────────────────────────────────────────── */

function ActionBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-lg pv-btn disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
      {children}
    </button>
  );
}

function ResetBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-1.5 rounded-lg cursor-pointer transition-opacity"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'var(--color-ink)',
        opacity: 0.3,
        border: '1px dashed rgba(0,0,0,0.15)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.3'; }}
    >
      重置这篇文章
    </button>
  );
}

/* ─ Main component ────────────────────────────────────────────────────────── */

export default function ReadingWorkspace({ dateStr, tasksDone, onTaskTick }: Props) {
  const [pass, setPass] = useState(0);
  const [articleText, setArticleText] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [grammarNotes, setGrammarNotes] = useState<GrammarNote[]>([]);
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  const [highlightedSentences, setHighlightedSentences] = useState<Set<number>>(new Set());
  const [shuffledDefs, setShuffledDefs] = useState<string[]>([]);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (!dateStr) return;
    fetch(`/api/article?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data) {
          setPass(0); setArticleText(''); setArticleUrl('');
          setVocabWords([]); setGrammarNotes([]);
          setHighlightedWords(new Set()); setHighlightedSentences(new Set());
          return;
        }
        const vw: VocabWord[] = data.vocab_words ?? [];
        const gn: GrammarNote[] = data.grammar_notes ?? [];
        setPass(data.reading_pass ?? 0);
        setArticleText(data.article_text ?? '');
        setArticleUrl(data.article_url ?? '');
        setVocabWords(vw); setGrammarNotes(gn);
        setHighlightedWords(new Set(vw.map((v: VocabWord) => v.word.toLowerCase())));
        setHighlightedSentences(new Set(gn.map((n: GrammarNote) => n.sentenceIndex)));
        setShuffledDefs(shuffle(vw.map((v: VocabWord) => v.definition)));
      }).catch(console.error);
  }, [dateStr]);

  const saveAll = useCallback((p: number, text: string, url: string, vw: VocabWord[], gn: GrammarNote[]) => {
    fetch('/api/article', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateStr, article_text: text, article_url: url, vocab_words: vw, grammar_notes: gn, reading_pass: p }),
    }).catch(console.error);
  }, [dateStr]);

  const debouncedSave = useCallback((p: number, text: string, url: string, vw: VocabWord[], gn: GrammarNote[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveAll(p, text, url, vw, gn), 600);
  }, [saveAll]);

  const immediateSave = useCallback((p: number, text: string, url: string, vw: VocabWord[], gn: GrammarNote[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveAll(p, text, url, vw, gn);
  }, [saveAll]);

  const handleWordToggle = useCallback((wordKey: string) => {
    setHighlightedWords((prev) => {
      const next = new Set(prev);
      let nextVocab: VocabWord[];
      if (next.has(wordKey)) {
        next.delete(wordKey);
        nextVocab = vocabWords.filter((v) => v.word.toLowerCase() !== wordKey);
      } else {
        next.add(wordKey);
        const matchInText = articleText.match(new RegExp(`\\b${wordKey}\\b`, 'i'));
        const word = matchInText ? matchInText[0] : wordKey;
        nextVocab = vocabWords.find((v) => v.word.toLowerCase() === wordKey)
          ? vocabWords : [...vocabWords, { word, definition: '' }];
      }
      setVocabWords(nextVocab);
      debouncedSave(pass, articleText, articleUrl, nextVocab, grammarNotes);
      return next;
    });
  }, [vocabWords, articleText, articleUrl, grammarNotes, pass, debouncedSave]);

  const handleSentenceToggle = useCallback((idx: number, _sentence: string) => {
    setHighlightedSentences((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      debouncedSave(pass, articleText, articleUrl, vocabWords, grammarNotes);
      return next;
    });
  }, [pass, articleText, articleUrl, vocabWords, grammarNotes, debouncedSave]);

  const handleGrammarNoteChange = useCallback((sentenceIndex: number, note: string) => {
    setGrammarNotes((prev) => {
      const next = prev.map((n) => n.sentenceIndex === sentenceIndex ? { ...n, note } : n);
      debouncedSave(pass, articleText, articleUrl, vocabWords, next);
      return next;
    });
  }, [pass, articleText, articleUrl, vocabWords, debouncedSave]);

  const handleDefinitionChange = useCallback((word: string, definition: string) => {
    setVocabWords((prev) => {
      const next = prev.map((v) => v.word === word ? { ...v, definition } : v);
      debouncedSave(pass, articleText, articleUrl, next, grammarNotes);
      return next;
    });
  }, [pass, articleText, articleUrl, grammarNotes, debouncedSave]);

  const advancePass = useCallback(async (nextPass: number) => {
    let nextVocab = vocabWords;
    let nextGrammar = grammarNotes;
    if (nextPass === 6) {
      const sentences = getSentencesFromText(articleText);
      nextGrammar = Array.from(highlightedSentences).sort((a, b) => a - b).map((idx) => {
        const existing = grammarNotes.find((n) => n.sentenceIndex === idx);
        const sentText = sentences.find((s) => s.index === idx)?.text ?? '';
        return existing ?? { sentenceIndex: idx, sentence: sentText, note: '' };
      });
      setGrammarNotes(nextGrammar);
    }
    if (nextPass === 3) {
      const sorted = sortVocabByAppearance(articleText, nextVocab);
      setVocabWords(sorted); nextVocab = sorted;
      setShuffledDefs(shuffle(nextVocab.map((v) => v.definition)));
    }
    setPass(nextPass); setFadeKey((k) => k + 1);
    immediateSave(nextPass, articleText, articleUrl, nextVocab, nextGrammar);
    if (nextPass === 2) onTaskTick(2);
    if (nextPass === 5) onTaskTick(4);
    if (nextPass === 6) onTaskTick(5);
    if (nextPass === 7) onTaskTick(6);
    if (nextPass === 8) onTaskTick(8);
  }, [vocabWords, grammarNotes, articleText, articleUrl, highlightedSentences, immediateSave, onTaskTick]);

  const handleStart = () => {
    if (!articleText.trim()) return;
    setPass(1); setFadeKey((k) => k + 1);
    immediateSave(1, articleText, articleUrl, [], []);
  };

  const handleReset = () => {
    if (!window.confirm('确认重置这篇文章？所有标注和笔记将清除。')) return;
    setPass(0); setArticleText(''); setArticleUrl('');
    setVocabWords([]); setGrammarNotes([]);
    setHighlightedWords(new Set()); setHighlightedSentences(new Set());
    setFadeKey((k) => k + 1);
    immediateSave(0, '', '', [], []);
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg('');
    try {
      const sentences = getSentencesFromText(articleText);
      const contextMap = new Map<string, string>();
      for (const { text: sentText } of sentences) {
        const lc = sentText.toLowerCase();
        for (const v of vocabWords) {
          if (!contextMap.has(v.word) && lc.includes(v.word.toLowerCase())) {
            contextMap.set(v.word, sentText);
          }
        }
      }
      const words = vocabWords
        .filter((v) => v.word)
        .map((v) => ({ word: v.word, context: contextMap.get(v.word) ?? '' }));
      const res = await fetch('/api/eudic/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words }),
      });
      const data = await res.json() as { synced?: number; errors?: number; error?: string };
      if (res.ok) {
        const errNote = data.errors ? `（${data.errors} 个失败）` : '';
        setSyncMsg(`已同步 ${data.synced ?? 0} 个生词到欧陆词典 ✓${errNote}`);
        const nextPass = 9;
        setPass(nextPass); setFadeKey((k) => k + 1);
        immediateSave(nextPass, articleText, articleUrl, vocabWords, grammarNotes);
        onTaskTick(7); onTaskTick(9);
      } else {
        setSyncMsg(data.error ?? '同步失败');
      }
    } finally { setSyncing(false); }
  };

  const sortedVocab = useMemo(() => sortVocabByAppearance(articleText, vocabWords), [articleText, vocabWords]);
  const vocabCount = vocabWords.length;
  const sentenceCount = highlightedSentences.size;
  const cfg = PASS_CONFIG[pass];

  void tasksDone;

  /* ─ State 0: idle ──────────────────────────────────────────────────────── */
  if (pass === 0) {
    return (
      <div className="flex flex-col h-full p-6 md:p-8 space-y-5">
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.8rem',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--color-ink)',
              lineHeight: 1.0,
            }}
          >
            辅助精读工作区
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              opacity: 0.5,
              marginTop: '8px',
              color: 'var(--color-ink)',
            }}
          >
            粘贴文章后开始七遍精读流程
          </p>
        </div>

        <hr className="hotel-divider" />

        <input
          type="url"
          value={articleUrl}
          onChange={(e) => setArticleUrl(e.target.value)}
          placeholder="文章链接（选填）"
          className="w-full outline-none rounded-lg px-4 py-2.5 transition-colors"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            background: 'var(--bg-2)',
            border: '1px solid rgba(0,0,0,0.10)',
            color: 'var(--color-ink)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-terracotta)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(198,93,59,0.08)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        />

        <textarea
          value={articleText}
          onChange={(e) => setArticleText(e.target.value)}
          placeholder="将今天的文章粘贴到这里…"
          className="flex-1 min-h-[200px] resize-none outline-none rounded-lg px-4 py-3 transition-colors"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '17px',
            fontWeight: 300,
            lineHeight: 1.7,
            background: 'var(--bg-2)',
            border: '1px solid rgba(0,0,0,0.10)',
            color: 'var(--color-ink)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-terracotta)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(198,93,59,0.08)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        />

        <ActionBtn onClick={handleStart} disabled={!articleText.trim()}>
          开始第一遍阅读 →
        </ActionBtn>
      </div>
    );
  }

  /* ─ State 9: done ──────────────────────────────────────────────────────── */
  if (pass === 9) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        {/* Decorative stamp circle */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '9999px',
            border: '1.5px solid rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '9999px',
              border: '1px dashed rgba(0,0,0,0.20)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta)' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        </div>

        <div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.5rem',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--color-terracotta)',
              lineHeight: 1.0,
            }}
          >
            今天的精读完成！
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              opacity: 0.5,
              marginTop: '12px',
              color: 'var(--color-ink)',
            }}
          >
            共读了 7 遍 · 同步了 {vocabCount} 个生词
          </p>
        </div>

        {syncMsg && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              padding: '8px 16px',
              borderRadius: '9999px',
              background: 'rgba(255,194,51,0.15)',
              color: 'var(--color-ink)',
              border: '1px solid rgba(255,194,51,0.30)',
            }}
          >
            {syncMsg}
          </p>
        )}

        <button
          onClick={handleReset}
          className="pv-btn px-6 py-2.5 rounded-lg"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            border: '1px solid rgba(0,0,0,0.12)',
            color: 'var(--color-ink)',
            opacity: 0.5,
            background: 'transparent',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.5'; }}
        >
          重置这篇文章
        </button>
      </div>
    );
  }

  /* ─ State 2: vocab definition ──────────────────────────────────────────── */
  if (pass === 2) {
    return (
      <div className="flex flex-col h-full">
        <PassHeader readingPass={pass} label="查生词：只记这篇文章里的意思" subLabel={`${vocabCount} 个生词`} />
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <VocabPhase vocabWords={sortedVocab} onDefinitionChange={handleDefinitionChange} onStart2nd={() => advancePass(3)} />
        </div>
        <div className="flex-shrink-0 px-6 py-3" style={{ borderTop: '1px dashed rgba(0,0,0,0.12)' }}>
          <ResetBtn onClick={handleReset} />
        </div>
      </div>
    );
  }

  /* ─ Reading passes (1, 3-8) ─────────────────────────────────────────────── */
  const showVocabRef = pass === 3 || pass === 4;

  return (
    <div className="flex flex-col h-full">
      <PassHeader
        readingPass={pass}
        label={cfg?.label ?? ''}
        subLabel={
          pass === 1 ? `已标记 ${vocabCount} 个生词` :
          pass === 5 ? `已标记 ${sentenceCount} 个难句` : undefined
        }
      />

      <div key={fadeKey} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 animate-[fadeIn_0.2s_ease]">
        {showVocabRef && (
          <VocabRefPanel vocabWords={sortedVocab} shuffledDefs={shuffledDefs} />
        )}
        <ArticleRenderer
          text={articleText}
          mode={cfg?.mode ?? 'clean'}
          highlightedWords={highlightedWords}
          highlightedSentences={highlightedSentences}
          grammarNotes={grammarNotes}
          onWordToggle={pass === 1 ? handleWordToggle : undefined}
          onSentenceToggle={pass === 5 ? handleSentenceToggle : undefined}
          onGrammarNoteChange={pass === 6 ? handleGrammarNoteChange : undefined}
        />
      </div>

      <div
        className="flex-shrink-0 px-6 py-4 space-y-2"
        style={{
          borderTop: '1px dashed rgba(0,0,0,0.12)',
          background: 'var(--bg-1)',
        }}
      >
        {syncMsg && (
          <p
            className="text-center py-1.5 px-3 rounded-lg"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'var(--color-ink)',
              background: 'rgba(255,194,51,0.15)',
              border: '1px solid rgba(255,194,51,0.25)',
            }}
          >
            {syncMsg}
          </p>
        )}
        {pass === 8 ? (
          <ActionBtn onClick={handleSync} disabled={syncing}>
            {syncing ? '同步中…' : cfg.buttonLabel}
          </ActionBtn>
        ) : (
          <ActionBtn onClick={() => advancePass(pass + 1)}>
            {cfg?.buttonLabel ?? '继续 →'}
          </ActionBtn>
        )}
        <ResetBtn onClick={handleReset} />
      </div>
    </div>
  );
}
