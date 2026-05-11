'use client';

import { useMemo, useCallback } from 'react';
import type { GrammarNote } from '@/lib/db';

export type RenderMode =
  | 'vocab-mark'
  | 'vocab-show'
  | 'sentence-mark'
  | 'sentence-show'
  | 'clean';

interface Token {
  text: string;
  isWord: boolean;
  wordKey: string;
}

interface ParsedSentence {
  index: number;
  tokens: Token[];
  rawText: string;
}

interface ParsedParagraph {
  sentences: ParsedSentence[];
}

function tokenize(text: string): Token[] {
  const regex = /(\b[a-zA-Z]+(?:[''][a-zA-Z]+)?\b|[^a-zA-Z]+)/g;
  const tokens: Token[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const t = match[0];
    const isWord = /^[a-zA-Z]/i.test(t);
    tokens.push({ text: t, isWord, wordKey: isWord ? t.toLowerCase() : '' });
  }
  return tokens;
}

function splitSentences(paraText: string): string[] {
  const parts = paraText.match(/[^.!?]*[.!?]+|[^.!?]+$/g);
  return (parts || [paraText]).map((s) => s.trim()).filter(Boolean);
}

function parseArticle(text: string): { paragraphs: ParsedParagraph[]; totalSentences: number } {
  const paragraphs: ParsedParagraph[] = [];
  let globalIdx = 0;

  for (const paraText of text.split(/\n+/)) {
    if (!paraText.trim()) continue;
    const sentences: ParsedSentence[] = [];
    for (const sentText of splitSentences(paraText)) {
      if (sentText.trim()) {
        sentences.push({ index: globalIdx++, tokens: tokenize(sentText), rawText: sentText });
      }
    }
    if (sentences.length > 0) paragraphs.push({ sentences });
  }

  return { paragraphs, totalSentences: globalIdx };
}

interface ArticleRendererProps {
  text: string;
  mode: RenderMode;
  highlightedWords?: Set<string>;
  highlightedSentences?: Set<number>;
  grammarNotes?: GrammarNote[];
  onWordToggle?: (word: string) => void;
  onSentenceToggle?: (sentenceIndex: number, sentence: string) => void;
  onGrammarNoteChange?: (sentenceIndex: number, note: string) => void;
}

export default function ArticleRenderer({
  text,
  mode,
  highlightedWords = new Set(),
  highlightedSentences = new Set(),
  grammarNotes = [],
  onWordToggle,
  onSentenceToggle,
  onGrammarNoteChange,
}: ArticleRendererProps) {
  const { paragraphs } = useMemo(() => parseArticle(text), [text]);

  const grammarNoteMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const n of grammarNotes) map.set(n.sentenceIndex, n.note);
    return map;
  }, [grammarNotes]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (mode === 'vocab-mark') {
        const wordEl = target.closest('[data-word]') as HTMLElement | null;
        if (wordEl?.dataset.word && onWordToggle) onWordToggle(wordEl.dataset.word);
      } else if (mode === 'sentence-mark') {
        const sentEl = target.closest('[data-sent]') as HTMLElement | null;
        if (sentEl) {
          const idx = parseInt(sentEl.dataset.sentIdx ?? '-1');
          const sentText = sentEl.dataset.sentText ?? '';
          if (idx >= 0 && onSentenceToggle) onSentenceToggle(idx, sentText);
        }
      }
    },
    [mode, onWordToggle, onSentenceToggle],
  );

  /* ── Render tokens ── */
  const renderTokens = (tokens: Token[], showWordHighlight: boolean) =>
    tokens.map((tok, i) => {
      if (!tok.isWord) return <span key={i}>{tok.text}</span>;
      const isHighlighted = showWordHighlight && highlightedWords.has(tok.wordKey);
      if (mode === 'vocab-mark') {
        return (
          <span
            key={i}
            data-word={tok.wordKey}
            className="cursor-pointer rounded transition-all active:scale-95"
            style={isHighlighted
              ? {
                  background: 'var(--color-mustard)',
                  color: 'var(--color-ink)',
                  padding: '1px 3px',
                  borderRadius: '3px',
                  fontStyle: 'normal',
                }
              : {}}
            onMouseEnter={(e) => {
              if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = 'rgba(255,194,51,0.25)';
            }}
            onMouseLeave={(e) => {
              if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = '';
            }}
          >
            {tok.text}
          </span>
        );
      }
      return (
        <span
          key={i}
          style={isHighlighted
            ? {
                background: 'var(--color-mustard)',
                color: 'var(--color-ink)',
                padding: '1px 3px',
                borderRadius: '3px',
              }
            : {}}
        >
          {tok.text}
        </span>
      );
    });

  const showWordHighlight = mode === 'vocab-mark' || mode === 'vocab-show';

  const baseStyle: React.CSSProperties = {
    lineHeight: '1.85',
    fontSize: '18px',
    fontWeight: 300,
    color: 'var(--color-ink)',
    fontFamily: 'var(--font-heading)',
  };

  /* sentence-show */
  if (mode === 'sentence-show') {
    return (
      <div className="space-y-4" style={baseStyle} onClick={handleClick}>
        {paragraphs.map((para, pi) => (
          <div key={pi}>
            {para.sentences.map((sent) => {
              const isHighlighted = highlightedSentences.has(sent.index);
              return (
                <span key={sent.index}>
                  {isHighlighted ? (
                    <span style={{
                      background: 'rgba(198,93,59,0.10)',
                      color: 'var(--color-ink)',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      borderBottom: '1px solid rgba(198,93,59,0.30)',
                    }}>
                      {renderTokens(sent.tokens, false)}
                    </span>
                  ) : (
                    <span>{renderTokens(sent.tokens, false)}</span>
                  )}
                  {' '}
                  {isHighlighted && (
                    <span className="block mt-1 mb-3">
                      <textarea
                        value={grammarNoteMap.get(sent.index) ?? ''}
                        onChange={(e) => onGrammarNoteChange?.(sent.index, e.target.value)}
                        placeholder="Grammar note (look it up, then fill in)…"
                        rows={2}
                        className="w-full resize-none outline-none transition-colors rounded-lg px-3 py-2"
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '15px',
                          fontWeight: 300,
                          background: 'rgba(198,93,59,0.06)',
                          border: '1px solid rgba(198,93,59,0.20)',
                          color: 'var(--color-ink)',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(198,93,59,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(198,93,59,0.08)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(198,93,59,0.20)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  /* sentence-mark */
  if (mode === 'sentence-mark') {
    return (
      <div className="space-y-4" style={baseStyle} onClick={handleClick}>
        {paragraphs.map((para, pi) => (
          <p key={pi} className="m-0">
            {para.sentences.map((sent) => {
              const isHighlighted = highlightedSentences.has(sent.index);
              return (
                <span
                  key={sent.index}
                  data-sent
                  data-sent-idx={sent.index}
                  data-sent-text={sent.rawText}
                  className="cursor-pointer rounded transition-colors"
                  style={isHighlighted
                    ? {
                        background: 'rgba(198,93,59,0.12)',
                        color: 'var(--color-ink)',
                        borderRadius: '3px',
                        padding: '1px 3px',
                        borderBottom: '1px solid rgba(198,93,59,0.30)',
                      }
                    : {}}
                  onMouseEnter={(e) => {
                    if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = 'rgba(198,93,59,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = '';
                  }}
                >
                  {renderTokens(sent.tokens, false)}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    );
  }

  /* vocab-mark / vocab-show / clean */
  return (
    <div className="space-y-4" style={baseStyle} onClick={handleClick}>
      {paragraphs.map((para, pi) => (
        <p key={pi} className="m-0">
          {para.sentences.map((sent) =>
            renderTokens(sent.tokens, showWordHighlight),
          )}
        </p>
      ))}
    </div>
  );
}

/* Export parse helper */
export function getSentencesFromText(text: string): { index: number; text: string }[] {
  const { paragraphs } = parseArticle(text);
  const result: { index: number; text: string }[] = [];
  for (const para of paragraphs) {
    for (const sent of para.sentences) {
      result.push({ index: sent.index, text: sent.rawText });
    }
  }
  return result;
}
