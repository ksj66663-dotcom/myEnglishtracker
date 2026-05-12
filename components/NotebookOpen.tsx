'use client';

interface NotebookOpenProps {
  title: string;
  dateLabel: string;
  onClose: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function NotebookOpen({
  title,
  dateLabel,
  onClose,
  left,
  right,
}: NotebookOpenProps) {
  return (
    <div
      className="relative w-full bg-[#F4F1EA] dark:bg-[#2B2820] paper-texture rounded-lg flex flex-col overflow-hidden"
      style={{
        maxWidth: '1100px',
        height: 'min(90vh, 820px)',
        boxShadow:
          '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.06), inset 0 2px 0 1px rgba(255,255,255,0.6)',
        borderTop: '1px solid rgba(255,255,255,0.8)',
      }}
    >
      <header className="flex-shrink-0 border-b border-black/10 px-8 py-3 flex items-center justify-between">
        <div className="font-typewriter text-[10px] uppercase tracking-widest opacity-60">
          IELTS TRACKER · {title}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block font-typewriter text-[10px] uppercase tracking-widest opacity-60">
            {dateLabel}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex-shrink-0 rounded-full bg-[#1F1F1F] text-[#FFC233] flex items-center justify-center transition-transform hover:scale-110"
            aria-label="Close notebook"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <section className="flex-1 min-h-0 border-b border-black/10 lg:border-b-0 p-8 lg:p-12 overflow-y-auto lined-paper">
          {left}
        </section>

        {/* Book spine */}
        <div className="hidden lg:block w-px flex-shrink-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />

        <section className="flex-1 min-h-0 p-8 lg:p-12 overflow-y-auto">
          {right}
        </section>
      </div>
    </div>
  );
}
