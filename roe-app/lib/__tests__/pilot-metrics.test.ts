import { describe, expect, it } from "vitest";
import { pilotPulse } from "../pilot-metrics";

const DAY = 86_400_000;
const NOW = new Date("2026-10-12T12:00:00Z");
const ago = (days: number, hours = 0) =>
  new Date(NOW.getTime() - days * DAY - hours * 3_600_000).toISOString();

describe("pilot pulse", () => {
  it("measures the 24h-contact and 7d-connect bars over the 28-day cohort", () => {
    const people = [
      // contacted 6h after arrival, connected day 3 → counts both
      {
        createdAt: ago(10),
        firstContactAt: new Date(NOW.getTime() - 10 * DAY + 6 * 3_600_000).toISOString(),
        connectedAt: ago(7),
      },
      // contacted day 2 (misses 24h), never connected
      { createdAt: ago(10), firstContactAt: ago(8), connectedAt: null },
      // fresh arrival 2h ago, untouched — pending, still in cohort
      { createdAt: ago(0, 2), firstContactAt: null, connectedAt: null },
      // old record outside the cohort — ignored entirely
      { createdAt: ago(60), firstContactAt: ago(60), connectedAt: ago(50) },
    ];
    const r = pilotPulse(people, NOW);
    expect(r.cohort).toBe(3);
    expect(r.contacted24h).toBe(1);
    expect(r.contactedPct).toBe(33);
    expect(r.connected7d).toBe(1);
    expect(r.connectedPct).toBe(33);
  });
  it("handles an empty cohort without NaN", () => {
    const r = pilotPulse([], NOW);
    expect(r).toEqual({ cohort: 0, contacted24h: 0, contactedPct: 0, connected7d: 0, connectedPct: 0 });
  });
});
