'use client';

interface EditorialInfoGridProps {
  tasksDoneCount: number;
  articlesCount: number;
  vocabCount: number;
  onOpenTask: () => void;
  onOpenReading: () => void;
  onOpenVocab: () => void;
}

function WifiIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M8.5 16a6 6 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </svg>
  );
}

function BreakfastIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11h16" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M8 11V7" />
      <path d="M12 11V6" />
      <path d="M16 11V7" />
    </svg>
  );
}

export default function EditorialInfoGrid({
  tasksDoneCount,
  articlesCount,
  vocabCount,
  onOpenTask,
  onOpenReading,
  onOpenVocab,
}: EditorialInfoGridProps) {
  return (
    <div className="w-full max-w-2xl mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-80">
      <button type="button" onClick={onOpenTask} className="text-left group">
        <div className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center font-sans-modern text-sm mb-4 transition-transform group-hover:scale-110">
          i
        </div>
        <h3 className="text-2xl font-light">Check-in Info</h3>
        <p className="mt-2 font-typewriter text-xs leading-5">
          Front desk open 24/7. {tasksDoneCount} of 9 daily tasks stamped.
        </p>
      </button>

      <button type="button" onClick={onOpenReading} className="text-left group">
        <div className="w-9 h-9 rounded-full bg-terracotta text-paper flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
          <WifiIcon />
        </div>
        <h3 className="text-2xl font-light">Reading Access</h3>
        <p className="mt-2 font-typewriter text-xs leading-5">
          Network: PostGuest. Articles logged: {articlesCount}.
        </p>
      </button>

      <button type="button" onClick={onOpenVocab} className="text-left group">
        <div className="w-9 h-9 rounded-full bg-mustard text-ink flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
          <BreakfastIcon />
        </div>
        <h3 className="text-2xl font-light">Breakfast</h3>
        <p className="mt-2 font-typewriter text-xs leading-5">
          Served daily with {vocabCount} vocabulary slips ready.
        </p>
      </button>
    </div>
  );
}
