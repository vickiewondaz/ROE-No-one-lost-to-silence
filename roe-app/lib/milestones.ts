// Milestone validation shared by routes: real calendar dates, Feb 29 allowed.
import { z } from "zod";

export const milestoneSchema = z
  .object({
    type: z.enum(["birthday", "anniversary", "milestone"]),
    month: z.coerce.number().int().min(1).max(12),
    day: z.coerce.number().int().min(1).max(31),
    notes: z.string().trim().max(280).optional().default(""),
  })
  .refine(
    (v) => {
      const dim = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][v.month - 1];
      return v.day <= (dim ?? 31);
    },
    { message: "That date doesn't exist." }
  );

export function nextOccurrence(month: number, day: number): Date {
  const now = new Date();
  let y = now.getUTCFullYear();
  let d = new Date(Date.UTC(y, month - 1, day));
  if (month === 2 && day === 29 && d.getUTCMonth() !== 1) {
    d = new Date(Date.UTC(y, 1, 28)); // leap birthdays land Feb 28 off-leap
  }
  if (d.getTime() < new Date(Date.UTC(y, now.getUTCMonth(), now.getUTCDate())).getTime()) {
    y += 1;
    d = new Date(Date.UTC(y, month - 1, day));
    if (month === 2 && day === 29 && d.getUTCMonth() !== 1) d = new Date(Date.UTC(y, 1, 28));
  }
  return d;
}
