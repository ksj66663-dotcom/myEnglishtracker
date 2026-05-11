'use client';

import { TOTAL_DAYS, MILESTONE_DAYS } from '@/lib/dateUtils';

interface ProgressGridProps {
  completedDays: Set<number>;
  todayDayNumber: number;
  currentDayNumber: number;
  onDayClick: (dayNumber: number) => void;
}

export default function ProgressGrid({ completedDays, todayDayNumber, currentDayNumber, onDayClick }: ProgressGridProps) {
  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          opacity: 0.55,
          marginBottom: '12px',
          color: 'var(--color-ink)',
        }}
      >
        120天进度总览
      </h2>

      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
          const isCompleted = completedDays.has(day);
          const isToday = day === todayDayNumber;
          const isMilestone = MILESTONE_DAYS.includes(day);
          const isCurrent = day === currentDayNumber;
          const isFuture = day > todayDayNumber;

          let bg = '';
          let color = '';
          let border = '';
          let boxShadow = '';

          if (isCompleted && isMilestone) {
            bg = 'var(--color-terracotta)';
            color = 'var(--color-paper)';
            border = '1px solid rgba(0,0,0,0.08)';
            boxShadow = 'var(--shadow-sm)';
          } else if (isCompleted) {
            bg = 'var(--color-mustard)';
            color = 'var(--color-ink)';
            border = '1px solid rgba(0,0,0,0.08)';
            boxShadow = 'var(--shadow-sm)';
          } else if (isToday) {
            bg = 'transparent';
            color = 'var(--color-terracotta)';
            border = '1.5px solid var(--color-terracotta)';
            boxShadow = '0 0 0 2px rgba(198,93,59,0.12)';
          } else if (isFuture) {
            bg = 'rgba(0,0,0,0.04)';
            color = 'var(--text-4)';
            border = '1px solid rgba(0,0,0,0.07)';
          } else {
            bg = 'rgba(0,0,0,0.06)';
            color = 'var(--text-3)';
            border = '1px solid rgba(0,0,0,0.08)';
          }

          return (
            <button
              key={day}
              onClick={() => onDayClick(day)}
              className="relative w-full aspect-square rounded flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-110 hover:z-10"
              style={{
                background: bg,
                color,
                border: isCurrent && !isToday ? '1.5px solid var(--color-ink)' : border,
                boxShadow,
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                letterSpacing: '0',
              }}
              title={`第${day}天${isMilestone ? '（里程碑）' : ''}`}
            >
              {isMilestone && !isCompleted && !isToday
                ? <span style={{ color: 'var(--color-terracotta)', fontWeight: 700 }}>{day}</span>
                : day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-x-3 gap-y-1 mt-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          opacity: 0.55,
          color: 'var(--color-ink)',
        }}
      >
        {[
          { bg: 'var(--color-mustard)', label: '已完成' },
          { bg: 'var(--color-terracotta)', label: '里程碑' },
          { bg: 'rgba(0,0,0,0.06)', label: '未完成' },
          { bg: 'rgba(0,0,0,0.03)', label: '未开始' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block flex-shrink-0"
              style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.bg, border: '1px solid rgba(0,0,0,0.1)' }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
