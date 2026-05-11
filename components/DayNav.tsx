'use client';

import { formatDateDisplay } from '@/lib/dateUtils';

interface DayNavProps {
  dayNumber: number;
  dateStr: string;
  todayDayNumber: number;
  onNavigate: (dayNumber: number) => void;
}

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

export default function DayNav({ dayNumber, dateStr, todayDayNumber, onNavigate }: DayNavProps) {
  const isToday = dayNumber === todayDayNumber;

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Prev */}
      <button
        onClick={() => onNavigate(dayNumber - 1)}
        disabled={dayNumber <= 1}
        className="circle-btn-sm disabled:opacity-20 disabled:cursor-not-allowed"
        style={{ color: 'var(--color-ink)' }}
        aria-label="前一天"
      >
        <ChevronLeft />
      </button>

      {/* Center */}
      <div className="text-center">
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            opacity: 0.5,
            color: 'var(--color-ink)',
          }}
        >
          {formatDateDisplay(dateStr)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.2rem',
            fontWeight: 300,
            lineHeight: 1.05,
            marginTop: '2px',
            color: isToday ? 'var(--color-terracotta)' : 'var(--color-ink)',
            fontStyle: isToday ? 'italic' : 'normal',
          }}
        >
          第 {dayNumber} 天
        </div>
        {isToday && (
          <span
            style={{
              display: 'inline-block',
              marginTop: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              padding: '2px 10px',
              borderRadius: '9999px',
              background: 'var(--color-terracotta)',
              color: 'var(--color-paper)',
            }}
          >
            今天
          </span>
        )}
      </div>

      {/* Next + Today */}
      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={() => onNavigate(todayDayNumber)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--color-terracotta)',
              opacity: 0.8,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
          >
            今天
          </button>
        )}
        <button
          onClick={() => onNavigate(dayNumber + 1)}
          disabled={dayNumber >= 120}
          className="circle-btn-sm disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-ink)' }}
          aria-label="后一天"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
