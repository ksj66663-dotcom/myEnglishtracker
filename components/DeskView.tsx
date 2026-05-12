'use client';

import { useEffect, useState } from 'react';
import type { NotebookId } from '@/components/HomeClient';

interface DeskViewProps {
  activeCard: NotebookId;
  loading: boolean;
  todayDayNumber: number;
  completedDaysCount: number;
  tasksDoneCount: number;
  currentPass: number;
  articleCount: number;
  vocabCount: number;
  totalVocab: number;
  syncStatus: string;
  liftingCard?: NotebookId | null;
  onBringToFront: (id: NotebookId) => void;
  onOpenNotebook: (id: NotebookId) => void;
  onSettingsOpen: () => void;
}

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 opacity-40" aria-hidden="true">
      <circle cx="6" cy="7" r="3" />
      <circle cx="6" cy="17" r="3" />
      <path d="M8.5 8.5 20 20" />
      <path d="M8.5 15.5 20 4" />
    </svg>
  );
}

function BookIcon({ className = 'h-20 w-20' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 16h28a10 10 0 0 1 10 10v38H26a8 8 0 0 0-8 8V16Z" />
      <path d="M56 26h6v38H34a8 8 0 0 0-8 8" />
      <path d="M27 28h18M27 37h18M27 46h13" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function SkeletonDesk() {
  return (
    <div className="relative w-full flex flex-col lg:flex-row gap-4 lg:gap-6 lg:ml-12 lg:pr-12 mt-8 lg:mt-12">
      <div className="paper-texture flex-1 h-[480px] rounded-lg paper-pulse shadow-2xl" />
      <div className="paper-texture flex-1 h-[480px] rounded-lg paper-pulse shadow-xl" />
      <div className="paper-texture flex-1 h-[480px] rounded-lg paper-pulse shadow-xl" />
    </div>
  );
}

export default function DeskView({
  activeCard,
  loading,
  liftingCard,
  todayDayNumber,
  completedDaysCount,
  tasksDoneCount,
  currentPass,
  articleCount,
  vocabCount,
  totalVocab,
  syncStatus,
  onBringToFront,
  onOpenNotebook,
  onSettingsOpen,
}: DeskViewProps) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('ielts-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('ielts-theme', next ? 'dark' : 'light');
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row overflow-hidden">
      <aside className="w-full lg:w-1/4 h-auto lg:h-screen border-r border-[#D1D1C9]/50 dark:border-white/5 flex flex-col justify-between p-8 lg:p-12 z-20 bg-[#F4F1EA] dark:bg-[#232019]">
        <div>
          <button
            type="button"
            onClick={onSettingsOpen}
            className="group inline-flex items-center gap-3 font-typewriter text-xs uppercase tracking-widest opacity-60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1F1F1F]/30 transition-colors group-hover:bg-[#1F1F1F] group-hover:text-[#F4F1EA]">
              <ArrowLeftIcon />
            </span>
            Back to Booking
          </button>

          <div className="mt-16 lg:mt-24">
            <h1 className="text-5xl lg:text-7xl font-light leading-[0.9]">
              IELTS<br />
              <em>Tracker</em>
            </h1>
            <div className="mt-8 font-typewriter text-xs leading-6 opacity-80">
              <div>Est. 2025</div>
              <div>120-Day Plan</div>
              <div>Reading · Vocabulary</div>
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex flex-col gap-3">
          {[
            ['tasks', 'Task Log'],
            ['reading', 'Reading Log'],
            ['vocabulary', 'Vocabulary'],
          ].map(([id, label]) => {
            const active = activeCard === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onBringToFront(id as NotebookId)}
                className={`font-typewriter text-xs uppercase tracking-widest text-left flex items-center gap-3 ${active ? '' : 'opacity-50 hover:opacity-100 hover:text-[#C65D3B]'}`}
              >
                {active && <span className="w-1.5 h-1.5 bg-[#C65D3B] rounded-full" />}
                <span>{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onSettingsOpen}
            className="font-typewriter text-xs uppercase tracking-widest text-left opacity-50 hover:opacity-100 hover:text-[#C65D3B]"
          >
            Settings
          </button>
        </nav>

        {/* Dark mode toggle — visible on all screens */}
        <div className="lg:hidden mt-6">
          <button
            type="button"
            onClick={toggleDark}
            className="flex items-center gap-2 font-typewriter text-xs uppercase tracking-widest opacity-50 hover:opacity-100"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
            {dark ? 'Light' : 'Night'}
          </button>
        </div>
      </aside>

      {/* Dark mode toggle — fixed bottom-left on desktop */}
      <button
        type="button"
        onClick={toggleDark}
        className="fixed bottom-6 left-6 z-50 hidden lg:flex h-10 w-10 rounded-full items-center justify-center shadow-md transition-transform hover:scale-110 bg-[#1F1F1F] text-[#FFC233] dark:bg-[#EAE3D5] dark:text-[#232019]"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Light mode' : 'Night mode'}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <main className="flex-1 w-full h-full relative overflow-y-auto lg:overflow-hidden p-6 lg:p-0">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none hidden lg:block">
          <svg width="200" height="200" viewBox="0 0 200 200" className="spin-slow">
            <defs>
              <path id="curve" d="M 100,100 m -75,0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" fill="transparent" />
            </defs>
            <text fontFamily="Courier Prime" fontSize="10" letterSpacing="3" fill="currentColor">
              <textPath href="#curve">
                IELTS TRACKER · 120 DAYS · EST. 2025 · READ EVERY DAY ·
              </textPath>
            </text>
          </svg>
        </div>

        {loading ? (
          <SkeletonDesk />
        ) : (
          <div className="relative w-full flex flex-col lg:flex-row gap-4 lg:gap-6 lg:ml-12 lg:pr-12 mt-8 lg:mt-12">
            <article
              onClick={() => onOpenNotebook('tasks')}
              className={`paper-texture relative bg-[#FFC233] flex-1 h-[480px] rounded-lg shadow-2xl flex flex-col transition-all duration-300 cursor-pointer hover:-translate-y-2${liftingCard === 'tasks' ? ' animate-notebook-lift' : ''}`}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#F4F1EA] dark:bg-[#232019] rounded-b-full shadow-inner z-40" />
              <div className="p-8 pt-20 flex flex-col h-full">
                <div className="font-typewriter text-[10px] uppercase tracking-widest opacity-60">
                  TASK LOG · DAY {todayDayNumber} OF 120
                </div>
                <h2 className="text-5xl font-light leading-[0.9] mt-2">Day {todayDayNumber}</h2>
                <div className="text-xl italic opacity-70">of one hundred twenty</div>

                <div className="w-16 h-16 rounded-full border border-black/20 flex items-center justify-center mx-auto mt-4 relative">
                  <div className="w-12 h-12 rounded-full border border-dashed border-black/15 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-typewriter text-[8px] uppercase">Tasks</div>
                      <div className="font-typewriter text-[11px] font-bold">{tasksDoneCount}/9</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-8 border-t-2 border-dashed border-black/10 flex items-center justify-end px-4">
                <span className="font-typewriter text-[8px] uppercase tracking-wider opacity-50">Tap to open</span>
                <ScissorsIcon />
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-vertical font-typewriter text-[9px] uppercase tracking-widest opacity-40">
                DAILY TASK LOG · 120 DAYS
              </div>

              <div className="absolute bottom-10 left-10">
                <div className="relative w-32 h-28 flex items-center justify-center transform -rotate-6">
                  <svg className="absolute w-full h-full text-[#1F1F1F]" viewBox="0 0 100 100" fill="none">
                    <path d="M50 5 L95 90 L5 90 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" strokeLinejoin="round" />
                    <path d="M50 8 Q55 18 58 24 Q61 30 65 38 Q69 46 72 52 Q76 60 80 68 Q84 76 88 84 Q92 92 88 92 Q80 92 72 92 Q64 92 56 92 Q48 92 40 92 Q32 92 24 92 Q16 92 12 92 Q8 92 12 84 Q16 76 20 68 Q24 60 28 52 Q32 46 36 38 Q40 30 43 24 Q46 18 50 8 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  </svg>
                  <div className="relative z-10 text-center pt-4">
                    <span className="block font-sans-modern text-[10px] uppercase tracking-wider mb-1">Day No</span>
                    <span className="block font-typewriter text-3xl font-bold">{todayDayNumber}</span>
                  </div>
                </div>
              </div>

            </article>

            <article
              onClick={() => onOpenNotebook('reading')}
              className={`paper-texture relative bg-[#C65D3B] flex-1 h-[480px] rounded-lg shadow-xl flex flex-col transition-all duration-300 text-[#F4F1EA] cursor-pointer hover:-translate-y-2${liftingCard === 'reading' ? ' animate-notebook-lift' : ''}`}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#F4F1EA] dark:bg-[#232019] rounded-b-full shadow-inner z-40" />
              <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-48 opacity-40" viewBox="0 0 32 200">
                <defs>
                  <path id="curve2" d="M16,190 a74,74 0 1,1 0,-148" fill="transparent" />
                </defs>
                <text fontFamily="Courier Prime" fontSize="7" fill="currentColor" letterSpacing="2">
                  <textPath href="#curve2">
                    Reading Log · Pass {currentPass} of 7 · Article {articleCount} ·
                  </textPath>
                </text>
              </svg>

              <div className="p-8 pt-20">
                <div className="font-typewriter text-[10px] uppercase tracking-widest opacity-70">
                  READING LOG · PASS {currentPass} / 7
                </div>
                <h2 className="text-4xl font-light italic mt-2">Reading Log</h2>
                <div className="mt-4 font-typewriter text-[11px] opacity-80">Article {articleCount} of 100</div>
              </div>

              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center px-10">
                <BookIcon />
                <div className="mt-5 font-typewriter text-[11px] uppercase tracking-widest opacity-80">
                  Start today&apos;s reading
                </div>
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-vertical font-typewriter text-[9px] uppercase tracking-widest opacity-40 text-[#F4F1EA]">
                ASSISTED READING LOG
              </div>

            </article>

            <article
              onClick={() => onOpenNotebook('vocabulary')}
              className={`paper-texture relative bg-[#D1D1C9] flex-1 h-[480px] rounded-lg shadow-xl flex flex-col transition-all duration-300 cursor-pointer hover:-translate-y-2${liftingCard === 'vocabulary' ? ' animate-notebook-lift' : ''}`}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#F4F1EA] dark:bg-[#232019] rounded-b-full shadow-inner z-40" />
              <div className="absolute top-8 right-8 -rotate-12">
                <div className="w-20 h-20 rounded-full border border-black/20 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-dashed border-black/15 flex items-center justify-center p-1">
                    <div className="text-center font-typewriter text-[7px] uppercase leading-tight">
                      <div>VOCAB</div>
                      <div className="text-[10px] font-bold">{vocabCount}</div>
                      <div>WORDS</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-20">
                <div className="font-typewriter text-[10px] uppercase tracking-widest opacity-60">
                  VOCABULARY · {vocabCount} WORDS TODAY
                </div>
                <h2 className="text-4xl font-light italic mt-2">Vocabulary</h2>
                <div className="mt-4 inline-flex rounded-full border border-black/10 px-3 py-1 font-typewriter text-[9px] uppercase tracking-widest opacity-60">
                  Eudic {syncStatus}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="border-b border-black/10 pb-4">
                    <div className="font-typewriter text-[10px] uppercase opacity-50 mb-1">Today&apos;s Words</div>
                    <div className="text-xl">{vocabCount} new words</div>
                  </div>
                  <div className="border-b border-black/10 pb-4">
                    <div className="font-typewriter text-[10px] uppercase opacity-50 mb-1">Eudic Sync</div>
                    <div className="text-xl">{syncStatus}</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-8 border-t-2 border-dashed border-black/10 flex items-center justify-between px-4">
                <span className="font-typewriter text-[8px] uppercase tracking-wider opacity-40">Tear here for receipt</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40" aria-hidden="true">
                  <path d="M6 9l6-6 6 6M6 15l6 6 6-6" />
                </svg>
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-vertical font-typewriter text-[9px] uppercase tracking-widest opacity-40">
                VOCABULARY LOG · EUDIC SYNC
              </div>

            </article>
          </div>
        )}

        <div className="w-full max-w-2xl mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-80 px-6 lg:px-12 pb-12">
          <button type="button" onClick={() => onOpenNotebook('tasks')} className="text-left group">
            <div className="w-9 h-9 rounded-full bg-[#1F1F1F] text-[#FFC233] flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <InfoIcon />
            </div>
            <h3 className="text-2xl font-light">Study Progress</h3>
            <p className="mt-2 font-typewriter text-xs leading-5">
              Day {todayDayNumber} of 120 · {completedDaysCount} days complete
            </p>
          </button>

          <button type="button" onClick={() => onOpenNotebook('reading')} className="text-left group">
            <div className="w-9 h-9 rounded-full bg-[#C65D3B] text-[#F4F1EA] flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <BookIcon className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-light">Reading Sessions</h3>
            <p className="mt-2 font-typewriter text-xs leading-5">
              {articleCount} articles read · {currentPass}/7 passes today
            </p>
          </button>

          <button type="button" onClick={() => onOpenNotebook('vocabulary')} className="text-left group">
            <div className="w-9 h-9 rounded-full bg-[#FFC233] text-[#1F1F1F] flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <StarIcon />
            </div>
            <h3 className="text-2xl font-light">Vocabulary</h3>
            <p className="mt-2 font-typewriter text-xs leading-5">
              {totalVocab} total words · Eudic {syncStatus}
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
