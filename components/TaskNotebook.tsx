'use client';

import { useState, useEffect, useCallback } from 'react';
import { TASKS } from '@/lib/tasks';
import { TOTAL_DAYS, formatDateDisplay, formatDateDot } from '@/lib/dateUtils';

interface TaskNotebookProps {
  onClose: () => void;
  currentDayNumber: number;
  currentDateStr: string;
  todayDayNumber: number;
  todayStr: string;
  tasksDone: number[];
  notes: string;
  loading: boolean;
  saving: boolean;
  completedDays: Set<number>;
  allRecordsCount: number;
  onTaskToggle: (taskId: number) => void;
  onNotesChange: (value: string) => void;
  onNavigate: (dayNumber: number) => void;
}

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function TaskNotebook({
  onClose,
  currentDayNumber, currentDateStr, todayDayNumber,
  tasksDone, notes, loading, saving,
  completedDays, allRecordsCount,
  onTaskToggle, onNotesChange, onNavigate,
}: TaskNotebookProps) {
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const isToday = currentDayNumber === todayDayNumber;

  const handlePrev = useCallback(() => {
    if (currentDayNumber > 1) onNavigate(currentDayNumber - 1);
  }, [currentDayNumber, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentDayNumber < TOTAL_DAYS) onNavigate(currentDayNumber + 1);
  }, [currentDayNumber, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, handlePrev, handleNext]);

  const doneFraction = TASKS.length > 0 ? tasksDone.length / TASKS.length : 0;
  const completedCount = completedDays.size;
  const dateDisplay = currentDateStr ? formatDateDisplay(currentDateStr) : '';
  const dateStamp = currentDateStr ? formatDateDot(currentDateStr) : '';

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(31,31,31,0.55)',
      position: 'fixed', inset: 0, zIndex: 100,
      backdropFilter: 'blur(2px)',
      padding: '16px',
    }}>
      {/* Notebook spread */}
      <div style={{
        display: 'flex',
        width: 'min(96vw, 1100px)',
        height: 'min(90vh, 740px)',
        borderRadius: '4px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'notebook-open 0.25s ease',
      }}>

        {/* ── LEFT PAGE — Task List ──────────────────────────────────────── */}
        <div className="notebook-page-left lined-paper" style={{ flex: '1 1 0', minWidth: 0 }}>
          {/* Page header strip */}
          <div className="page-header-strip">
            <span>TASK LOG</span>
            <span>{dateStamp}</span>
          </div>

          {/* Close + Day navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', marginTop: '8px' }}>
            <button
              onClick={onClose}
              className="circle-btn-sm"
              aria-label="Close notebook"
              title="Close (Esc)"
            >
              <CloseIcon />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handlePrev}
                className="circle-btn-sm"
                disabled={currentDayNumber <= 1}
                aria-label="Previous day"
                title="Previous day (←)"
              >
                <ArrowLeftIcon />
              </button>

              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }}>
                  Day {currentDayNumber}
                </div>
                {!isToday && (
                  <button
                    onClick={() => onNavigate(todayDayNumber)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-terracotta)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', opacity: 0.8 }}
                  >
                    ← TODAY
                  </button>
                )}
              </div>

              <button
                onClick={handleNext}
                className="circle-btn-sm"
                disabled={currentDayNumber >= TOTAL_DAYS}
                aria-label="Next day"
                title="Next day (→)"
              >
                <ArrowRightIcon />
              </button>
            </div>

            <div style={{ width: 32 }} /> {/* spacer */}
          </div>

          {/* Date heading */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 300, color: 'var(--color-ink)', opacity: 0.8 }}>
              {dateDisplay}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.5, color: 'var(--color-ink)' }}>
                PROGRESS
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '0.1em', opacity: 0.5, color: 'var(--color-ink)' }}>
                {tasksDone.length} / {TASKS.length}
              </span>
            </div>
            <div style={{ position: 'relative', height: '6px', background: 'rgba(31,31,31,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute', inset: '0 auto 0 0',
                  width: `${doneFraction * 100}%`,
                  background: 'var(--color-mustard)',
                  filter: "url('#wavy')",
                  transition: 'width 0.4s ease',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          {/* Task ledger rows */}
          {loading ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.4, color: 'var(--color-ink)', padding: '16px 0' }}>
              LOADING…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {TASKS.map((task) => {
                const done = tasksDone.includes(task.id);
                const isExpanded = expandedTask === task.id;
                return (
                  <div key={task.id} className={`ledger-row${done ? ' complete' : ''}`}>
                    {/* Row header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Checkbox */}
                      <button
                        onClick={() => onTaskToggle(task.id)}
                        style={{
                          width: '20px', height: '20px', minWidth: '20px',
                          border: `1.5px solid ${done ? 'var(--color-mustard)' : 'rgba(31,31,31,0.25)'}`,
                          borderRadius: '3px',
                          background: done ? 'var(--color-mustard)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--color-ink)',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}
                        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {done && <CheckIcon />}
                      </button>

                      {/* Task info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{
                            fontFamily: 'var(--font-utility)',
                            fontSize: '12px',
                            fontWeight: done ? 400 : 400,
                            color: done ? 'rgba(31,31,31,0.5)' : 'var(--color-ink)',
                            textDecoration: done ? 'line-through' : 'none',
                            lineHeight: 1.3,
                            flex: 1,
                          }}>
                            {task.title}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, color: 'var(--color-ink)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {task.duration}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.4, color: 'var(--color-ink)' }}>
                            {task.timeLabel}
                          </span>
                          {/* Guide toggle */}
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', opacity: 0.4, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>GUIDE</span>
                            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded guide */}
                    {isExpanded && (
                      <div style={{ marginTop: '10px', marginLeft: '30px' }}>
                        <ol style={{ margin: 0, padding: '0 0 0 16px', listStyle: 'decimal' }}>
                          {task.guide.map((step, i) => (
                            <li key={i} style={{ fontFamily: 'var(--font-utility)', fontSize: '11px', color: 'var(--color-ink)', opacity: 0.7, lineHeight: 1.5, marginBottom: '4px' }}>
                              {step}
                            </li>
                          ))}
                        </ol>
                        {task.warning && (
                          <div className="folded-note" style={{ marginTop: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-terracotta)', marginRight: '6px' }}>!</span>
                            <span style={{ fontFamily: 'var(--font-utility)', fontSize: '10px', color: 'var(--color-ink)', opacity: 0.7 }}>{task.warning}</span>
                          </div>
                        )}
                        {task.tip && (
                          <div className="folded-note" style={{ marginTop: '6px', borderColor: 'var(--color-warm-gray)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.5, color: 'var(--color-ink)', marginRight: '6px' }}>TIP</span>
                            <span style={{ fontFamily: 'var(--font-utility)', fontSize: '10px', color: 'var(--color-ink)', opacity: 0.65 }}>{task.tip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Spine ─────────────────────────────────────────────────────────── */}
        <div style={{
          width: '20px', minWidth: '20px',
          background: 'linear-gradient(to right, rgba(31,31,31,0.12), rgba(31,31,31,0.04), transparent)',
          boxShadow: 'inset -4px 0 8px rgba(31,31,31,0.06)',
          flexShrink: 0,
        }} />

        {/* ── RIGHT PAGE — Progress Grid + Notes ────────────────────────── */}
        <div className="notebook-page-right lined-paper" style={{ flex: '1 1 0', minWidth: 0 }}>
          <div className="page-header-strip">
            <span>120-DAY PROGRESS</span>
            <span style={{ opacity: saving ? 1 : 0, transition: 'opacity 0.2s', color: 'var(--color-terracotta)' }}>SAVING…</span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', marginTop: '8px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }}>
                {completedCount}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, color: 'var(--color-ink)', marginTop: '2px' }}>
                DAYS COMPLETE
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }}>
                {allRecordsCount}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, color: 'var(--color-ink)', marginTop: '2px' }}>
                DAYS RECORDED
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }}>
                {TOTAL_DAYS - currentDayNumber}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, color: 'var(--color-ink)', marginTop: '2px' }}>
                DAYS REMAINING
              </div>
            </div>
          </div>

          {/* 120-day progress grid: 10 cols × 12 rows */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.45, color: 'var(--color-ink)', marginBottom: '8px' }}>
              PLAN OVERVIEW — {completedCount} / {TOTAL_DAYS}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '3px' }}>
              {Array.from({ length: TOTAL_DAYS }, (_, i) => {
                const day = i + 1;
                const isDone = completedDays.has(day);
                const isCurrent = day === currentDayNumber;
                const isPast = day < currentDayNumber;
                return (
                  <button
                    key={day}
                    onClick={() => onNavigate(day)}
                    className="progress-cell"
                    title={`Day ${day}`}
                    style={{
                      aspectRatio: '1',
                      border: isCurrent ? '1.5px solid var(--color-terracotta)' : `1px solid rgba(31,31,31,${isDone ? 0.2 : 0.1})`,
                      background: isDone ? 'var(--color-mustard)' : isCurrent ? 'rgba(198,93,59,0.1)' : isPast ? 'rgba(31,31,31,0.03)' : 'transparent',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      padding: 0,
                      position: 'relative',
                    }}
                    aria-label={`Day ${day}${isDone ? ' (complete)' : ''}`}
                  >
                    {/* Milestone markers at days 25, 50, 75, 100 */}
                    {[25, 50, 75, 100].includes(day) && (
                      <span style={{
                        position: 'absolute', bottom: '1px', right: '1px',
                        width: '3px', height: '3px', borderRadius: '50%',
                        background: isDone ? 'rgba(31,31,31,0.4)' : 'var(--color-terracotta)',
                        opacity: 0.7,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.45, color: 'var(--color-ink)', marginBottom: '8px' }}>
              TODAY&apos;S NOTES
            </div>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Record observations, difficulties, breakthroughs…"
              style={{
                width: '100%',
                minHeight: '140px',
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-heading)',
                fontStyle: 'italic',
                fontSize: '1.05rem',
                fontWeight: 300,
                color: 'var(--color-ink)',
                lineHeight: '28px',
                letterSpacing: '0.01em',
                padding: 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
