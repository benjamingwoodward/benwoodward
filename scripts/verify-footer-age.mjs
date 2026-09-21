import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import { ageInSeconds, BIRTH_EPOCH } from "../src/lib/age-counter.ts";

const engine = process.env.BRAND_BROWSER || "chromium";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const output = `/tmp/bio-footer-age-${engine}`;
await mkdir(output, { recursive: true });
const browser = await (engine === "webkit" ? webkit : chromium).launch({ executablePath: engine === "webkit" ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH });
const results = [], errors = [];
const check = async (name, run) => { await run(); results.push(name); console.log(`PASS ${engine}: ${name}`); };
const fresh = async (options = {}) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  await context.route("**/api/hit", route => route.fulfill({ status: 204 }));
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  return page;
};
try {
  await check("Date-only UTC arithmetic, second boundaries and leap years", async () => {
    assert.equal(BIRTH_EPOCH, Date.parse("2003-03-18T00:00:00Z"));
    assert.equal(ageInSeconds(BIRTH_EPOCH - 1), 0);
    assert.equal(ageInSeconds(BIRTH_EPOCH + 999), 0);
    assert.equal(ageInSeconds(BIRTH_EPOCH + 1_000), 1);
    assert.equal(ageInSeconds(Date.parse("2003-03-19T00:00:00Z")), 86400);
    assert.equal(ageInSeconds(Date.parse("2004-03-18T00:00:00Z")), 366 * 86400);
  });
  const page = await fresh();
  await page.goto(`${base}/#top`);
  await check("Operator rolling-digit timing; footer reveal waits until visible", async () => {
    await page.waitForFunction(() => document.querySelector("[data-age-value]").getAnimations({ subtree: true }).length > 0);
    const count = Number(await page.locator("[data-age-counter]").getAttribute("data-age-seconds"));
    assert.ok(Math.abs(count - ageInSeconds()) <= 1);
    assert.match(await page.locator("[data-age-live]").textContent(), /Seconds building/);
    assert.equal(await page.locator("[data-age-value]").evaluate(el => el.getAnimations({ subtree: true }).every(a => {
      const timing = a.effect.getTiming();
      const frames = a.effect.getKeyframes();
      return timing.duration === 520 && timing.delay % 54 === 0 && timing.easing === "cubic-bezier(0.16, 1, 0.3, 1)" && frames.some(frame => frame.transform?.includes("105%"));
    })), true);
    await page.waitForFunction(() => document.querySelector("#footer-mark svg").getAnimations({ subtree: true }).length === 3);
    assert.equal(await page.locator("#footer-mark svg").evaluate(el => el.getAnimations({ subtree: true }).every(a => a.currentTime === 0 && a.playState === "paused")), true);
    await page.waitForFunction(() => document.querySelector("[data-age-value]").getAnimations({ subtree: true }).length === 0);
    assert.equal(await page.locator(".age-digit-previous").count(), 0);
    assert.equal(await page.locator("[data-age-counter]").evaluate(el => el.querySelector("[data-age-value]").textContent === Number(el.dataset.ageSeconds).toLocaleString("en-US")), true);
    await page.locator("#footer-mark").evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("#footer-mark svg").dataset.playback === "playing");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    const paused = await page.locator("#footer-mark svg").evaluate(el => el.getAnimations({ subtree: true }).map(a => Number(a.currentTime)));
    await page.waitForTimeout(100);
    assert.deepEqual(await page.locator("#footer-mark svg").evaluate(el => el.getAnimations({ subtree: true }).map(a => Number(a.currentTime))), paused);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForFunction(() => document.querySelector("#footer-mark svg").dataset.playback === "finished");
    assert.equal(await page.locator("#footer-bw-b-growth").evaluate(el => getComputedStyle(el).strokeDashoffset), "0px");
    assert.equal(await page.locator("#footer-bw-w-growth").evaluate(el => getComputedStyle(el).strokeDashoffset), "0px");
    assert.equal(await page.locator(".footer-bw-motion").evaluate(el => getComputedStyle(el).fill), "rgb(255, 255, 255)");
    await page.locator("#footer-mark").screenshot({ path: `${output}/reveal-finished.png` });
    await page.locator("#hero-title").evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.locator("#footer-mark").evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
    assert.equal(await page.locator("#footer-mark svg").getAttribute("data-playback"), "finished");
  });
  await check("Live one-second ticks, rollover, background catch-up and timezone independence", async () => {
    for (const timezoneId of ["America/Denver", "Pacific/Auckland"]) {
      const clock = await fresh({ reducedMotion: "reduce", timezoneId });
      await clock.clock.install({ time: new Date("2026-09-20T12:34:50Z") });
      await clock.goto(base);
      await clock.waitForFunction(() => !!document.querySelector("[data-age-counter]").dataset.ageSeconds);
      await clock.clock.pauseAt(new Date("2026-09-20T12:34:59Z"));
      assert.equal(Number(await clock.locator("[data-age-counter]").getAttribute("data-age-seconds")), ageInSeconds(Date.parse("2026-09-20T12:34:59Z")));
      await clock.clock.runFor(1100);
      assert.equal(Number(await clock.locator("[data-age-counter]").getAttribute("data-age-seconds")), ageInSeconds(Date.parse("2026-09-20T12:35:00Z")));
      await clock.clock.runFor(1000);
      assert.equal(Number(await clock.locator("[data-age-counter]").getAttribute("data-age-seconds")), ageInSeconds(Date.parse("2026-09-20T12:35:01Z")));
      await clock.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
      await clock.clock.fastForward(600_000);
      await clock.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
      assert.equal(Number(await clock.locator("[data-age-counter]").getAttribute("data-age-seconds")), ageInSeconds(Date.parse("2026-09-20T12:45:01Z")));
      assert.equal(await clock.locator("[data-age-value]").evaluate(el => el.getAnimations({ subtree: true }).length), 0);
      await clock.context().close();
    }
  });
  await check("Five widths, short phone, 200% zoom, contrast and social targets", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [360,390,768,1024,1440]) {
      await page.setViewportSize({ width, height: width < 600 ? 600 : 1000 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.ok(await page.locator(".hero-section").evaluate(el => Math.abs(el.getBoundingClientRect().bottom - innerHeight) < 2));
      assert.equal(await page.locator(".age-eyebrow").evaluate(el => el.getBoundingClientRect().bottom < document.querySelector(".headline-crane").getBoundingClientRect().top), true);
      await page.screenshot({ path: `${output}/hero-${width}.png` });
      await page.locator(".site-footer").evaluate(el => scrollTo({ top: el.offsetTop - 240, behavior: "instant" }));
      await page.waitForTimeout(100);
      assert.equal(await page.locator(".site-footer").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(26, 25, 25)");
      assert.equal(await page.locator("html").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(26, 25, 25)");
      assert.equal(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(26, 25, 25)");
      assert.equal(await page.locator("main").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
      assert.equal(await page.locator(".site-footer h2").evaluate(el => getComputedStyle(el).color), "rgb(255, 255, 255)");
      assert.ok(await page.locator("main").evaluate(el => parseFloat(getComputedStyle(el).borderBottomLeftRadius) >= 24));
      await page.screenshot({ path: `${output}/footer-${width}.png` });
      for (const link of await page.locator(".footer-socials a").all()) {
        assert.ok(await link.getAttribute("aria-label"));
        assert.equal(await link.evaluate(el => el.getBoundingClientRect().height >= 44 && el.getBoundingClientRect().width >= 44), true);
      }
    }
    await page.evaluate(() => document.body.style.zoom = "2");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.evaluate(() => document.body.style.zoom = "");
    const first = page.locator(".footer-socials a").first();
    await first.focus();
    assert.equal(await first.evaluate(el => el.matches(":focus-visible") && getComputedStyle(el).outlineColor === "rgb(255, 255, 255)"), true);
  });
  await check("Static logo and truthful date fallback without JavaScript or animation support", async () => {
    for (const mode of ["no-js", "no-api", "reduced"]) {
      const p = await fresh({ javaScriptEnabled: mode !== "no-js", reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
      if (mode === "no-api") await p.addInitScript(() => { Element.prototype.animate = undefined; });
      await p.goto(base);
      await p.locator("#footer-mark").evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
      assert.equal(await p.locator("#footer-mark svg").evaluate(el => el.getAnimations({ subtree: true }).length), 0);
      assert.equal(await p.locator("#footer-mark animate,#footer-mark set").count(), 0);
      if (mode === "no-js") assert.equal(await p.locator("[data-age-fallback]").isVisible(), true);
      else assert.ok(Number(await p.locator("[data-age-counter]").getAttribute("data-age-seconds")) > 700_000_000);
      await p.context().close();
    }
  });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); }
