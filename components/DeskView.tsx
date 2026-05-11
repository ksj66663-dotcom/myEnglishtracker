'use client';

import type { NotebookId } from '@/components/HomeClient';
import { START_DATE, getPlanEndDateStr, formatDateStamp } from '@/lib/dateUtils';

interface DeskViewProps {
  stackOrder: NotebookId[];
  clock: string;
  todayStr: string;
  todayDayNumber: number;
  tasksDone: number[];
  readingPass: number;
  readingVocabCount: number;
  readingSynced: boolean;
  articlesCount: number;
  onBringToFront: (id: NotebookId) => void;
  onOpenNotebook: (id: NotebookId) => void;
  onSettingsOpen: () => void;
}

/* Position for each layer: front, second, third */
const LAYER_STYLES = [
  { rotate: 0,  tx: 0,   ty: 0,  z: 30 },
  { rotate: -3, tx: -44, ty: 10, z: 20 },
  { rotate: 2,  tx: 34,  ty: 18, z: 10 },
];

/* ── Scissors SVG ─────────────────────────────────────────────────────────── */
const ScissorsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

/* ── Spinning Circular Text ───────────────────────────────────────────────── */
function SpinningText() {
  return (
    <div className="spin-slow" style={{ width: 260, height: 260, opacity: 0.08 }}>
      <svg width="260" height="260" viewBox="0 0 260 260">
        <defs>
          <path id="desk-circle" d="M130,130 m-110,0 a110,110 0 1,1 220,0 a110,110 0 1,1 -220,0" fill="none"/>
        </defs>
        <text style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', fill: 'var(--color-ink)', textTransform: 'uppercase' }}>
          <textPath href="#desk-circle">IELTS TRACKER · EST. 2025 · 120 DAYS · READ DEEPLY · </textPath>
        </text>
      </svg>
    </div>
  );
}

/* ── Task Notebook Cover ──────────────────────────────────────────────────── */
function TaskCover({ dayNumber, tasksDone }: { dayNumber: number; tasksDone: number[] }) {
  const done = tasksDone.length;
  return (
    <div
      className="paper-texture"
      style={{
        width: '100%', height: '100%',
        background: 'var(--color-mustard)',
        borderRadius: '4px',
        boxShadow: 'var(--shadow-notebook)',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '64px 32px 32px',
        gap: '0',
      }}
    >
      <div className="notebook-notch" />

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '4.5rem', fontWeight: 300, lineHeight: 0.88, color: 'var(--color-ink)' }}>
          Day {dayNumber}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', fontWeight: 300, color: 'var(--color-ink)', opacity: 0.7, marginTop: '6px' }}>
          of one hundred twenty
        </div>
      </div>

      {/* Meta */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.65, color: 'var(--color-ink)', marginBottom: '28px', textAlign: 'center' }}>
        TASK LOG
      </div>

      {/* Wax Seal */}
      <div className="wax-seal" style={{ marginBottom: '32px' }}>
        <div className="wax-seal-inner">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-ink)' }}>TASKS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)' }}>{done} / 9</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink)', opacity: 0.7 }}>DONE</span>
        </div>
      </div>

      {/* Tear-off edge */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', borderTop: '2px dashed rgba(0,0,0,0.15)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, color: 'var(--color-ink)' }}>TEAR HERE FOR DAILY RECEIPT</span>
        <ScissorsIcon />
      </div>

      {/* Vertical sidebar text */}
      <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.4, color: 'var(--color-ink)' }}>
        DAILY TASK LOG
      </div>
    </div>
  );
}

/* ── Reading Notebook Cover ───────────────────────────────────────────────── */
function ReadingCover({ pass, articlesCount }: { pass: number; articlesCount: number }) {
  const passLabel = pass === 0 ? 'NOT STARTED' : pass === 9 ? 'COMPLETE' : `PASS ${pass} OF 7`;
  const statusText = pass === 0 ? 'NOT STARTED' : pass === 9 ? 'COMPLETE' : 'IN PROGRESS';
  return (
    <div
      className="paper-texture"
      style={{
        width: '100%', height: '100%',
        background: 'var(--color-terracotta)',
        borderRadius: '4px',
        boxShadow: 'var(--shadow-notebook)',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '64px 32px 32px',
        gap: '0',
        color: 'var(--color-paper)',
      }}
    >
      <div className="notebook-notch" />

      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '3.8rem', fontWeight: 300, lineHeight: 0.9, color: 'var(--color-paper)' }}>
          Reading Log
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.75, color: 'var(--color-paper)', marginBottom: '12px' }}>
        {passLabel}
      </div>

      <div style={{ padding: '3px 12px', borderRadius: '9999px', border: '1px solid rgba(244,241,234,0.4)', fontFamily: 'var(--font-utility)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-paper)', marginBottom: '28px', opacity: 0.8 }}>
        ARTICLE {articlesCount}
      </div>

      <div className="wax-seal" style={{ marginBottom: '32px', borderColor: 'rgba(244,241,234,0.3)' }}>
        <div className="wax-seal-inner" style={{ borderColor: 'rgba(244,241,234,0.25)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-paper)', opacity: 0.9 }}>READING</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: 'var(--color-paper)' }}>PASS {pass === 9 ? 7 : pass}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-paper)', opacity: 0.7 }}>{statusText}</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 16px', borderTop: '2px dashed rgba(244,241,234,0.2)' }} />

      <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.4, color: 'var(--color-paper)' }}>
        ASSISTED READING LOG
      </div>
    </div>
  );
}

/* ── Vocabulary Notebook Cover ───────────────────────────────────────────── */
function VocabCover({ wordCount, synced }: { wordCount: number; synced: boolean }) {
  return (
    <div
      className="paper-texture"
      style={{
        width: '100%', height: '100%',
        background: 'var(--color-warm-gray)',
        borderRadius: '4px',
        boxShadow: 'var(--shadow-notebook)',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '64px 32px 32px',
        gap: '0',
      }}
    >
      <div className="notebook-notch" />

      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '3.8rem', fontWeight: 300, lineHeight: 0.9, color: 'var(--color-ink)' }}>
          Vocabulary
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.6, color: 'var(--color-ink)', marginBottom: '28px' }}>
        TODAY · {wordCount} WORDS
      </div>

      <div className="wax-seal" style={{ marginBottom: '32px' }}>
        <div className="wax-seal-inner">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink)' }}>{synced ? 'SYNCED' : 'PENDING'}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink)', opacity: 0.7, margin: '2px 0' }}>
            {synced
              ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
              : <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
            }
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-ink)', opacity: 0.6 }}>EUDIC</span>
        </div>
      </div>

      {/* Perforated right edge */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '16px', opacity: 0.15 }} className="perforated-edge" />

      <div style={{ position: 'absolute', right: '22px', top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.4, color: 'var(--color-ink)' }}>
        VOCABULARY LOG
      </div>
    </div>
  );
}

/* ── Notebook wrapper with position/rotation ─────────────────────────────── */
interface NotebookProps {
  id: NotebookId;
  layerIndex: number;
  isFront: boolean;
  onCoverClick: () => void;
  children: React.ReactNode;
}

function NotebookOnDesk({ id, layerIndex, isFront, onCoverClick, children }: NotebookProps) {
  const style = LAYER_STYLES[layerIndex] ?? LAYER_STYLES[2];
  return (
    <div
      style={{
        position: 'absolute',
        width: 'clamp(280px, 30vw, 400px)',
        height: 'clamp(380px, 50vh, 560px)',
        transform: `rotate(${style.rotate}deg) translate(${style.tx}px, ${style.ty}px)`,
        zIndex: style.z,
        transition: 'transform 0.5s ease, z-index 0s',
        cursor: isFront ? 'pointer' : 'pointer',
      }}
      onClick={onCoverClick}
      title={isFront ? `Open ${id} log` : `Bring ${id} log to front`}
    >
      {children}
    </div>
  );
}

/* ── DeskView ────────────────────────────────────────────────────────────── */
export default function DeskView({
  stackOrder, clock, todayStr, todayDayNumber,
  tasksDone, readingPass, readingVocabCount, readingSynced,
  articlesCount, onBringToFront, onOpenNotebook, onSettingsOpen,
}: DeskViewProps) {
  const endDateStr = getPlanEndDateStr();

  const getCover = (id: NotebookId) => {
    if (id === 'task') return <TaskCover dayNumber={todayDayNumber} tasksDone={tasksDone} />;
    if (id === 'reading') return <ReadingCover pass={readingPass} articlesCount={articlesCount} />;
    return <VocabCover wordCount={readingVocabCount} synced={readingSynced} />;
  };

  const handleNotebookClick = (id: NotebookId) => {
    if (stackOrder[0] === id) {
      onOpenNotebook(id);
    } else {
      onBringToFront(id);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-paper)',
        overflow: 'hidden',
      }}
    >
      {/* Top-left corner label */}
      <div style={{ position: 'absolute', top: 24, left: 28, fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.22em', opacity: 0.4, color: 'var(--color-ink)' }}>
        IELTS TRACKER · EST. 2025
      </div>

      {/* Top-right clock */}
      <div style={{ position: 'absolute', top: 24, right: 28, fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '0.1em', opacity: 0.5, color: 'var(--color-ink)' }}>
        {clock}
      </div>

      {/* Bottom center plan dates */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.22em', opacity: 0.4, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
        120-DAY READING PLAN · {formatDateStamp(START_DATE)} — {formatDateStamp(endDateStr)}
      </div>

      {/* Settings button — bottom right */}
      <button
        onClick={onSettingsOpen}
        className="circle-btn-sm"
        style={{ position: 'absolute', bottom: 24, right: 28, color: 'var(--color-ink)' }}
        aria-label="Settings"
      >
        <GearIcon />
      </button>

      {/* Spinning text decoration — behind notebooks */}
      <div style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none' }}>
        <SpinningText />
      </div>

      {/* Notebook stack — centered */}
      <div style={{ position: 'relative', width: 'clamp(280px, 30vw, 400px)', height: 'clamp(380px, 50vh, 560px)' }}>
        {/* Render in reverse order so front is on top visually and click works */}
        {[...stackOrder].reverse().map((id, revIdx) => {
          const layerIndex = stackOrder.indexOf(id);
          return (
            <NotebookOnDesk
              key={id}
              id={id}
              layerIndex={layerIndex}
              isFront={layerIndex === 0}
              onCoverClick={() => handleNotebookClick(id)}
            >
              {getCover(id)}
            </NotebookOnDesk>
          );
        })}
      </div>

      {/* Hint text */}
      <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.3, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
        CLICK TO OPEN · CLICK BACKGROUND NOTEBOOKS TO REARRANGE
      </div>
    </div>
  );
}
