'use client';

import { useCallback, useEffect, useState } from 'react';
import NotebookOpen from '@/components/NotebookOpen';
import { TASKS } from '@/lib/tasks';
import { TOTAL_DAYS, formatDateDisplay, formatDateDot } from '@/lib/dateUtils';

interface TaskLogInteriorProps {
  onClose: () => void;
  currentDayNumber: number;
  currentDateStr: string;
  todayDayNumber: number;
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

function Checkmark({ checked }: { checked: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.2" />
      {checked && (
        <path
          className="checkmark-path"
          d="m7 12 3.2 3.4L17.5 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function Chevron({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === 'down' ? <path d="m6 9 6 6 6-6" /> : <path d="m18 15-6-6-6 6" />}
    </svg>
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === 'left' ? <path d="M19 12H5m7 7-7-7 7-7" /> : <path d="M5 12h14m-7-7 7 7-7 7" />}
    </svg>
  );
}

export default function TaskLogInterior({
  onClose,
  currentDayNumber,
  currentDateStr,
  todayDayNumber,
  tasksDone,
  notes,
  loading,
  saving,
  completedDays,
  allRecordsCount,
  onTaskToggle,
  onNotesChange,
  onNavigate,
}: TaskLogInteriorProps) {
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const isToday = currentDayNumber === todayDayNumber;

  const handlePrev = useCallback(() => {
    if (currentDayNumber > 1) onNavigate(currentDayNumber - 1);
  }, [currentDayNumber, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentDayNumber < TOTAL_DAYS) onNavigate(currentDayNumber + 1);
  }, [currentDayNumber, onNavigate]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev, onClose]);

  const completedCount = completedDays.size;
  const doneFraction = TASKS.length ? tasksDone.length / TASKS.length : 0;
  const dateDisplay = currentDateStr ? formatDateDisplay(currentDateStr) : '';
  const dateStamp = currentDateStr ? formatDateDot(currentDateStr) : '';

  const left = (
    <div className="min-h-full flex flex-col">
      <div className="page-header-strip">
        <span>TASK LOG</span>
        <span>{dateStamp}</span>
      </div>

      <div className="flex items-center justify-between gap-4 mb-8 mt-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentDayNumber <= 1}
          className="h-10 w-10 rounded-full border border-black/20 flex items-center justify-center disabled:opacity-25 transition-transform hover:scale-105"
          aria-label="Previous day"
        >
          <Arrow direction="left" />
        </button>

        <div className="text-center">
          <div className="text-5xl font-light leading-none">Day {currentDayNumber}</div>
          <div className="mt-2 font-typewriter text-[10px] uppercase tracking-widest opacity-50">
            {dateDisplay}
          </div>
          {!isToday && (
            <button
              type="button"
              onClick={() => onNavigate(todayDayNumber)}
              className="mt-2 font-typewriter text-[9px] uppercase tracking-widest text-[#C65D3B]"
            >
              Today
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentDayNumber >= TOTAL_DAYS}
          className="h-10 w-10 rounded-full border border-black/20 flex items-center justify-center disabled:opacity-25 transition-transform hover:scale-105"
          aria-label="Next day"
        >
          <Arrow direction="right" />
        </button>
      </div>

      <div className="mb-7">
        <div className="flex items-center justify-between font-typewriter text-[10px] uppercase tracking-widest opacity-50 mb-2">
          <span>Progress</span>
          <span>{tasksDone.length} / {TASKS.length}</span>
        </div>
        <div className="h-2 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#FFC233] transition-all duration-500"
            style={{ width: `${doneFraction * 100}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 rounded paper-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {TASKS.map((task) => {
            const done = tasksDone.includes(task.id);
            const expanded = expandedTask === task.id;
            return (
              <div key={task.id} className="ledger-row py-4">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    className="vintage-circle-checkbox mt-0.5"
                    data-checked={done}
                    onClick={() => onTaskToggle(task.id)}
                    aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
                  >
                    <Checkmark checked={done} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className={done ? 'opacity-45 line-through' : ''}>
                        <div className="font-sans-modern text-sm leading-5">{task.title}</div>
                        <div className="mt-1 font-typewriter text-[10px] uppercase tracking-widest opacity-45">
                          {task.timeLabel}
                        </div>
                      </div>
                      <div className="font-typewriter text-[10px] uppercase tracking-widest opacity-45 whitespace-nowrap">
                        {task.duration}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedTask(expanded ? null : task.id)}
                      className="mt-3 inline-flex items-center gap-1 font-typewriter text-[9px] uppercase tracking-widest opacity-45 hover:opacity-90"
                    >
                      Guide <Chevron direction={expanded ? 'up' : 'down'} />
                    </button>

                    {expanded && (
                      <div className="mt-4 ml-1 pl-4 border-l-2 border-[#FFC233]/70">
                        <ol className="list-decimal pl-4 space-y-2 font-sans-modern text-xs leading-5 opacity-75">
                          {task.guide.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                        {task.warning && (
                          <div className="mt-3 border-l-2 border-[#C65D3B] bg-black/[0.025] px-3 py-2 font-sans-modern text-xs leading-5 opacity-75">
                            {task.warning}
                          </div>
                        )}
                        {task.tip && (
                          <div className="mt-3 border-l-2 border-black/20 bg-black/[0.025] px-3 py-2 font-sans-modern text-xs leading-5 opacity-70">
                            {task.tip}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const right = (
    <div className="min-h-full flex flex-col">
      <div className="page-header-strip">
        <span>120-Day Grid</span>
        <span className={saving ? 'text-[#C65D3B] opacity-100' : 'opacity-0'}>Saving</span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <div className="text-5xl font-light leading-none">{completedCount}</div>
          <div className="mt-2 font-typewriter text-[9px] uppercase tracking-widest opacity-45">Days Complete</div>
        </div>
        <div>
          <div className="text-5xl font-light leading-none">{allRecordsCount}</div>
          <div className="mt-2 font-typewriter text-[9px] uppercase tracking-widest opacity-45">Recorded</div>
        </div>
        <div>
          <div className="text-5xl font-light leading-none">{Math.max(0, TOTAL_DAYS - currentDayNumber)}</div>
          <div className="mt-2 font-typewriter text-[9px] uppercase tracking-widest opacity-45">Remaining</div>
        </div>
      </div>

      <div className="mb-10">
        <div className="font-typewriter text-[10px] uppercase tracking-widest opacity-45 mb-3">
          Plan Overview · {completedCount} / {TOTAL_DAYS}
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: TOTAL_DAYS }, (_, index) => {
            const day = index + 1;
            const isDone = completedDays.has(day);
            const isCurrent = day === currentDayNumber;
            const isPast = day < currentDayNumber;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onNavigate(day)}
                className="aspect-square border text-[0] transition-transform hover:scale-125"
                style={{
                  borderColor: isCurrent ? '#C65D3B' : 'rgba(31,31,31,0.12)',
                  background: isDone ? '#FFC233' : isCurrent ? 'rgba(198,93,59,0.12)' : isPast ? 'rgba(31,31,31,0.04)' : 'transparent',
                }}
                title={`Day ${day}`}
                aria-label={`Day ${day}${isDone ? ' complete' : ''}`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="font-typewriter text-[10px] uppercase tracking-widest opacity-45 mb-3">
          Today&apos;s Notes
        </div>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Record observations, difficulties, breakthroughs..."
          className="vintage-input flex-1 min-h-[220px] resize-none text-xl italic leading-7 font-normal"
        />
      </div>
    </div>
  );

  return (
    <NotebookOpen
      title="Task Log"
      dateLabel={dateStamp}
      onClose={onClose}
      left={left}
      right={right}
    />
  );
}
