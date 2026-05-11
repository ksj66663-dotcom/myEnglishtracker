'use client';

interface PassHeaderProps {
  readingPass: number;
  label: string;
  subLabel?: string;
}

const DONE_THRESHOLD = [2, 4, 5, 6, 7, 8, 9];
const ACTIVE_DB     = [1, 3, 4, 5, 6, 7, 8];
const PASS_LABELS   = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];

function boxStatus(i: number, dbPass: number): 'done' | 'active' | 'future' {
  if (dbPass >= 9) return 'done';
  if (dbPass >= DONE_THRESHOLD[i]) return 'done';
  if (dbPass === 2 && i === 0) return 'done';
  if (dbPass === ACTIVE_DB[i]) return 'active';
  return 'future';
}

export default function PassHeader({ readingPass, label, subLabel }: PassHeaderProps) {
  if (readingPass === 0) return null;

  return (
    <div
      className="flex-shrink-0 px-6 py-4 space-y-3"
      style={{
        borderBottom: '1px dashed rgba(0,0,0,0.12)',
        background: 'var(--bg-1)',
      }}
    >
      {/* 7-segment progress bar */}
      <div className="flex gap-1.5 items-center">
        {PASS_LABELS.map((pl, i) => {
          const status = boxStatus(i, readingPass);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-full transition-all duration-500"
                style={{
                  height: '4px',
                  background:
                    status === 'done'   ? 'var(--color-mustard)' :
                    status === 'active' ? 'var(--color-terracotta)' :
                    'rgba(0,0,0,0.10)',
                  boxShadow: status === 'done' ? '0 1px 2px rgba(255,194,51,0.30)' : 'none',
                }}
                title={pl}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color:
                    status === 'done'   ? 'var(--color-mustard)' :
                    status === 'active' ? 'var(--color-terracotta)' :
                    'var(--color-ink)',
                  opacity: status === 'future' ? 0.25 : 1,
                }}
              >
                {pl}
              </span>
            </div>
          );
        })}
      </div>

      {/* Label row */}
      <div className="flex items-baseline gap-3">
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--color-terracotta)',
          }}
        >
          {label}
        </span>
        {subLabel && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              opacity: 0.5,
              color: 'var(--color-ink)',
            }}
          >
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}
