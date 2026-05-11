'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { VocabWord, GrammarNote } from '@/lib/db';
import ArticleRenderer, { getSentencesFromText } from '@/components/reading/ArticleRenderer';
import type { RenderMode } from '@/components/reading/ArticleRenderer';
import { formatDateDisplay, formatDateDot, getDayNumber } from '@/lib/dateUtils';

interface ReadingNotebookProps {
  onClose: () => void;
  dateStr: string;       // Today's date (from task log navigation)
  articlesCount: number;
  onTaskTick: (taskId: number) => void;
  onPassChange: (pass: number) => void;
  onVocabChange: (words: VocabWord[]) => void;
  onGrammarChange: (notes: GrammarNote[]) => void;
  onSyncComplete: () => void;
}

interface HistoryItem {
  dateStr: string;
  dayNumber: number;
  readingPass: number;
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

const PASS_TABS = [
  { roman: 'I',   label: 'READ',    passes: [1] },
  { roman: '—',  label: 'LOOK UP', passes: [2] },
  { roman: 'II',  label: 'REREAD',  passes: [3, 4] },
  { roman: 'IV',  label: 'SYNTAX',  passes: [5] },
  { roman: 'V',   label: 'GRAMMAR', passes: [6] },
  { roman: 'VI',  label: 'FLOW',    passes: [7, 8] },
];

const PASS_MODE: Record<number, RenderMode> = {
  1: 'vocab-mark', 2: 'clean', 3: 'vocab-show', 4: 'vocab-show',
  5: 'sentence-mark', 6: 'sentence-show', 7: 'clean', 8: 'clean', 9: 'clean',
};

function passLabel(p: number) {
  if (p === 0) return 'NOT STARTED';
  if (p >= 9)  return 'COMPLETE';
  return `PASS ${p} / 7`;
}

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.87"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════ */

export default function ReadingNotebook({
  onClose, dateStr, articlesCount,
  onTaskTick, onPassChange, onVocabChange, onGrammarChange, onSyncComplete,
}: ReadingNotebookProps) {
  // ── Viewing date (can differ from today's dateStr when browsing history) ──
  const [viewingDate, setViewingDate] = useState(dateStr);
  const isToday = viewingDate === dateStr;

  // ── Article history list ──────────────────────────────────────────────────
  const [articleHistory, setArticleHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Article / reading state ───────────────────────────────────────────────
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

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (showHistory) setShowHistory(false); else onClose(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, showHistory]);

  // ── Fetch article history list on mount ───────────────────────────────────
  useEffect(() => {
    fetch('/api/records?all=true')
      .then(r => r.json())
      .then((data: { date_str: string; day_number: number; reading_pass: number }[]) => {
        const items = data
          .filter(r => r.reading_pass > 0)
          .map(r => ({ dateStr: r.date_str, dayNumber: r.day_number, readingPass: r.reading_pass }))
          .sort((a, b) => b.dayNumber - a.dayNumber);
        setArticleHistory(items);
      })
      .catch(console.error);
  }, []);

  // ── Load article data when viewingDate changes ────────────────────────────
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (!viewingDate) return;
    setSyncMsg('');
    fetch(`/api/article?date=${viewingDate}`)
      .then(r => r.json())
      .then((data) => {
        if (!data) {
          setPass(0); setArticleText(''); setArticleUrl('');
          setVocabWords([]); setGrammarNotes([]);
          setHighlightedWords(new Set()); setHighlightedSentences(new Set());
          if (isToday) { onPassChange(0); onVocabChange([]); onGrammarChange([]); }
          return;
        }
        const vw: VocabWord[] = data.vocab_words ?? [];
        const gn: GrammarNote[] = data.grammar_notes ?? [];
        const p: number = data.reading_pass ?? 0;
        setPass(p); setArticleText(data.article_text ?? '');
        setArticleUrl(data.article_url ?? '');
        setVocabWords(vw); setGrammarNotes(gn);
        setHighlightedWords(new Set(vw.map((v: VocabWord) => v.word.toLowerCase())));
        setHighlightedSentences(new Set(gn.map((n: GrammarNote) => n.sentenceIndex)));
        setShuffledDefs(shuffle(vw.map((v: VocabWord) => v.definition)));
        if (isToday) {
          onPassChange(p); onVocabChange(vw); onGrammarChange(gn);
          if (p >= 9) onSyncComplete();
        }
      }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingDate]);

  // ── Save helpers (always save to viewingDate, not dateStr prop) ───────────
  const saveAll = useCallback((p: number, text: string, url: string, vw: VocabWord[], gn: GrammarNote[]) => {
    fetch('/api/article', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateStr: viewingDate, article_text: text, article_url: url, vocab_words: vw, grammar_notes: gn, reading_pass: p }),
    }).catch(console.error);
  }, [viewingDate]);

  const debouncedSave = useCallback((p: number, text: string, url: string, vw: VocabWord[], gn: GrammarNote[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveAll(p, text, url, vw, gn), 600);
  }, [saveAll]);

  const immediateSave = useCallback((p: number, text: string, url: string, vw: VocabWord[], gn: GrammarNote[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveAll(p, text, url, vw, gn);
  }, [saveAll]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleWordToggle = useCallback((wordKey: string) => {
    setHighlightedWords(prev => {
      const next = new Set(prev);
      let nextVocab: VocabWord[];
      if (next.has(wordKey)) {
        next.delete(wordKey);
        nextVocab = vocabWords.filter(v => v.word.toLowerCase() !== wordKey);
      } else {
        next.add(wordKey);
        const match = articleText.match(new RegExp(`\\b${wordKey}\\b`, 'i'));
        const word = match ? match[0] : wordKey;
        nextVocab = vocabWords.find(v => v.word.toLowerCase() === wordKey)
          ? vocabWords : [...vocabWords, { word, definition: '' }];
      }
      setVocabWords(nextVocab);
      if (isToday) onVocabChange(nextVocab);
      debouncedSave(pass, articleText, articleUrl, nextVocab, grammarNotes);
      return next;
    });
  }, [vocabWords, articleText, articleUrl, grammarNotes, pass, debouncedSave, onVocabChange, isToday]);

  const handleSentenceToggle = useCallback((idx: number, _sentence: string) => {
    setHighlightedSentences(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      debouncedSave(pass, articleText, articleUrl, vocabWords, grammarNotes);
      return next;
    });
  }, [pass, articleText, articleUrl, vocabWords, grammarNotes, debouncedSave]);

  const handleGrammarNoteChange = useCallback((sentenceIndex: number, note: string) => {
    setGrammarNotes(prev => {
      const next = prev.map(n => n.sentenceIndex === sentenceIndex ? { ...n, note } : n);
      if (isToday) onGrammarChange(next);
      debouncedSave(pass, articleText, articleUrl, vocabWords, next);
      return next;
    });
  }, [pass, articleText, articleUrl, vocabWords, debouncedSave, onGrammarChange, isToday]);

  const handleDefinitionChange = useCallback((word: string, definition: string) => {
    setVocabWords(prev => {
      const next = prev.map(v => v.word === word ? { ...v, definition } : v);
      if (isToday) onVocabChange(next);
      debouncedSave(pass, articleText, articleUrl, next, grammarNotes);
      return next;
    });
  }, [pass, articleText, articleUrl, grammarNotes, debouncedSave, onVocabChange, isToday]);

  const advancePass = useCallback(async (nextPass: number) => {
    let nextVocab = vocabWords;
    let nextGrammar = grammarNotes;
    if (nextPass === 6) {
      const sentences = getSentencesFromText(articleText);
      nextGrammar = Array.from(highlightedSentences).sort((a, b) => a - b).map(idx => {
        const existing = grammarNotes.find(n => n.sentenceIndex === idx);
        const sentText = sentences.find(s => s.index === idx)?.text ?? '';
        return existing ?? { sentenceIndex: idx, sentence: sentText, note: '' };
      });
      setGrammarNotes(nextGrammar);
      if (isToday) onGrammarChange(nextGrammar);
    }
    if (nextPass === 3) {
      const sorted = sortVocabByAppearance(articleText, nextVocab);
      setVocabWords(sorted); nextVocab = sorted;
      if (isToday) onVocabChange(sorted);
      setShuffledDefs(shuffle(nextVocab.map(v => v.definition)));
    }
    setPass(nextPass); setFadeKey(k => k + 1);
    if (isToday) {
      onPassChange(nextPass);
      if (nextPass === 2) onTaskTick(2);
      if (nextPass === 5) onTaskTick(4);
      if (nextPass === 6) onTaskTick(5);
      if (nextPass === 7) onTaskTick(6);
      if (nextPass === 8) onTaskTick(8);
    }
    immediateSave(nextPass, articleText, articleUrl, nextVocab, nextGrammar);
    // Refresh history list when article is started
    if (nextPass === 1) {
      setArticleHistory(prev => {
        const exists = prev.find(h => h.dateStr === viewingDate);
        if (exists) return prev.map(h => h.dateStr === viewingDate ? { ...h, readingPass: 1 } : h);
        return [{ dateStr: viewingDate, dayNumber: getDayNumber(viewingDate), readingPass: 1 }, ...prev];
      });
    }
  }, [vocabWords, grammarNotes, articleText, articleUrl, highlightedSentences, immediateSave, isToday, onTaskTick, onPassChange, onVocabChange, onGrammarChange, viewingDate]);

  const handleStart = () => {
    if (!articleText.trim()) return;
    setPass(1); setFadeKey(k => k + 1);
    if (isToday) onPassChange(1);
    immediateSave(1, articleText, articleUrl, [], []);
    setArticleHistory(prev => {
      const exists = prev.find(h => h.dateStr === viewingDate);
      if (exists) return prev;
      return [{ dateStr: viewingDate, dayNumber: getDayNumber(viewingDate), readingPass: 1 }, ...prev];
    });
  };

  const handleReset = () => {
    if (!window.confirm('Reset this article? All annotations and notes will be cleared.')) return;
    setPass(0); setArticleText(''); setArticleUrl('');
    setVocabWords([]); setGrammarNotes([]);
    setHighlightedWords(new Set()); setHighlightedSentences(new Set());
    setFadeKey(k => k + 1);
    if (isToday) { onPassChange(0); onVocabChange([]); onGrammarChange([]); }
    immediateSave(0, '', '', [], []);
    setArticleHistory(prev => prev.filter(h => h.dateStr !== viewingDate));
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
      const words = vocabWords.filter(v => v.word).map(v => ({ word: v.word, context: contextMap.get(v.word) ?? '' }));
      const res = await fetch('/api/eudic/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words }),
      });
      const data = await res.json() as { synced?: number; errors?: number; error?: string };
      if (res.ok) {
        const errNote = data.errors ? ` (${data.errors} failed)` : '';
        setSyncMsg(`Synced ${data.synced ?? 0} words to Eudic${errNote}`);
        const nextPass = 9;
        setPass(nextPass); setFadeKey(k => k + 1);
        if (isToday) { onPassChange(nextPass); onTaskTick(7); onTaskTick(9); onSyncComplete(); }
        immediateSave(nextPass, articleText, articleUrl, vocabWords, grammarNotes);
        setArticleHistory(prev => prev.map(h => h.dateStr === viewingDate ? { ...h, readingPass: 9 } : h));
      } else {
        setSyncMsg(data.error ?? 'Sync failed');
      }
    } finally { setSyncing(false); }
  };

  // ── Navigate to a historical article ─────────────────────────────────────
  const navigateToDate = (d: string) => {
    setViewingDate(d);
    setShowHistory(false);
    setPass(0); setArticleText(''); // Will be overwritten by the useEffect
  };

  const sortedVocab = useMemo(() => sortVocabByAppearance(articleText, vocabWords), [articleText, vocabWords]);
  const renderMode: RenderMode = PASS_MODE[pass] ?? 'clean';

  /* ── Completion receipt (pass 9) ───────────────────────────────────────── */
  if (pass === 9 && !showHistory) {
    return (
      <div style={{ width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(31,31,31,0.55)', position:'fixed', inset:0, zIndex:100, backdropFilter:'blur(2px)', padding:'16px' }}>
        <div style={{ background:'var(--color-paper)', borderRadius:'4px', padding:'48px', maxWidth:'480px', width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.45)', animation:'notebook-open 0.25s ease', position:'relative' }}>
          <button onClick={onClose} className="circle-btn-sm" style={{ position:'absolute', top:16, right:16 }} aria-label="Close">
            <CloseIcon />
          </button>
          <div className="wax-seal" style={{ margin:'0 auto 24px', width:80, height:80 }}>
            <div className="wax-seal-inner" style={{ width:66, height:66 }}><CheckIcon /></div>
          </div>
          <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'2.5rem', fontWeight:300, color:'var(--color-terracotta)', lineHeight:1, marginBottom:'8px' }}>
            Reading Complete
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.2em', opacity:0.5, color:'var(--color-ink)', marginBottom:'24px' }}>
            7 PASSES · {vocabWords.length} WORDS · {formatDateDisplay(viewingDate)}
          </div>
          {syncMsg && (
            <div style={{ padding:'8px 16px', borderRadius:'9999px', background:'rgba(255,194,51,0.15)', border:'1px solid rgba(255,194,51,0.3)', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--color-ink)', marginBottom:'20px' }}>
              {syncMsg}
            </div>
          )}
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', borderTop:'2px dashed rgba(31,31,31,0.1)', paddingTop:'16px' }}>
            <button onClick={handleReset} style={{ fontFamily:'var(--font-mono)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-ink)', opacity:0.4, background:'none', border:'1px dashed rgba(31,31,31,0.2)', borderRadius:'4px', padding:'8px 16px', cursor:'pointer' }}>RESET</button>
            <button onClick={() => setShowHistory(true)} style={{ fontFamily:'var(--font-mono)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-ink)', background:'rgba(31,31,31,0.07)', border:'none', borderRadius:'4px', padding:'8px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
              <HistoryIcon />HISTORY
            </button>
            <button onClick={onClose} style={{ fontFamily:'var(--font-mono)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-paper)', background:'var(--color-ink)', border:'none', borderRadius:'4px', padding:'8px 16px', cursor:'pointer' }}>CLOSE ✓</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main notebook spread ──────────────────────────────────────────────── */
  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(31,31,31,0.55)', position:'fixed', inset:0, zIndex:100, backdropFilter:'blur(2px)', padding:'16px' }}>
      <div style={{ display:'flex', width:'min(96vw, 1200px)', height:'min(90vh, 760px)', borderRadius:'4px', boxShadow:'0 32px 80px rgba(0,0,0,0.45)', overflow:'hidden', animation:'notebook-open 0.25s ease' }}>

        {/* ── LEFT PAGE — Article ─────────────────────────────────────────── */}
        <div className="notebook-page-left lined-paper" style={{ flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column' }}>
          <div className="page-header-strip">
            <span>READING LOG</span>
            <span style={{ color: isToday ? 'var(--color-ink)' : 'var(--color-terracotta)', opacity: isToday ? 0.6 : 1 }}>
              {isToday ? `ARTICLE ${articlesCount}` : `DAY ${getDayNumber(viewingDate)} — ARCHIVE`}
            </span>
          </div>

          {/* Top bar */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', marginTop:'8px' }}>
            <button onClick={onClose} className="circle-btn-sm" aria-label="Close" title="Close (Esc)"><CloseIcon /></button>
            {/* Archive badge + back-to-today */}
            {!isToday && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.15em', padding:'3px 10px', background:'rgba(198,93,59,0.1)', border:'1px solid rgba(198,93,59,0.2)', borderRadius:'9999px', color:'var(--color-terracotta)' }}>
                  {formatDateDisplay(viewingDate)}
                </span>
                <button
                  onClick={() => { setViewingDate(dateStr); setPass(0); }}
                  style={{ fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-terracotta)', background:'none', border:'none', cursor:'pointer', opacity:0.8 }}
                >
                  ← TODAY
                </button>
              </div>
            )}
            {pass > 0 && articleUrl && (
              <a href={articleUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:'var(--font-mono)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-terracotta)', opacity:0.7, textDecoration:'none', marginLeft:'auto' }}>
                SOURCE ↗
              </a>
            )}
          </div>

          {/* Article */}
          <div key={fadeKey} style={{ flex:1, overflowY:'auto', paddingRight:'4px' }}>
            {pass === 0 ? (
              <div style={{ opacity:0.3, fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.1rem', fontWeight:300, color:'var(--color-ink)', paddingTop:'32px', lineHeight:1.7 }}>
                {isToday
                  ? "Paste today's article on the right to begin the seven-pass intensive reading workflow."
                  : "No article recorded for this date."}
              </div>
            ) : (
              <ArticleRenderer
                text={articleText}
                mode={renderMode}
                highlightedWords={highlightedWords}
                highlightedSentences={highlightedSentences}
                grammarNotes={grammarNotes}
                onWordToggle={pass === 1 ? handleWordToggle : undefined}
                onSentenceToggle={pass === 5 ? handleSentenceToggle : undefined}
                onGrammarNoteChange={pass === 6 ? handleGrammarNoteChange : undefined}
              />
            )}
          </div>
        </div>

        {/* ── Spine ──────────────────────────────────────────────────────── */}
        <div style={{ width:'20px', minWidth:'20px', background:'linear-gradient(to right, rgba(31,31,31,0.12), rgba(31,31,31,0.04), transparent)', flexShrink:0 }} />

        {/* ── RIGHT PAGE ─────────────────────────────────────────────────── */}
        <div style={{ flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column', background:'var(--color-paper)' }}>

          {/* Book tabs (hidden in history view) */}
          {pass > 0 && !showHistory && (
            <div style={{ display:'flex', gap:'2px', borderBottom:'1px solid rgba(31,31,31,0.08)', flexShrink:0, overflowX:'auto' }}>
              {PASS_TABS.map(tab => {
                const isActive = tab.passes.includes(pass);
                const isPast = Math.max(...tab.passes) < pass;
                return (
                  <div key={tab.roman} className="book-tab" style={{ background: isActive ? 'var(--color-terracotta)' : isPast ? 'rgba(31,31,31,0.06)' : 'rgba(31,31,31,0.03)', color: isActive ? 'var(--color-paper)' : isPast ? 'rgba(31,31,31,0.35)' : 'rgba(31,31,31,0.5)', borderColor: isActive ? 'var(--color-terracotta)' : 'rgba(31,31,31,0.1)', marginTop: isActive ? '0' : '4px', cursor:'default', whiteSpace:'nowrap', padding:'6px 10px' }}>
                    {tab.roman} {tab.label}
                  </div>
                );
              })}
              {/* History toggle */}
              <button
                onClick={() => setShowHistory(true)}
                style={{ marginLeft:'auto', marginTop:'4px', padding:'4px 10px', background:'transparent', border:'1px solid rgba(31,31,31,0.1)', borderRadius:'4px 4px 0 0', borderBottom:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(31,31,31,0.45)' }}
                title="Browse past articles"
              >
                <HistoryIcon />HISTORY
              </button>
            </div>
          )}

          {/* History mode header */}
          {showHistory && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 20px', borderBottom:'1px solid rgba(31,31,31,0.08)', flexShrink:0 }}>
              <button onClick={() => setShowHistory(false)} style={{ fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-ink)', background:'none', border:'none', cursor:'pointer', opacity:0.5, display:'flex', alignItems:'center', gap:'4px' }}>
                ← BACK
              </button>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.2em', opacity:0.45, color:'var(--color-ink)' }}>
                READING HISTORY — {articleHistory.length} ARTICLE{articleHistory.length !== 1 ? 'S' : ''}
              </span>
            </div>
          )}

          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {showHistory ? (
              /* ── History panel ─────────────────────────────────────────── */
              <HistoryPanel
                history={articleHistory}
                viewingDate={viewingDate}
                todayDate={dateStr}
                onSelect={navigateToDate}
              />
            ) : (
              /* ── Pass-specific tools ───────────────────────────────────── */
              <RightPanel
                pass={pass}
                isToday={isToday}
                articleText={articleText}
                articleUrl={articleUrl}
                vocabWords={sortedVocab}
                grammarNotes={grammarNotes}
                vocabCount={vocabWords.length}
                sentenceCount={highlightedSentences.size}
                shuffledDefs={shuffledDefs}
                syncMsg={syncMsg}
                syncing={syncing}
                onArticleTextChange={setArticleText}
                onArticleUrlChange={setArticleUrl}
                onDefinitionChange={handleDefinitionChange}
                onStart={handleStart}
                onAdvance={advancePass}
                onSync={handleSync}
                onReset={handleReset}
                onShowHistory={() => setShowHistory(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* History Panel                                                              */
/* ══════════════════════════════════════════════════════════════════════════ */

function HistoryPanel({ history, viewingDate, todayDate, onSelect }: {
  history: HistoryItem[];
  viewingDate: string;
  todayDate: string;
  onSelect: (dateStr: string) => void;
}) {
  if (history.length === 0) {
    return (
      <div style={{ padding:'28px', fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.1rem', fontWeight:300, color:'var(--color-ink)', opacity:0.35, lineHeight:1.7 }}>
        No articles recorded yet. Open the Reading Log and paste an article to begin.
      </div>
    );
  }

  return (
    <div style={{ overflowY:'auto', flex:1 }}>
      {/* Today's article at top if exists */}
      {history.find(h => h.dateStr === todayDate) === undefined && (
        <div style={{ padding:'12px 28px', borderBottom:'1px dashed rgba(31,31,31,0.06)' }}>
          <button
            onClick={() => onSelect(todayDate)}
            style={{ background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%', padding:0 }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--color-terracotta)', letterSpacing:'0.15em' }}>TODAY — NOT STARTED</span>
            </div>
          </button>
        </div>
      )}

      {history.map(item => {
        const isActive = item.dateStr === viewingDate;
        const isItemToday = item.dateStr === todayDate;
        return (
          <button
            key={item.dateStr}
            onClick={() => onSelect(item.dateStr)}
            style={{ width:'100%', textAlign:'left', background: isActive ? 'rgba(198,93,59,0.06)' : 'transparent', border:'none', borderBottom:'1px dashed rgba(31,31,31,0.06)', padding:'14px 28px', cursor:'pointer', transition:'background 0.15s' }}
          >
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
              <div style={{ flex:1 }}>
                {/* Date + today badge */}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color: isActive ? 'var(--color-terracotta)' : 'var(--color-ink)', letterSpacing:'0.1em', opacity: isActive ? 1 : 0.75 }}>
                    {formatDateDot(item.dateStr)}
                  </span>
                  {isItemToday && (
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'7px', textTransform:'uppercase', letterSpacing:'0.15em', padding:'1px 6px', background:'var(--color-terracotta)', color:'var(--color-paper)', borderRadius:'9999px' }}>TODAY</span>
                  )}
                  {isActive && !isItemToday && (
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'7px', textTransform:'uppercase', letterSpacing:'0.15em', padding:'1px 6px', background:'rgba(198,93,59,0.12)', color:'var(--color-terracotta)', borderRadius:'9999px' }}>VIEWING</span>
                  )}
                </div>
                {/* Day + date display */}
                <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1rem', fontWeight:300, color:'var(--color-ink)', opacity:0.75 }}>
                  Day {item.dayNumber} &mdash; {formatDateDisplay(item.dateStr)}
                </div>
              </div>
              {/* Pass status badge */}
              <div style={{ flexShrink:0, fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.12em', padding:'3px 8px', borderRadius:'9999px', border:'1px solid', borderColor: item.readingPass >= 9 ? 'rgba(74,124,78,0.3)' : 'rgba(31,31,31,0.12)', color: item.readingPass >= 9 ? '#4A7C4E' : 'rgba(31,31,31,0.45)', background: item.readingPass >= 9 ? 'rgba(74,124,78,0.07)' : 'transparent', marginTop:'2px' }}>
                {passLabel(item.readingPass)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Right-panel pass tools                                                     */
/* ══════════════════════════════════════════════════════════════════════════ */

interface RightPanelProps {
  pass: number;
  isToday: boolean;
  articleText: string; articleUrl: string;
  vocabWords: VocabWord[]; grammarNotes: GrammarNote[];
  vocabCount: number; sentenceCount: number;
  shuffledDefs: string[];
  syncMsg: string; syncing: boolean;
  onArticleTextChange: (v: string) => void;
  onArticleUrlChange: (v: string) => void;
  onDefinitionChange: (word: string, def: string) => void;
  onStart: () => void;
  onAdvance: (nextPass: number) => void;
  onSync: () => void;
  onReset: () => void;
  onShowHistory: () => void;
}

function RightPanel({
  pass, isToday, articleText, articleUrl, vocabWords, grammarNotes,
  vocabCount, sentenceCount, shuffledDefs, syncMsg, syncing,
  onArticleTextChange, onArticleUrlChange, onDefinitionChange,
  onStart, onAdvance, onSync, onReset, onShowHistory,
}: RightPanelProps) {
  const s: React.CSSProperties = { display:'flex', flexDirection:'column', gap:'16px', padding:'20px 28px', overflowY:'auto', flex:1 };
  const lbl: React.CSSProperties = { fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.18em', opacity:0.45, color:'var(--color-ink)' };

  const advBtn = (label: string, nextPass: number, disabled = false, accent = false) => (
    <button onClick={() => onAdvance(nextPass)} disabled={disabled}
      style={{ width:'100%', padding:'12px', background: accent ? 'var(--color-terracotta)' : 'var(--color-ink)', color: accent ? 'var(--color-paper)' : 'var(--color-mustard)', border:'none', borderRadius:'3px', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily:'var(--font-mono)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.15em', opacity: disabled ? 0.4 : 1 }}>
      {label}
    </button>
  );

  const resetBtn = () => (
    <button onClick={onReset} style={{ width:'100%', padding:'8px', background:'transparent', color:'var(--color-ink)', border:'1px dashed rgba(31,31,31,0.15)', borderRadius:'3px', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.15em', opacity:0.35 }}>
      RESET ARTICLE
    </button>
  );

  const histBtn = () => (
    <button onClick={onShowHistory} style={{ width:'100%', padding:'8px', background:'transparent', color:'var(--color-ink)', border:'1px solid rgba(31,31,31,0.1)', borderRadius:'3px', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.15em', opacity:0.45, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
      <HistoryIcon /> BROWSE PAST ARTICLES
    </button>
  );

  const stepsBlock = (steps: string[]) => (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', opacity:0.4, color:'var(--color-ink)', minWidth:'16px', paddingTop:'2px' }}>{i+1}.</span>
          <span style={{ fontFamily:'var(--font-utility)', fontSize:'12px', color:'var(--color-ink)', opacity:0.75, lineHeight:1.5 }}>{step}</span>
        </div>
      ))}
    </div>
  );

  /* Pass 0 — Article input */
  if (pass === 0) {
    return (
      <div style={s}>
        <div>
          <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.8rem', fontWeight:300, color:'var(--color-ink)', lineHeight:1, marginBottom:'6px' }}>Today&apos;s Article</div>
          <div style={{ ...lbl, marginBottom:'20px', opacity:0.5 }}>PASTE ARTICLE · BEGIN SEVEN-PASS READING</div>
        </div>
        <div>
          <div style={{ ...lbl, marginBottom:'6px' }}>ARTICLE URL (OPTIONAL)</div>
          <input type="url" value={articleUrl} onChange={e => onArticleUrlChange(e.target.value)} placeholder="https://www.sciencedaily.com/…"
            style={{ width:'100%', padding:'8px 12px', background:'rgba(31,31,31,0.04)', border:'1px solid rgba(31,31,31,0.12)', borderRadius:'3px', outline:'none', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--color-ink)' }} />
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ ...lbl, marginBottom:'6px' }}>ARTICLE TEXT</div>
          <textarea value={articleText} onChange={e => onArticleTextChange(e.target.value)} placeholder="Paste the full article text here…"
            style={{ flex:1, minHeight:'160px', padding:'12px', background:'rgba(31,31,31,0.04)', border:'1px solid rgba(31,31,31,0.12)', borderRadius:'3px', outline:'none', resize:'none', fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1rem', fontWeight:300, color:'var(--color-ink)', lineHeight:1.7 }} />
        </div>
        <button onClick={onStart} disabled={!articleText.trim()} style={{ padding:'14px', background: articleText.trim() ? 'var(--color-terracotta)' : 'rgba(31,31,31,0.1)', color: articleText.trim() ? 'var(--color-paper)' : 'rgba(31,31,31,0.3)', border:'none', borderRadius:'3px', cursor: articleText.trim() ? 'pointer' : 'not-allowed', fontFamily:'var(--font-mono)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.15em' }}>
          BEGIN PASS I — READ THROUGH →
        </button>
        {histBtn()}
      </div>
    );
  }

  if (pass === 1) return (
    <div style={s}>
      <div><div style={lbl}>PASS I OF 7 · VOCABULARY MARKING</div>
        <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.5rem', fontWeight:300, color:'var(--color-ink)', marginTop:'8px', lineHeight:1.2 }}>Read through and mark unknown words</div></div>
      {stepsBlock(["Read from beginning to end","Click any word you don't know to mark it","Grasp the general meaning — do not stop","No dictionary yet"])}
      <div style={{ padding:'12px', background:'rgba(255,194,51,0.12)', border:'1px solid rgba(255,194,51,0.25)', borderRadius:'3px' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-ink)', opacity:0.6 }}>WORDS MARKED: {vocabCount}</span>
      </div>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
        {advBtn('PASS I DONE → LOOK UP WORDS', 2)}
        {resetBtn()}
      </div>
    </div>
  );

  if (pass === 2) {
    const filled = vocabWords.filter(v => v.definition.trim()).length;
    return (
      <div style={s}>
        <div><div style={lbl}>LOOK UP · ONE MEANING ONLY</div>
          <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.5rem', fontWeight:300, color:'var(--color-ink)', marginTop:'8px', lineHeight:1.2 }}>Look up {vocabCount} unknown {vocabCount === 1 ? 'word' : 'words'}</div></div>
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
          {vocabWords.length === 0
            ? <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1rem', opacity:0.4, color:'var(--color-ink)' }}>No words marked.</div>
            : vocabWords.map((v, i) => (
              <div key={v.word} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', opacity:0.35, color:'var(--color-ink)', width:'18px', textAlign:'right', flexShrink:0 }}>{i+1}.</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--color-ink)', width:'110px', flexShrink:0 }}>{v.word}</span>
                <input type="text" value={v.definition} onChange={e => onDefinitionChange(v.word, e.target.value)} placeholder="Definition for this context…"
                  style={{ flex:1, padding:'5px 8px', background:'rgba(31,31,31,0.04)', border:'1px solid rgba(31,31,31,0.1)', borderRadius:'3px', outline:'none', fontFamily:'var(--font-heading)', fontSize:'0.9rem', fontWeight:300, color:'var(--color-ink)' }} />
              </div>
            ))
          }
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ ...lbl, opacity:0.4 }}>{filled} / {vocabCount} definitions filled</div>
          {advBtn('DONE → BEGIN PASS II', 3)}
          {resetBtn()}
        </div>
      </div>
    );
  }

  if (pass === 3 || pass === 4) return (
    <div style={s}>
      <div><div style={lbl}>PASS {pass === 3 ? 'II' : 'III'} OF 7 · REFERENCE SLIP</div>
        <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.3rem', fontWeight:300, color:'var(--color-ink)', marginTop:'6px', lineHeight:1.2 }}>Read again. Search the slip if you forget a meaning.</div></div>
      {vocabWords.length > 0 ? (
        <div style={{ flex:1, overflowY:'auto', border:'1px solid rgba(31,31,31,0.1)', borderRadius:'3px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px dashed rgba(31,31,31,0.1)', padding:'6px 10px', background:'rgba(31,31,31,0.03)' }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'7px', textTransform:'uppercase', letterSpacing:'0.15em', opacity:0.45, color:'var(--color-ink)' }}>WORDS (IN ORDER)</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'7px', textTransform:'uppercase', letterSpacing:'0.15em', opacity:0.45, color:'var(--color-ink)' }}>DEFINITIONS (SHUFFLED)</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            <div style={{ padding:'8px 10px', borderRight:'1px dashed rgba(31,31,31,0.08)', display:'flex', flexDirection:'column', gap:'6px' }}>
              {vocabWords.map(v => <div key={v.word} style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--color-ink)', padding:'1px 0' }}>{v.word}</div>)}
            </div>
            <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:'6px' }}>
              {shuffledDefs.map((def, i) => <div key={i} style={{ fontFamily:'var(--font-heading)', fontSize:'13px', fontWeight:300, color:'var(--color-ink)', padding:'1px 0', opacity: def ? 1 : 0.3 }}>{def || '—'}</div>)}
            </div>
          </div>
        </div>
      ) : <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1rem', opacity:0.35, color:'var(--color-ink)' }}>No vocabulary — proceed.</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {advBtn(`PASS ${pass === 3 ? 'II' : 'III'} DONE → CONTINUE`, pass + 1)}
        {resetBtn()}
      </div>
    </div>
  );

  if (pass === 5) return (
    <div style={s}>
      <div><div style={lbl}>PASS IV OF 7 · SYNTACTIC ANALYSIS</div>
        <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.5rem', fontWeight:300, color:'var(--color-ink)', marginTop:'8px', lineHeight:1.2 }}>Mark sentences you can&apos;t parse</div></div>
      {stepsBlock(["Vocabulary should be resolved by now","Click sentences you cannot parse structurally","Find the main verb first, then subject and object","Identify subordinate clause markers (that, which, who, because…)"])}
      <div style={{ padding:'12px', background:'rgba(198,93,59,0.06)', border:'1px solid rgba(198,93,59,0.15)', borderRadius:'3px' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.15em', color:'var(--color-ink)', opacity:0.7 }}>SENTENCES MARKED: {sentenceCount}</span>
      </div>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
        {advBtn('PASS IV DONE → GRAMMAR NOTES', 6)}
        {resetBtn()}
      </div>
    </div>
  );

  if (pass === 6) {
    const noted = grammarNotes.filter(n => n.note.trim()).length;
    return (
      <div style={s}>
        <div><div style={lbl}>PASS V OF 7 · GRAMMAR REFERENCE</div>
          <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.5rem', fontWeight:300, color:'var(--color-ink)', marginTop:'8px', lineHeight:1.2 }}>Grammar lookup for {grammarNotes.length} sentence{grammarNotes.length !== 1 ? 's' : ''}</div></div>
        {stepsBlock(["Look up the grammar phenomenon in a reference book","Do not move on until you fully understand it","Write the grammar note in the left page textarea","Add it to your flashcard review queue"])}
        {grammarNotes.length > 0 && (
          <div style={{ flex:1, overflowY:'auto', padding:'10px 12px', background:'rgba(31,31,31,0.03)', border:'1px solid rgba(31,31,31,0.08)', borderRadius:'3px' }}>
            <div style={{ ...lbl, marginBottom:'8px' }}>GRAMMAR NOTES SUMMARY</div>
            {grammarNotes.map(n => (
              <div key={n.sentenceIndex} style={{ marginBottom:'8px', paddingBottom:'8px', borderBottom:'1px dashed rgba(31,31,31,0.06)' }}>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:'11px', color:'var(--color-ink)', opacity:0.6, marginBottom:'3px', fontStyle:'italic' }}>
                  &ldquo;{n.sentence.slice(0, 60)}{n.sentence.length > 60 ? '…' : ''}&rdquo;
                </div>
                {n.note
                  ? <div style={{ fontFamily:'var(--font-utility)', fontSize:'11px', color:'var(--color-ink)', opacity:0.8 }}>{n.note}</div>
                  : <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--color-ink)', opacity:0.3 }}>— note pending —</div>}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ ...lbl, opacity:0.4 }}>{noted} / {grammarNotes.length} notes filled</div>
          {advBtn('PASS V DONE → ADD TO FLASHCARDS', 7)}
          {resetBtn()}
        </div>
      </div>
    );
  }

  if (pass === 7) return (
    <div style={s}>
      <div><div style={lbl}>INTERLUDE · ADD TO FLASHCARDS</div>
        <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.5rem', fontWeight:300, color:'var(--color-ink)', marginTop:'8px', lineHeight:1.2 }}>Add today&apos;s new words to your flashcard app</div></div>
      {stepsBlock([`Add all ${vocabCount} vocabulary words to your flashcard word list`, "Add grammar notes to the review queue as well", "Words from reading reinforce active study vocabulary"])}
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
        {advBtn('DONE → PASS VI — SMOOTH READ', 8)}
        {resetBtn()}
      </div>
    </div>
  );

  if (pass === 8) return (
    <div style={s}>
      <div><div style={lbl}>PASS VI–VII OF 7 · FINAL READS</div>
        <div style={{ fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'1.5rem', fontWeight:300, color:'var(--color-ink)', marginTop:'8px', lineHeight:1.2 }}>Read for rhythm and flow</div></div>
      {stepsBlock(["Pass VI: Read smoothly from beginning to end","Pass VII: Read again, let meaning arise directly","No translation in your head","The sensation of reading without translating is real progress"])}
      <div style={{ padding:'10px 12px', background:'rgba(255,194,51,0.08)', border:'1px solid rgba(255,194,51,0.2)', borderRadius:'3px', fontFamily:'var(--font-heading)', fontStyle:'italic', fontSize:'0.95rem', fontWeight:300, color:'var(--color-ink)', opacity:0.7, lineHeight:1.5 }}>
        &ldquo;After 100 articles, this sensation becomes a permanent ability.&rdquo;
      </div>
      {syncMsg && <div style={{ padding:'8px 12px', background:'rgba(31,31,31,0.05)', border:'1px solid rgba(31,31,31,0.1)', borderRadius:'3px', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--color-ink)' }}>{syncMsg}</div>}
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
        {isToday
          ? <button onClick={onSync} disabled={syncing} style={{ width:'100%', padding:'12px', background:'var(--color-terracotta)', color:'var(--color-paper)', border:'none', borderRadius:'3px', cursor: syncing ? 'wait' : 'pointer', fontFamily:'var(--font-mono)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.15em', opacity: syncing ? 0.7 : 1 }}>
              {syncing ? 'SYNCING…' : `DONE · SYNC ${vocabCount} WORDS TO EUDIC →`}
            </button>
          : advBtn('MARK COMPLETE (NO SYNC)', 9)}
        {resetBtn()}
      </div>
    </div>
  );

  return null;
}
