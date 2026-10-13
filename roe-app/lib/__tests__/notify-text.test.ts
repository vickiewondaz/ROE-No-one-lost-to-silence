import { describe, expect, it } from "vitest";
import { notificationText } from "../notify-text";

describe("notification copy", () => {
  it("maps known types to friendly lines", () => {
    expect(notificationText("assignment")).toBe("New assignment for you");
  });
  it("humanizes unknown future types instead of leaking codes", () => {
    expect(notificationText("visit_reminder")).toBe("Visit reminder");
    expect(notificationText("")).toBe("Update for you");
  });
});
