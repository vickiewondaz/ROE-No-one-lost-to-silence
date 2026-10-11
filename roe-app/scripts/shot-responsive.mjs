// Responsive proof: public/demo screens at mobile 390px + desktop 1440px.
// No credentials, no writes — signed-out demo views only.
// Usage: node scripts/shot-responsive.mjs [baseUrl]
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3125";
const out = "screenshots/responsive";
mkdirSync(out, { recursive: true });

const mob = { width: 390, height: 844, isMobile: true, hasTouch: true };
const desk = { width: 1440, height: 900 };

const browser = await chromium.launch();

async function snap(path, name, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: !!vp.isMobile,
    hasTouch: !!vp.hasTouch,
  });
  const pg = await ctx.newPage();
  await pg.goto(base + path, { waitUntil: "networkidle" });
  await pg.waitForTimeout(900);
  // Flag horizontal overflow (responsive failure signal).
  const overflow = await pg.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  await pg.screenshot({ path: `${out}/${name}.png` });
  console.log(`shot ${name} overflow-x=${overflow}px`);
  await ctx.close();
}

const pages = ["/", "/login", "/join", "/home", "/people", "/actions", "/more"];
for (const p of pages) {
  const slug = p === "/" ? "landing" : p.slice(1).replace(/\//g, "-");
  await snap(p, `${slug}-mob`, mob);
  await snap(p, `${slug}-desk`, desk);
}

await browser.close();
console.log("done");
