'use client';

import { useState } from 'react';
import type { Task } from '@/lib/tasks';

interface TaskCardProps {
  task: Task;
  done: boolean;
  onToggle: (taskId: number) => void;
}

const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={up ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
  </svg>
);

/* Slight rotation per task id, alternates for a stacked-papers feel */
const ROTATIONS = [1.2, -0.8, 1.5, -1.2, 0.8, -1.5, 1.0, -0.6, 1.3];
const HOVER_ROTATIONS = [-0.5, 0.4, -0.6, 0.5, -0.3, 0.6, -0.4, 0.3, -0.5];

export default function TaskCard({ task, done, onToggle }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const rotBase = ROTATIONS[(task.id - 1) % ROTATIONS.length];
  const rotHover = HOVER_ROTATIONS[(task.id - 1) % HOVER_ROTATIONS.length];

  return (
    <div
      className="paper-texture rounded-lg"
      style={{
        background: done ? 'var(--bg-2)' : 'var(--bg-1)',
        border: done
          ? '1px solid rgba(0,0,0,0.06)'
          : '1px solid rgba(0,0,0,0.10)',
        borderLeft: done
          ? `3px solid var(--color-warm-gray)`
          : `3px solid var(--color-mustard)`,
        boxShadow: done ? 'none' : 'var(--shadow-sm)',
        opacity: done ? 0.72 : 1,
        transform: `rotate(${hovered ? rotHover : rotBase}deg)`,
        transition: 'transform 0.5s ease, box-shadow 0.5s ease, opacity 0.3s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Checkbox circle */}
        <button
          onClick={() => onToggle(task.id)}
          aria-label={done ? '取消完成' : '标记完成'}
          className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full transition-all flex items-center justify-center cursor-pointer"
          style={done ? {
            background: 'var(--color-terracotta)',
            border: '1.5px solid var(--color-terracotta)',
          } : {
            background: 'transparent',
            border: '1.5px solid rgba(0,0,0,0.25)',
          }}
        >
          {done && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-paper)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 300,
                  lineHeight: 1.4,
                  color: done ? 'var(--text-3)' : 'var(--color-ink)',
                  textDecoration: done ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  opacity: 0.45,
                  marginTop: '2px',
                  color: 'var(--color-ink)',
                }}
              >
                {task.timeLabel} · {task.duration}
              </p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 flex items-center gap-1 cursor-pointer"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid currentColor',
                color: expanded ? 'var(--color-terracotta)' : 'var(--color-ink)',
                opacity: expanded ? 1 : 0.45,
                transition: 'color 0.15s, opacity 0.15s',
              }}
            >
              {expanded ? '收起' : '指导'}
              <ChevronIcon up={expanded} />
            </button>
          </div>

          {expanded && (
            <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px dashed rgba(0,0,0,0.12)' }}>
              <ol className="space-y-2">
                {task.guide.map((item, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold mt-0.5"
                      style={{
                        background: 'var(--color-mustard)',
                        color: 'var(--color-ink)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '14px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ol>

              {task.warning && (
                <div
                  className="flex gap-2 p-2.5 rounded-lg"
                  style={{
                    background: 'rgba(198,93,59,0.08)',
                    border: '1px solid rgba(198,93,59,0.20)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-terracotta)' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 300, lineHeight: 1.5, color: 'var(--color-terracotta)' }}>
                    {task.warning}
                  </p>
                </div>
              )}

              {task.tip && (
                <div
                  className="flex gap-2 p-2.5 rounded-lg"
                  style={{
                    background: 'rgba(255,194,51,0.12)',
                    border: '1px solid rgba(255,194,51,0.30)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-ink)', opacity: 0.7 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 300, lineHeight: 1.5, color: 'var(--color-ink)', opacity: 0.75 }}>
                    {task.tip}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
