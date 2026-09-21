import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const engine = process.env.BRAND_BROWSER || "chromium";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const output = `/tmp/bio-pureflow-${engine}`;
await mkdir(output, { recursive: true });
const browser = await (engine === "webkit" ? webkit : chromium).launch({ executablePath: engine === "webkit" ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH });
const errors = [];
async function fresh(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  await context.route("**/api/hit", route => route.fulfill({ status: 204 }));
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  return page;
}
const reveal = page => page.locator(".pureflow-preview").evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
try {
  const page = await fresh();
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto(base);
  await page.locator("#site-intro").waitFor({ state: "hidden", timeout: 10000 });
  assert.equal(requests.some(url => /pureflow-.*\.(webm|mov)/.test(url)), false, "Do not load media before it is visible");
  assert.equal(await page.locator("#video-dialog,[data-video-open],.preview-action,.pureflow-preview a,.pureflow-preview button").count(), 0);
  await page.locator(".pureflow-preview video").evaluate(video => { video.playbackRate = .2; });
  await reveal(page);
  await page.waitForFunction(() => document.querySelector(".pureflow-preview").dataset.playback === "playing");
  const video = page.locator(".pureflow-preview video");
  assert.equal(await video.evaluate(el => el.muted && el.playsInline && !el.controls && !el.loop), true);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.waitForFunction(() => document.querySelector(".pureflow-preview video").paused);
  const pausedTime = await video.evaluate(el => el.currentTime);
  await page.waitForTimeout(150);
  assert.equal(await video.evaluate(el => el.currentTime), pausedTime);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); scrollTo({ top: 0, behavior: "instant" }); });
  await page.waitForFunction(() => document.querySelector(".pureflow-preview video").paused);
  await reveal(page);
  await video.evaluate(el => { el.playbackRate = 4; });
  await page.waitForFunction(() => document.querySelector(".pureflow-preview").dataset.playback === "finished");
  const finalTime = await video.evaluate(el => el.currentTime);
  assert.equal(await video.evaluate(el => el instanceof HTMLVideoElement && el.ended && el.paused), true);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await reveal(page);
  await page.waitForTimeout(150);
  assert.equal(await video.evaluate(el => el.currentTime), finalTime, "No replay or exit animation when scrolling back");
  assert.equal(requests.some(url => /pureflow-exit/.test(url)), false);
  console.log(`PASS ${engine}: lazy inline entrance, background/offscreen pause, final-frame hold, no popup or exit`);

  // Both alpha formats must leave the page visible around the laptop.
  const alpha = await video.evaluate(el => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1080;
    const context = canvas.getContext("2d"); context.drawImage(el, 0, 0);
    return context.getImageData(0, 0, 1, 1).data[3];
  });
  assert.equal(alpha, 0, "The video's transparent corner must not render a black/opaque box");
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 650 : 1000 });
    await reveal(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator(".pureflow-preview").evaluate(el => getComputedStyle(el).borderTopWidth === "0px" && getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)"), true);
    await page.locator(".story-software").screenshot({ path: `${output}/inline-${width}.png` });
  }
  console.log(`PASS ${engine}: transparent media, frameless layout and five responsive widths`);

  for (const mode of ["reduced", "no-js", "blocked-autoplay", "failed-media"]) {
    const fallback = await fresh({ javaScriptEnabled: mode !== "no-js", reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    if (mode === "blocked-autoplay") await fallback.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Blocked by browser policy", "NotAllowedError")); });
    if (mode === "failed-media") await fallback.route(/pureflow-.*\.(webm|mov)/, route => route.abort());
    await fallback.goto(base);
    await fallback.locator("#site-intro").waitFor({ state: "hidden", timeout: 10000 });
    await reveal(fallback);
    await fallback.waitForFunction(() => { const image = document.querySelector(".pureflow-preview img"); return image.complete && image.naturalWidth > 0; });
    await fallback.waitForTimeout(300);
    assert.equal(await fallback.locator(".pureflow-preview img").evaluate(el => getComputedStyle(el).visibility), "visible");
    assert.equal(await fallback.locator(".pureflow-preview video").evaluate(el => el.paused), true, `${mode}: video must not keep playing`);
    await fallback.locator(".pureflow-preview").screenshot({ path: `${output}/fallback-${mode}.png` });
    await fallback.context().close();
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${engine}: reduced-motion, no-JS, autoplay-blocked and media-error poster fallbacks`);
} finally { await browser.close(); }
