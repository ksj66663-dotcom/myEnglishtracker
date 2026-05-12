'use client';

interface EditorialSidebarProps {
  dayNumber: number;
  onOpenTask: () => void;
  onOpenReading: () => void;
  onOpenVocab: () => void;
  onSettingsOpen: () => void;
}

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function EditorialSidebar({
  dayNumber,
  onOpenTask,
  onOpenReading,
  onOpenVocab,
  onSettingsOpen,
}: EditorialSidebarProps) {
  return (
    <aside className="w-full lg:w-1/4 h-auto lg:h-screen border-r border-warm-gray/50 flex flex-col justify-between p-8 lg:p-12 z-20 bg-paper">
      <div>
        <button
          type="button"
          onClick={onSettingsOpen}
          className="group inline-flex items-center gap-3 font-typewriter text-xs uppercase tracking-[0.22em]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/30 transition-colors group-hover:bg-ink group-hover:text-paper">
            <ArrowLeftIcon />
          </span>
          Back to Settings
        </button>

        <div className="mt-16 lg:mt-24">
          <h1 className="text-5xl lg:text-7xl font-light leading-[0.9]">
            IELTS<br /><br />Key
          </h1>
          <p className="mt-8 font-typewriter text-xs leading-6 opacity-80">
            Est. 2025 / 120 Day Plan / Day {dayNumber}
          </p>
        </div>
      </div>

      <nav className="hidden lg:flex flex-col gap-5 font-typewriter text-xs uppercase tracking-[0.2em]">
        <button type="button" onClick={onOpenTask} className="flex items-center gap-3 text-left">
          <div className="w-1.5 h-1.5 bg-terracotta rounded-full" />
          My Wallet
        </button>
        <button type="button" onClick={onOpenReading} className="text-left opacity-60 transition-opacity hover:opacity-100">
          Reading Pass
        </button>
        <button type="button" onClick={onOpenVocab} className="text-left opacity-60 transition-opacity hover:opacity-100">
          Vocabulary
        </button>
        <button type="button" onClick={onSettingsOpen} className="text-left opacity-60 transition-opacity hover:opacity-100">
          Settings
        </button>
      </nav>
    </aside>
  );
}
