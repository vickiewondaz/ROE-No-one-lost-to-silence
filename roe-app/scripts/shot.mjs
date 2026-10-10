// Visual record: screenshots of the live app (mobile 390px + desktop 1440px).
// Usage: node scripts/shot.mjs [baseUrl]. Defaults to local prod server.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3125";
const mode = process.argv[3] ?? "default";
const out = "screenshots";
mkdirSync(out, { recursive: true });

const mob = { width: 390, height: 844, isMobile: true, hasTouch: true };
const desk = { width: 1440, height: 900 };

const browser = await chromium.launch();

async function loginAs(pg, email, password) {
  await pg.goto(base + "/login", { waitUntil: "networkidle" });
  await pg.fill('input[type="email"]', email);
  await pg.fill('input[type="password"]', password);
  await pg.click('button[type="submit"]');
  await pg.waitForTimeout(2500);
}

if (mode === "roles") {
  // Riverside Chapel, DemoPass123! — worker, leader, member, admin views.
  async function roleShot(email, path, name) {
    const ctx = await browser.newContext({ viewport: { width: mob.width, height: mob.height }, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage();
    await loginAs(pg, email, "DemoPass123!");
    await pg.goto(base + path, { waitUntil: "networkidle" });
    await pg.waitForTimeout(800);
    await pg.screenshot({ path: `${out}/${name}.png` });
    console.log("shot " + name);
    await ctx.close();
  }
  await roleShot("david@riverside.test", "/home", "20-worker-home");
  await roleShot("funke@riverside.test", "/home", "21-leader-home");
  await roleShot("sarah@riverside.test", "/home", "22-member-home");
  await roleShot("amara@riverside.test", "/admin", "23-riverside-admin");
  await browser.close();
  console.log("done");
  process.exit(0);
}
async function snap(path, name, opts, setup) {
  const ctx = await browser.newContext({ viewport: { width: opts.width, height: opts.height }, isMobile: !!opts.isMobile, hasTouch: !!opts.hasTouch });
  const pg = await ctx.newPage();
  if (setup) await setup(pg);
  await pg.goto(base + path, { waitUntil: "networkidle" });
  await pg.waitForTimeout(800);
  await pg.screenshot({ path: `${out}/${name}.png` });
  console.log("shot " + name);
  await ctx.close();
}

async function loginAsVickie(pg) {
  await pg.goto(base + "/login", { waitUntil: "networkidle" });
  await pg.fill('input[type="email"]', "victorypoggen@gmail.com");
  await pg.fill('input[type="password"]', "vickiewondaz2019");
  await pg.click('button[type="submit"]');
  await pg.waitForURL("**/home", { timeout: 15000 }).catch(() => {});
  await pg.waitForTimeout(1000);
}

// Public (mobile)
await snap("/", "01-landing-mobile", mob);
await snap("/login", "02-login-mobile", mob);
// Demo (signed out → seeded demo data)
await snap("/home", "03-home-demo-mobile", mob);
await snap("/people", "04-people-demo-mobile", mob);
await snap("/people/sarah", "05-profile-demo-mobile", mob);
await snap("/actions", "06-actions-demo-mobile", mob);
// Real (Vickie session)
await snap("/home", "07-home-admin-mobile", mob, loginAsVickie);
await snap("/admin", "08-admin-mobile", mob, loginAsVickie);
await snap("/platform", "09-platform-mobile", mob, loginAsVickie);
// Desktop
await snap("/", "10-landing-desktop", desk);
await snap("/home", "11-home-demo-desktop", desk);

await browser.close();
console.log("done");
