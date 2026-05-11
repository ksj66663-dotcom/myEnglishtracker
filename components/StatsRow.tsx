'use client';

import { TOTAL_DAYS } from '@/lib/dateUtils';

interface StatsRowProps {
  todayDayNumber: number;
  completedDaysCount: number;
  articlesCount: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className="paper-texture flex-1 rounded-lg p-3 flex flex-col gap-1"
      style={{
        background: 'var(--bg-1)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 300,
          lineHeight: 1,
          color: accent,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          opacity: 0.55,
          color: 'var(--color-ink)',
        }}
      >
        {label}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '8px',
            letterSpacing: '0.1em',
            opacity: 0.35,
            color: 'var(--color-ink)',
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

export default function StatsRow({ todayDayNumber, completedDaysCount, articlesCount }: StatsRowProps) {
  const pct = Math.round((todayDayNumber / TOTAL_DAYS) * 100);

  return (
    <div className="flex gap-2">
      <StatCard
        label="进度"
        value={`D${todayDayNumber}`}
        sub={`${pct}% · ${TOTAL_DAYS}天`}
        accent="var(--color-ink)"
      />
      <StatCard
        label="已完成"
        value={completedDaysCount}
        sub={`${completedDaysCount} 天打卡`}
        accent="var(--color-terracotta)"
      />
      <StatCard
        label="精读文章"
        value={articlesCount}
        sub={`${articlesCount} 篇完整`}
        accent="var(--color-mustard)"
      />
    </div>
  );
}
