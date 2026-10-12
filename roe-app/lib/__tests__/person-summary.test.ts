import { describe, expect, it } from "vitest";
import { firstWeekChecklist, summarizePerson } from "../person-summary";

const DAY = 86_400_000;
const NOW = new Date("2026-10-12T12:00:00Z");
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

describe("first-week checklist", () => {
  it("shows during the first 7 days with steps derived from activity", () => {
    const r = firstWeekChecklist(
      { createdAt: ago(3), interactionCount: 1, hasGroup: false },
      NOW
    );
    expect(r.show).toBe(true);
    expect(r.steps.find((s) => s.key === "welcomed")?.done).toBe(true);
    expect(r.steps.find((s) => s.key === "contacted")?.done).toBe(false);
    expect(r.steps.find((s) => s.key === "group")?.done).toBe(false);
  });
  it("completes all steps for a connected newcomer", () => {
    const r = firstWeekChecklist(
      { createdAt: ago(5), interactionCount: 3, hasGroup: true },
      NOW
    );
    expect(r.show).toBe(true);
    expect(r.steps.every((s) => s.done)).toBe(true);
  });
  it("hides after day 7", () => {
    expect(
      firstWeekChecklist({ createdAt: ago(9), interactionCount: 0, hasGroup: false }, NOW).show
    ).toBe(false);
  });
});

describe("worker summary", () => {
  it("writes one paragraph from the record", () => {
    expect(
      summarizePerson(
        { firstName: "Sarah", lastContact: "Tuesday via WhatsApp", interests: "Choir" },
        2,
        "Young Adults"
      )
    ).toBe("Sarah — 2 check-ins, last contact Tuesday via WhatsApp, likes Choir, in Young Adults.");
  });
  it("handles a brand-new person gracefully", () => {
    expect(summarizePerson({ firstName: "Michael" }, 0)).toBe("Michael — no check-ins yet.");
  });
});
