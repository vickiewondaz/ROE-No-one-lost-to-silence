// Pilot pulse math: the two success-bar metrics, computed live from records.
// Cohort = people added in the last 28 days. Pure functions — unit-tested.
export const COHORT_DAYS = 28;
export const CONTACT_TARGET_PCT = 70;
export const CONNECT_TARGET_PCT = 50;

export interface NewcomerDates {
  createdAt?: string | Date | null;
  firstContactAt?: string | Date | null;
  connectedAt?: string | Date | null;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface PilotPulse {
  cohort: number;
  contacted24h: number;
  contactedPct: number;
  connected7d: number;
  connectedPct: number;
}

export function pilotPulse(people: NewcomerDates[], now: Date = new Date()): PilotPulse {
  const cutoff = now.getTime() - COHORT_DAYS * 86_400_000;
  const cohort = people.filter((p) => {
    const c = toDate(p.createdAt);
    return c !== null && c.getTime() >= cutoff;
  });
  let contacted24h = 0;
  let connected7d = 0;
  for (const p of cohort) {
    const created = toDate(p.createdAt)!;
    const first = toDate(p.firstContactAt);
    if (first && first.getTime() - created.getTime() <= 24 * 3_600_000) contacted24h += 1;
    const joined = toDate(p.connectedAt);
    if (joined && joined.getTime() - created.getTime() <= 7 * 86_400_000) connected7d += 1;
  }
  const pct = (n: number) => (cohort.length === 0 ? 0 : Math.round((n / cohort.length) * 100));
  return {
    cohort: cohort.length,
    contacted24h,
    contactedPct: pct(contacted24h),
    connected7d,
    connectedPct: pct(connected7d),
  };
}
