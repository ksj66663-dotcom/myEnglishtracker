"use client";

import { useEffect, useState } from "react";
import type { NotebookId } from "@/components/HomeClient";

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
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
      <div className="paper-texture flex-1 h-[480px] rounded-2xl paper-pulse shadow-2xl" />
      <div className="paper-texture flex-1 h-[480px] rounded-2xl paper-pulse shadow-xl" />
      <div className="paper-texture flex-1 h-[480px] rounded-2xl paper-pulse shadow-xl" />
    </div>
  );
}

export default function DeskView({
  activeCard,
  loading,
  liftingCard,
  todayDayNumber,
  onBringToFront,
  onOpenNotebook,
  onSettingsOpen,
}: DeskViewProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ielts-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ielts-theme", next ? "dark" : "light");
  };

  const cards = [
    ["tasks", "TASK LOG"],
    ["reading", "READING LOG"],
    ["vocabulary", "VOCABULARY"],
  ] as const;

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row overflow-hidden bg-[#F7F1E3] text-[#2F3428]">
      <aside className="w-full lg:w-1/4 h-auto lg:h-screen border-r border-[#D8D0BA]/60 flex flex-col justify-between p-8 lg:p-12 z-20 bg-[#F7F1E3]">
        <div>
          <button
            type="button"
            onClick={onSettingsOpen}
            className="group inline-flex items-center gap-3 font-typewriter text-xs uppercase tracking-widest opacity-60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2F3428]/20 transition-colors group-hover:bg-[#A9BFA3] group-hover:text-white">
              <ArrowLeftIcon />
            </span>
            Back
          </button>

          <div className="mt-16 lg:mt-24">
            <h1 className="text-5xl lg:text-7xl font-light leading-[1.08] tracking-wide">
              IELTS
              <br />
              <em className="not-italic">GO</em>
            </h1>
          </div>
        </div>

        <nav className="hidden lg:flex flex-col gap-3">
          {cards.map(([id, label]) => {
            const active = activeCard === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onBringToFront(id as NotebookId)}
                className={`font-typewriter text-xs uppercase tracking-widest text-left flex items-center gap-3 ${
                  active
                    ? ""
                    : "opacity-50 hover:opacity-100 hover:text-[#7F9A78]"
                }`}
              >
                {active && (
                  <span className="w-1.5 h-1.5 bg-[#7F9A78] rounded-full" />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <button
        type="button"
        onClick={toggleDark}
        className="fixed bottom-6 left-6 z-50 hidden lg:flex h-10 w-10 rounded-full items-center justify-center shadow-md transition-transform hover:scale-110 bg-[#2F3428] text-[#F7F1E3]"
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light mode" : "Night mode"}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <main className="flex-1 w-full h-full relative overflow-y-auto lg:overflow-hidden p-6 lg:p-0 bg-[#EFE8D8]">
        {loading ? (
          <SkeletonDesk />
        ) : (
          <div className="relative w-full flex flex-col lg:flex-row gap-4 lg:gap-6 lg:ml-12 lg:pr-12 mt-8 lg:mt-12">
            {cards.map(([id, title]) => (
              <article
                key={id}
                onClick={() => onOpenNotebook(id as NotebookId)}
                className={`paper-texture relative flex-1 h-[480px] rounded-2xl shadow-xl flex flex-col transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-2xl bg-[#DCCFC0] border border-white/60 overflow-hidden ${
                  liftingCard === id ? " animate-notebook-lift" : ""
                }`}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#F7F1E3] rounded-b-full shadow-inner z-40" />

                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full border border-[#7F9A78]/30" />
                  <div className="absolute right-10 bottom-12 w-24 h-24 rounded-full border border-dashed border-[#7F9A78]/30" />
                  <div className="absolute left-8 bottom-8 text-5xl opacity-10">
                    ✦
                  </div>
                </div>

                <div className="p-10 pt-24 flex flex-col h-full">
                  <div className="font-typewriter text-[16px] uppercase tracking-[0.32em] text-[#6D785F]">
                    {title}
                  </div>

                  <h2 className="mt-8 text-6xl lg:text-5xl font-light leading-none tracking-tight text-[#2F3428]">
                    Day {todayDayNumber}
                  </h2>

                  <div className="mt-auto">
                    <div className="inline-flex rounded-full border border-[#7F9A78]/30 bg-white/25 px-4 py-2 font-typewriter text-[10px] uppercase tracking-widest text-[#6D785F]">
                      Tap to open
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
