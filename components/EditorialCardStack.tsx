'use client';

interface EditorialCardStackProps {
  guestName: string;
  roomNumber: string;
  arrivalDate: string;
  departureDate: string;
  clock: string;
  tasksDoneCount: number;
  readingPass: number;
  articlesCount: number;
  vocabCount: number;
  readingSynced: boolean;
  onUnlock: () => void;
  onOpenReading: () => void;
  onOpenVocab: () => void;
}

function ScissorsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="7" r="3" />
      <circle cx="6" cy="17" r="3" />
      <path d="M8.5 8.5 20 20" />
      <path d="M8.5 15.5 20 4" />
    </svg>
  );
}

function MapPinTreeIcon() {
  return (
    <svg className="w-28 h-28 mb-8" viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M70 125s39-38 39-72a39 39 0 0 0-78 0c0 34 39 72 39 72Z" strokeWidth="3" />
      <path d="M70 74V38" strokeWidth="3" />
      <path d="M70 42 52 60" strokeWidth="3" />
      <path d="M70 42 88 60" strokeWidth="3" />
      <path d="M58 74h24" strokeWidth="3" />
    </svg>
  );
}

function UnlockButton({ onUnlock }: { onUnlock: () => void }) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      className="group absolute bottom-12 right-12 flex flex-col items-center gap-2 cursor-pointer"
      aria-label="Unlock task notebook"
    >
      <span className="relative w-16 h-16 rounded-full bg-ink text-mustard flex items-center justify-center transition-transform duration-300 hover:scale-110 group-hover:scale-110">
        <svg className="absolute w-7 h-7 transition-opacity duration-300 opacity-100 group-hover:opacity-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <svg className="absolute w-7 h-7 transition-opacity duration-300 opacity-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M15 10V7a4 4 0 0 0-7.7-1.5" />
        </svg>
      </span>
      <span className="font-typewriter text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
        Unlock
      </span>
    </button>
  );
}

export default function EditorialCardStack({
  guestName,
  roomNumber,
  arrivalDate,
  departureDate,
  clock,
  tasksDoneCount,
  readingPass,
  articlesCount,
  vocabCount,
  readingSynced,
  onUnlock,
  onOpenReading,
  onOpenVocab,
}: EditorialCardStackProps) {
  const readingLabel = readingPass === 0 ? 'Not started' : readingPass >= 9 ? 'Complete' : `Pass ${readingPass} of 7`;
  const syncLabel = readingSynced ? 'Eudic synced' : 'Eudic pending';

  return (
    <div className="relative w-full max-w-4xl h-auto lg:h-[600px] flex flex-col lg:block">
      <article className="paper-texture relative lg:absolute lg:top-8 lg:right-0 bg-warm-gray w-full lg:w-[400px] h-[580px] rounded-lg shadow-xl transform lg:rotate-3 transition-transform hover:rotate-2 duration-500 z-10 flex flex-col border border-black/5">
        <div className="absolute left-3 top-8 bottom-8 font-typewriter text-[10px] tracking-[0.22em] uppercase text-vertical opacity-40">
          ielts.local s. 120
        </div>

        <div className="absolute top-10 right-9 -rotate-12">
          <div className="w-28 h-28 rounded-full border border-dashed border-ink/45 flex items-center justify-center text-center font-typewriter text-[9px] uppercase tracking-[0.12em] leading-4">
            OFFICIAL<br />RECEIPT<br />NO. {roomNumber}
          </div>
        </div>

        <div className="px-12 pt-20">
          <p className="font-typewriter text-xs uppercase tracking-[0.22em] opacity-50">Guest Ledger</p>
          <div className="mt-20">
            <p className="font-typewriter text-[10px] uppercase tracking-[0.2em] opacity-50">Guest</p>
            <h2 className="mt-2 text-4xl font-light leading-none">{guestName}</h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-7 font-typewriter text-xs">
            <div>
              <p className="uppercase tracking-[0.18em] opacity-50">Arrival</p>
              <p className="mt-2">{arrivalDate}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] opacity-50">Departure</p>
              <p className="mt-2">{departureDate}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto px-12 pb-16 font-typewriter text-[10px] uppercase tracking-[0.2em] opacity-45">
          {tasksDoneCount} of 9 tasks stamped<br />
          Local time {clock || '--:--:--'}<br />
          {syncLabel}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-8 border-t-2 border-dashed border-black/10 flex items-center justify-center gap-3 font-typewriter text-[10px] uppercase tracking-[0.2em] opacity-50">
          <ScissorsIcon />
          Tear here for receipt
        </div>
      </article>

      <article className="paper-texture relative lg:absolute lg:top-4 lg:left-24 bg-terracotta w-full lg:w-[380px] h-[550px] rounded-lg shadow-xl transform lg:-rotate-2 transition-transform hover:-rotate-1 duration-500 z-20 flex flex-col text-paper -mt-24 lg:mt-0">
        <button
          type="button"
          onClick={onOpenReading}
          className="absolute left-8 top-8 w-24 h-24 animate-[spin_60s_linear_infinite]"
          aria-label="Open reading notebook"
        >
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <path id="stay-curve" d="M 60, 60 m -46, 0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0" fill="transparent" />
            </defs>
            <text className="font-typewriter text-[8px] uppercase tracking-[0.24em]" fill="currentColor">
              <textPath href="#stay-curve">Bad Hofgastein • Have a wonderful stay • </textPath>
            </text>
          </svg>
        </button>

        <div className="absolute right-5 top-8 bottom-8 font-typewriter text-[10px] tracking-[0.18em] uppercase text-vertical opacity-70">
          reading {readingLabel} • articles {articlesCount}
        </div>

        <button type="button" onClick={onOpenReading} className="flex-1 flex flex-col items-center justify-center text-center px-12">
          <MapPinTreeIcon />
          <p className="font-typewriter text-xs uppercase tracking-[0.28em] opacity-80">Explore the area</p>
        </button>
      </article>

      <article className="paper-texture relative lg:absolute lg:top-12 lg:left-0 bg-mustard w-full lg:w-[420px] h-[540px] rounded-lg shadow-2xl z-30 flex flex-col -mt-24 lg:mt-0 transition-all hover:translate-y-[-5px]">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 bg-paper rounded-b-full shadow-inner border-t-0 z-40" />

        <div className="px-10 pt-24">
          <h2 className="text-6xl font-light leading-[0.85]">
            For cosy<br /><span className="italic pl-4">days</span>
          </h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center -mt-5">
          <div className="w-24 h-24 mb-2 relative"><svg viewBox="0 0 200 200" className="w-full h-full text-[#1F1F1F]"><path d="M40,120 Q60,110 80,115 T120,110 T160,115" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M50,120 L60,150 M140,115 L150,145 M100,112 L110,148" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M140,80 Q130,60 110,65 Q90,50 70,70 L60,90 Q80,100 100,95 L120,90 Z" fill="currentColor" opacity="0.9"/><circle cx="110" cy="55" r="10" fill="currentColor"/><path d="M120,55 L140,50 L135,70" fill="currentColor"/><path d="M30,130 L10,130 M25,125 L15,125" stroke="currentColor" strokeWidth="2"/></svg></div>
          <p className="text-4xl font-light">at Post <span className="italic">Post</span></p>
        </div>

        <button type="button" onClick={onOpenVocab} className="absolute bottom-10 left-10" aria-label="Open vocabulary notebook">
          <div className="relative w-32 h-28 flex items-center justify-center transform -rotate-6">
            <svg className="absolute w-full h-full text-[#1F1F1F]" viewBox="0 0 100 100" fill="none"><path d="M50 5 L95 90 L5 90 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" strokeLinejoin="round" className="squiggly-border"/><path d="M50 8 Q55 18 58 24 Q61 30 65 38 Q69 46 72 52 Q76 60 80 68 Q84 76 88 84 Q92 92 88 92 Q80 92 72 92 Q64 92 56 92 Q48 92 40 92 Q32 92 24 92 Q16 92 12 92 Q8 92 12 84 Q16 76 20 68 Q24 60 28 52 Q32 46 36 38 Q40 30 43 24 Q46 18 50 8 Z" fill="none" stroke="currentColor" strokeWidth="0.8"/></svg>
            <div className="relative z-10 text-center pt-4">
              <span className="block font-sans-modern text-[10px] uppercase tracking-wider mb-1">Room No</span>
              <span className="block font-typewriter text-3xl font-bold">{roomNumber}</span>
            </div>
          </div>
          <span className="sr-only">{vocabCount} vocabulary words</span>
        </button>

        <UnlockButton onUnlock={onUnlock} />
      </article>
    </div>
  );
}
