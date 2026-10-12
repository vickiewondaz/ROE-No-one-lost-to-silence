import { describe, expect, it } from "vitest";
import { buildShareText, buildWhatsAppUrl, ROE_SITE } from "../share";

describe("referral share", () => {
  it("names the church when known, stays generic otherwise", () => {
    expect(buildShareText("Grace Fellowship")).toContain("At Grace Fellowship, we");
    expect(buildShareText(null)).toContain("We stopped losing newcomers");
  });
  it("always carries the site link and the promise", () => {
    const t = buildShareText();
    expect(t).toContain(ROE_SITE);
    expect(t).toContain("no one is lost to silence");
  });
  it("builds an encoded WhatsApp share link", () => {
    const url = buildWhatsAppUrl(buildShareText());
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain(ROE_SITE);
  });
});
