// Silent-list math: a person is "silent" when nobody has contacted them for
// SILENT_AFTER_DAYS or more. Pure functions — safe to unit-test.
export const SILENT_AFTER_DAYS = 14;

export interface ContactDates {
  lastContactAt?: string | Date | null;
  createdAt?: string | Date | null;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days since last contact (falls back to when the record was created). */
export function daysSinceContact(p: ContactDates, now: Date = new Date()): number | null {
  const ref = toDate(p.lastContactAt) ?? toDate(p.createdAt);
  if (!ref) return null;
  return Math.max(0, Math.floor((now.getTime() - ref.getTime()) / 86_400_000));
}

/** True when the person has gone quiet for `days` or more. Unknown → false (no false alarms). */
export function isSilent(
  p: ContactDates,
  days: number = SILENT_AFTER_DAYS,
  now: Date = new Date()
): boolean {
  const n = daysSinceContact(p, now);
  return n !== null && n >= days;
}
