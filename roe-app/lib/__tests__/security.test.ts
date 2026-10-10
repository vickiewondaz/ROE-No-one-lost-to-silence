// Security unit tests: state machine, authorisation, validators, buckets.
// These prove DENIAL, not just success (TRD §11). Run: npm test.
import { describe, expect, it, vi } from "vitest";
import { can, canTransition, type AuthCtx } from "@/lib/authz";
import { dbUuid } from "@/lib/validate";
import { toBucket } from "@/lib/actions";
import { milestoneSchema, nextOccurrence } from "@/lib/milestones";
import { omniChat, welcomeMessagePrompt } from "@/lib/ai/omniroute";

const ORG = "11111111-1111-1111-8111-111111111111";
const OTHER = "99999999-9999-9999-8999-999999999999";
const P1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const worker: AuthCtx = {
  userId: "u1",
  orgId: ORG,
  role: "worker",
  assignedPersonIds: [P1],
};

describe("canTransition (TRD §17)", () => {
  it.each([
    ["Open", "In Progress", {}, true],
    ["In Progress", "Completed", { hasOutcome: true }, true],
    ["In Progress", "Completed", { hasOutcome: false }, false],
    ["Open", "Completed", { hasOutcome: true }, false],
    ["Open", "Paused", {}, true],
    ["In Progress", "Paused", {}, true],
    ["Paused", "In Progress", {}, true],
    ["Paused", "Completed", { hasOutcome: true }, false],
    ["Completed", "Open", {}, false],
  ] as const)(" %s → %s = %s", (from, to, opts, expected) => {
    expect(canTransition(from, to, opts)).toBe(expected);
  });
});

describe("can() deny-by-default", () => {
  it("denies cross-org even for valid roles (TRD Ex. A)", () => {
    expect(can(worker, "people:read", { orgId: OTHER, personId: P1 })).toBe(false);
  });
  it("denies restricted care to group leaders (TRD Ex. C)", () => {
    expect(
      can({ ...worker, role: "group_leader" }, "people:read", {
        orgId: ORG,
        personId: P1,
        sensitivity: "restricted",
      })
    ).toBe(false);
  });
  it("allows assigned worker, denies unassigned", () => {
    expect(can(worker, "people:read", { orgId: ORG, personId: P1 })).toBe(true);
    expect(
      can({ ...worker, assignedPersonIds: [] }, "people:read", { orgId: ORG, personId: P1 })
    ).toBe(false);
  });
  it("member sees own row only", () => {
    const m: AuthCtx = { userId: "u9", orgId: ORG, role: "member", ownPersonId: "p9" };
    expect(can(m, "people:read", { orgId: ORG, personId: "p9", ownerId: "p9" })).toBe(true);
    expect(can(m, "people:read", { orgId: ORG, personId: P1 })).toBe(false);
    expect(can(m, "interactions:create", { orgId: ORG, personId: "p9" })).toBe(false);
  });
  it("denies unknown ops and unauthenticated shapes", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(can(worker, "nukes:launch" as any, { orgId: ORG })).toBe(false);
  });
});

describe("dbUuid matches Postgres, not just RFC", () => {
  it("accepts RFC and seed-style ids", () => {
    expect(dbUuid.safeParse("e943739e-c2f0-4e6d-91d3-a9a01a11e147").success).toBe(true);
    expect(dbUuid.safeParse("44444444-4444-4444-8444-444444444444").success).toBe(true);
  });
  it("rejects garbage", () => {
    for (const bad of ["", "abc", "1'; DROP TABLE people;--", "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"]) {
      expect(dbUuid.safeParse(bad).success).toBe(false);
    }
  });
});

describe("toBucket", () => {  it("buckets by calendar day", () => {
    const t = new Date();
    const past = new Date(t.getTime() - 86400000);
    const future = new Date(t.getTime() + 2 * 86400000);
    expect(toBucket(past, "Open")).toBe("overdue");
    expect(toBucket(t, "Open")).toBe("today");
    expect(toBucket(future, "Open")).toBe("upcoming");
    expect(toBucket(past, "Completed")).toBe("completed");
  });
});

describe("omniroute adapter", () => {
  const msgs = welcomeMessagePrompt("Ana", "first visit, likes music");
  it("builds a guarded prompt", () => {
    const text = JSON.stringify(msgs);
    expect(text).toContain("Ana");
    for (const banned of ["spiritually weak", "inactive", "failed member", "lost"]) {
      expect(text.toLowerCase()).not.toContain(banned);
    }
  });
  it("returns text + decision header", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(
        JSON.stringify({ model: "auto", choices: [{ message: { content: "Hi Ana!" } }] }),
        { headers: { "X-OmniRoute-Decision": "strategy=auto provider=test" } }
      )
    ) as unknown as typeof fetch;
    const r = await omniChat(msgs, { baseUrl: "http://x/v1" }, fetchFn);
    expect(r.text).toBe("Hi Ana!");
    expect(r.decision).toContain("provider=test");
  });
  it("throws on http error and empty replies", async () => {
    const bad = vi.fn(async () => new Response("nope", { status: 502 })) as unknown as typeof fetch;
    await expect(omniChat(msgs, { baseUrl: "http://x/v1" }, bad)).rejects.toThrow();
    const empty = vi.fn(async () => new Response(JSON.stringify({ choices: [] }))) as unknown as typeof fetch;
    await expect(omniChat(msgs, { baseUrl: "http://x/v1" }, empty)).rejects.toThrow();
  });
});

describe("milestones: real dates only", () => {
  it("accepts valid dates incl. Feb 29", () => {
    expect(milestoneSchema.safeParse({ type: "birthday", month: 3, day: 15 }).success).toBe(true);
    expect(milestoneSchema.safeParse({ type: "anniversary", month: 2, day: 29 }).success).toBe(true);
  });
  it("rejects impossible dates and bad types", () => {
    expect(milestoneSchema.safeParse({ type: "birthday", month: 2, day: 30 }).success).toBe(false);
    expect(milestoneSchema.safeParse({ type: "birthday", month: 13, day: 1 }).success).toBe(false);
    expect(milestoneSchema.safeParse({ type: "party", month: 1, day: 1 }).success).toBe(false);
  });
  it("nextOccurrence lands this year or next, honoring leap birthdays", () => {
    const n = nextOccurrence(2, 29);
    expect([28, 29]).toContain(n.getUTCDate());
    expect(n.getUTCMonth()).toBe(1);
    const future = nextOccurrence(12, 25);
    expect(future.getTime()).toBeGreaterThanOrEqual(Date.now() - 86400000);
  });
});
