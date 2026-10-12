import { describe, expect, it } from "vitest";
import { daysSinceContact, isSilent, SILENT_AFTER_DAYS } from "../silence";

const DAY = 86_400_000;
const NOW = new Date("2026-10-12T12:00:00Z");
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

describe("silent list", () => {
  it("counts from the last contact", () => {
    expect(daysSinceContact({ lastContactAt: ago(3) }, NOW)).toBe(3);
  });
  it("falls back to record creation when never contacted", () => {
    expect(daysSinceContact({ createdAt: ago(30) }, NOW)).toBe(30);
  });
  it("flags 14+ quiet days as silent", () => {
    expect(isSilent({ lastContactAt: ago(20) }, SILENT_AFTER_DAYS, NOW)).toBe(true);
    expect(isSilent({ lastContactAt: ago(14) }, SILENT_AFTER_DAYS, NOW)).toBe(true);
  });
  it("leaves recent and fresh people alone", () => {
    expect(isSilent({ lastContactAt: ago(2) }, SILENT_AFTER_DAYS, NOW)).toBe(false);
    expect(isSilent({ createdAt: ago(2) }, SILENT_AFTER_DAYS, NOW)).toBe(false);
  });
  it("never alarms on missing dates", () => {
    expect(isSilent({}, SILENT_AFTER_DAYS, NOW)).toBe(false);
    expect(daysSinceContact({})).toBeNull();
  });
});
