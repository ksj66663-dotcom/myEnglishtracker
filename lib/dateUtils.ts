export const START_DATE = '2026-05-08';
export const TOTAL_DAYS = 120;
export const MILESTONE_DAYS = [25, 50, 75, 100];

export function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getDayNumber(dateStr: string): number {
  const start = parseDateLocal(START_DATE);
  const current = parseDateLocal(dateStr);
  const diff = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function getDateStrFromDayNumber(dayNumber: number): string {
  const [sy, sm, sd] = START_DATE.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  start.setDate(start.getDate() + dayNumber - 1);
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isMilestoneDay(dayNumber: number): boolean {
  return MILESTONE_DAYS.includes(dayNumber);
}

export function isValidDay(dayNumber: number): boolean {
  return dayNumber >= 1 && dayNumber <= TOTAL_DAYS;
}

/** English display: "Monday, May 9" */
export function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Short English: "09 MAY 2026" */
export function formatDateStamp(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dd = String(d).padStart(2, '0');
  const mon = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${dd} ${mon} ${y}`;
}

/** Dot format: "2026.05.09" */
export function formatDateDot(dateStr: string): string {
  return dateStr.replace(/-/g, '.');
}

/** Plan end date string */
export function getPlanEndDateStr(): string {
  const [sy, sm, sd] = START_DATE.split('-').map(Number);
  const end = new Date(sy, sm - 1, sd);
  end.setDate(end.getDate() + TOTAL_DAYS - 1);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
}
