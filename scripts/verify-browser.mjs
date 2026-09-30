import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

// All data and service endpoints are local synthetic fixtures. No production store is used.
const output = process.env.QA_OUTPUT || "/tmp/benwoodward-qa";
await mkdir(output, { recursive: true });
const results = [];
const children = [];
let browser;
let mode = "populated";
const writes = [];
const now = Date.now();
const visits = [
  { ts: now - 60000, ip: "203.0.113.1", place: "Denver, Colorado", client: "Chrome on macOS", path: "/", referrer: null, lat: 39.7, lng: -105, duration: 48000 },
  { ts: now - 4 * 3600000, ip: "203.0.113.2", place: "Helsinki, Finland", client: "Safari on iOS", path: "/", referrer: "https://example.com/", lat: 60.17, lng: 24.94, duration: 90000 },
  { ts: now - 3 * 86400000, ip: "203.0.113.3", place: "London, UK", client: "Firefox", path: "/", referrer: null, lat: 51.5, lng: -0.12, duration: 120000 },
];
const fixture = createServer(async (req, res) => {
  if (mode === "error") { res.writeHead(503); res.end("Synthetic unavailable store"); return; }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const commands = JSON.parse(Buffer.concat(chunks).toString());
  const data = commands.map(command => {
    if (command[0] === "LRANGE") return { result: mode === "empty" ? [] : visits.map(visit => JSON.stringify(visit)) };
    writes.push(command);
    return { result: "OK" };
  });
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
});
await new Promise(resolve => fixture.listen(0, "127.0.0.1", resolve));
const storeUrl = `http://127.0.0.1:${fixture.address().port}`;

async function startSite(port, variables = {}) {
  const env = { ...process.env, VITE_CACHE_DIR: `node_modules/.vite-qa-${port}`, ASTRO_TELEMETRY_DISABLED: "1", VISITS_KEY: "", KV_REST_API_URL: "", KV_REST_API_TOKEN: "", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", VISITS_WEBHOOK_URL: "", ...variables };
  const child = spawn(process.execPath, ["node_modules/astro/bin/astro.mjs", "dev", "--host", "127.0.0.1", "--port", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk; });
  child.stderr.on("data", chunk => { logs += chunk; });
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Preview exited: ${logs}`);
    try { const response = await fetch(url); if (response.ok) return url; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Preview did not start: ${logs}`);
}
async function check(name, run) { await run(); results.push(name); console.log(`PASS ${name}`); }
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${page.viewportSize().width}px`);
}
async function screenshot(page, name, fullPage = false) {
  await page.screenshot({ path: `${output}/${name}.png`, fullPage, animations: "disabled" });
}
try {
  const base = await startSite(4331);
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requests.push(request.url()));
  const initialHit = page.waitForResponse(response => response.url().endsWith("/api/hit"));
  await page.goto(base, { waitUntil: "load" });
  await initialHit;
  await page.locator('#site-intro').waitFor({ state: 'hidden', timeout: 9000 });
  await check("Local fonts, five work cards, nine age chapters, metadata and one visit ping", async () => {
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.fonts.check('16px "TWK Lausanne"')), true);
    assert.equal(await page.locator(".work-card").count(), 5);
    assert.equal(await page.locator(".story-card").count(), 9);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /benwoodward.bio/);
    assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /index, follow/);
    assert.equal(requests.filter(url => url.endsWith("/api/hit")).length, 1);
    assert.equal(requests.some(url => /fonts.googleapis|fonts.gstatic|cobra|snake|VisitorsGlobe|react-globe|three\.js/i.test(url)), false);
    assert.equal(await page.locator(".vehicle-scene").count(), 1);
    assert.equal((await page.locator("h1").innerText()).trim(), 'Ben Woodward');
    assert.equal(await page.locator(".hero-work-link").count(), 0, "Hero should not repeat the work section label");
    assert.match(await page.locator(".hero-summary").textContent(), /business line worth \$750M/);
    assert.match(await page.locator('meta[name="description"]').getAttribute("content"), /GM of Coverage/);
  });
  await check("Responsive public layout: 360, 390, 768, 1024, 1440 and short phone", async () => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
      for (const photo of await page.locator(".story-photo img").all()) {
        await photo.scrollIntoViewIfNeeded();
        await photo.evaluate(image => image.decode());
      }
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await noOverflow(page);
      assert.ok(await page.locator(".hero-section").evaluate(el => Math.abs(el.getBoundingClientRect().bottom - innerHeight) < 2), "Ground must meet the initial viewport edge");
      assert.ok(await page.locator(".headline-crane").evaluate(el => el.getBoundingClientRect().top > document.querySelector(".site-header").getBoundingClientRect().bottom), "Crane must clear navigation");
      await screenshot(page, `home-${width}`, true);
      if (width === 1440) await screenshot(page, "hero-desktop");
    }
    await page.setViewportSize({ width: 390, height: 600 });
    await noOverflow(page);
    await screenshot(page, "hero-short-phone");
    assert.ok(await page.locator(".hero-section").evaluate(el => Math.abs(el.getBoundingClientRect().bottom - innerHeight) < 2));
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    await noOverflow(page);
    await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  });
  await check("Keyboard navigation and icon-only social header", async () => {
    await page.goto(base);
    await page.locator('#site-intro').waitFor({ state: 'hidden', timeout: 9000 });
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(".skip-link").evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator(".desktop-nav,.mobile-menu").count(), 0);
    assert.deepEqual(await page.locator(".header-socials a").evaluateAll(links => links.map(link => [link.getAttribute("aria-label"), link.getAttribute("href")])), [
      ["LinkedIn", "https://www.linkedin.com/in/woodward-ben/"], ["GitHub", "https://github.com/benjaminwoodward"], ["X", "https://x.com/benjaminbuilt"],
    ]);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(".wordmark").evaluate(el => el === document.activeElement), true);
    for (const link of await page.locator(".header-socials a").all()) {
      await page.keyboard.press("Tab");
      assert.equal(await link.evaluate(el => el === document.activeElement && el.matches(":focus-visible")), true);
      assert.equal(await link.evaluate(el => el.getBoundingClientRect().width >= 44 && el.getBoundingClientRect().height >= 44 && el.querySelector("svg")?.getAttribute("aria-hidden") === "true"), true);
    }
  });
  await check("Gallery navigation, focus containment, Escape and focus return", async () => {
    const opener = page.locator('[data-gallery-open="origin"]').first();
    await opener.click();
    assert.equal(await page.locator("#photo-gallery").evaluate(el => el.open), true);
    assert.equal(await page.locator("[data-gallery-count]").textContent(), "1 / 3");
    await page.locator("[data-gallery-next]").click();
    assert.equal(await page.locator("[data-gallery-count]").textContent(), "2 / 3");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await page.locator("[data-gallery-count]").textContent(), "1 / 3");
    for (let i = 0; i < 5; i++) { await page.keyboard.press("Tab"); assert.equal(await page.evaluate(() => document.activeElement.closest("#photo-gallery") !== null), true); }
    await screenshot(page, "gallery-mobile");
    await page.keyboard.press("Escape");
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
    const second = page.locator('[data-gallery-open="origin"]').nth(1);
    await second.click();
    assert.equal(await page.locator("[data-gallery-count]").textContent(), "2 / 3", "Each collage photo opens its own full-size image");
    await page.keyboard.press("Escape");
    assert.equal(await second.evaluate(el => el === document.activeElement), true);
  });
  await check("Pureflow plays inline on visibility and holds its final frame", async () => {
    assert.equal(await page.locator("#video-dialog,[data-video-open],.preview-action").count(), 0);
    // Gallery focus return schedules sticky-header clearance on the next frame.
    // Let it settle before simulating the user's next scroll, or it scrolls back.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))));
    await page.locator(".pureflow-preview").evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector(".pureflow-preview").dataset.playback === "finished", null, { timeout: 10000 }).catch(async error => {
      console.error("Pureflow playback diagnostics", await page.locator(".pureflow-preview").evaluate(el => {
        const video = el.querySelector("video");
        return { bounds: el.getBoundingClientRect().toJSON(), state: el.dataset.playback, ready: video.readyState, paused: video.paused, time: video.currentTime, source: video.currentSrc, error: video.error?.code, root: { ...document.documentElement.dataset }, hidden: document.hidden };
      }));
      throw error;
    });
    assert.equal(await page.locator(".pureflow-preview video").evaluate(el => el instanceof HTMLVideoElement && el.ended && el.paused && !el.loop && !el.controls && el.muted && el.playsInline), true);
    assert.equal(await page.locator(".pureflow-preview a,.pureflow-preview button").count(), 0);
    assert.equal(requests.some(url => /pureflow-exit/.test(url)), false);
  });
  await check("Six vehicle phases, programmatic pause, offscreen pausing and reduced motion", async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator(".hero-ground").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".vehicle-scene").getAnimations({ subtree: true }).some(a => a.playState === "running"));
    await page.evaluate(() => { document.documentElement.dataset.motion = "paused"; window.dispatchEvent(new Event("site-motion-change")); });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), "paused");
    assert.equal(await page.evaluate(() => [...document.querySelectorAll(".vehicle-scene,.work-machine,.headline-crane")].flatMap(el => el.getAnimations({ subtree: true })).some(a => a.playState === "running")), false);
    const phases = ["bulldozer", "forklift", "helicopter", "bulldozer", "forklift", "helicopter"];
    for (let i = 0; i < 6; i++) {
      const visible = await page.evaluate(index => {
        const scene = document.querySelector(".vehicle-scene");
        scene.getAnimations({ subtree: true }).forEach(a => { a.currentTime = index * 12000 + 6000; });
        return ["helicopter", "bulldozer", "forklift"].filter(name => getComputedStyle(scene.querySelector(`[data-cycle-part="${name}"]`)).visibility === "visible");
      }, i);
      assert.deepEqual(visible, [phases[i]]);
      if (phases[i] !== "helicopter") {
        const gap = await page.locator(".vehicle-scene").evaluate(scene => {
          const matrix = scene.getScreenCTM();
          const tireBottom = new DOMPoint(0, 234.8).matrixTransform(matrix).y;
          return document.querySelector(".hero-ground").getBoundingClientRect().bottom - tireBottom;
        });
        assert.ok(gap >= 0 && gap < 2, `Wheels must meet the ground: ${gap}px gap`);
      }
      await page.locator(".hero-illustration").screenshot({ path: `${output}/vehicle-phase-${i}.png` });
    }
    await page.evaluate(() => { document.documentElement.dataset.motion = "playing"; window.dispatchEvent(new Event("site-motion-change")); });
    // Exercise the visibility event explicitly: headless tabs do not reliably background.
    assert.equal(await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
      return document.querySelector(".vehicle-scene").getAnimations({ subtree: true }).every(a => a.playState === "paused");
    }), true);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    const beforeResize = await page.locator(".vehicle-scene").evaluate(el => Number(el.getAnimations({ subtree: true })[0].currentTime));
    await page.setViewportSize({ width: 1024, height: 1000 });
    const afterResize = await page.locator(".vehicle-scene").evaluate(el => Number(el.getAnimations({ subtree: true })[0].currentTime));
    assert.ok(afterResize >= beforeResize && afterResize - beforeResize < 1000, "Resizing must preserve the shared clock");
    for (const machine of await page.locator(".work-machine").all()) {
      await machine.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForFunction(id => document.querySelector(`[data-illustration="${id}"]`).getAnimations({ subtree: true }).length > 0, await machine.getAttribute("data-illustration"));
      assert.equal(await machine.evaluate(el => el.getAnimations({ subtree: true }).every(a => a.effect.getTiming().iterations === 1 && a.effect.getTiming().duration === 4000)), true, "Purposeful work scenes play one four-second action");
    }
    await page.locator("#story").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".vehicle-scene").getAnimations({ subtree: true }).every(a => a.playState !== "running"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.getAnimations().length === 0);
    await screenshot(page, "reduced-motion");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });
  await check("Headline crane, enlarged vehicles and line-only ground", async () => {
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector(".headline-crane").getAnimations({ subtree: true }).length === 6);
    for (const [width, zoom] of [[390, 1], [1440, 1], [1440, 2]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(zoom => document.documentElement.style.zoom = String(zoom), zoom);
      await page.waitForTimeout(100);
      for (const [letter, time] of [["from", 0], ["to", 6100]]) {
        const error = await page.locator(".headline-crane").evaluate((scene, { letter, time }) => {
          scene.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = time; });
          const word = scene.closest(".headline-build");
          const target = word.querySelector(`[data-crane-letter="${letter}"]`);
          const style = getComputedStyle(target);
          const canvas = document.createElement("canvas").getContext("2d");
          canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const glyph = canvas.measureText(target.textContent);
          const baseline = word.querySelector(".headline-build-baseline").getBoundingClientRect().bottom;
          const box = scene.querySelector(letter === "to" ? ".headline-crane-payload-resting .headline-crane-box" : ".headline-crane-payload-attached .headline-crane-box").getBoundingClientRect();
          let supportX = glyph.width * .5;
          if (letter === "to") {
            // Independently sample the actual font's topmost ink, not the
            // implementation's anchor constant or the full advance width.
            canvas.canvas.width = canvas.canvas.height = 1000;
            canvas.font = `${style.fontWeight} 1000px ${style.fontFamily}`;
            canvas.fillText(target.textContent, 0, 900);
            const pixels = canvas.getImageData(0, 0, 1000, 900).data;
            crown: for (let y = 0; y < 900; y++) {
              let left = -1, right = -1;
              for (let x = 0; x < 1000; x++) if (pixels[(y * 1000 + x) * 4 + 3] > 127) {
                if (left < 0) left = x;
                right = x;
              }
              if (left >= 0) { supportX = (left + right) / 2 / 1000 * parseFloat(style.fontSize); break crown; }
            }
          }
          const zoom = Number(getComputedStyle(document.documentElement).zoom);
          return { y: box.bottom - (baseline - glyph.actualBoundingBoxAscent * zoom), x: (box.left + box.right) / 2 - (target.getBoundingClientRect().left + supportX * zoom) };
        }, { letter, time });
        assert.ok(Math.abs(error.x) < 1 && Math.abs(error.y) < 1, `Box must rest on ${letter} letter at ${width}px / ${zoom}x: ${JSON.stringify(error)}`);
        await page.locator("#hero-title").screenshot({ path: `${output}/headline-${width}-${letter}${zoom === 1 ? "" : "-2x"}.png` });
      }
    }
    await page.evaluate(() => document.documentElement.style.zoom = "1");
    await page.waitForTimeout(100);
    assert.equal(await page.locator("h1 .headline-crane").count(), 1);
    assert.equal((await page.locator(".wordmark").innerText()).trim(), "", "Header wordmark should be logo-only");
    assert.equal(await page.locator(".hero-waves").count(), 1);
    assert.equal(await page.locator(".headline-crane").evaluate(el => el.getAnimations({ subtree: true }).length), 6);
    assert.equal(await page.locator(".headline-crane-payload-attached").evaluate(el => el.parentElement.classList.contains("crane-load")), true, "The moving box must remain physically nested under the hook");
    const detached = await page.locator(".headline-crane").evaluate(scene => {
      scene.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 6500; });
      const hook = scene.querySelector(".crane-hook").getBoundingClientRect();
      const box = scene.querySelector(".headline-crane-payload-resting .headline-crane-box").getBoundingClientRect();
      return {
        separation: Math.hypot((hook.left + hook.right - box.left - box.right) / 2, (hook.top + hook.bottom - box.top - box.bottom) / 2),
        swing: getComputedStyle(scene.querySelector(".crane-swing")).transform,
      };
    });
    assert.ok(detached.separation > 20, "The empty hook must travel away after dropping the box");
    assert.notEqual(detached.swing, "none", "The empty hook must swing during its return trip");
    const swingDirection = async time => page.locator(".headline-crane").evaluate((scene, currentTime) => {
      scene.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = currentTime; });
      return new DOMMatrixReadOnly(getComputedStyle(scene.querySelector(".crane-swing")).transform).b;
    }, time);
    assert.ok(await swingDirection(5900) < 0, "Hook must lag right while the trolley accelerates left");
    assert.ok(await swingDirection(7000) > 0, "Hook must overshoot left when the leftward trip stops");
    assert.ok(await swingDirection(8100) > 0, "Hook must lag left when the trolley accelerates right");
    assert.ok(await swingDirection(9000) < 0, "Hook must overshoot right when the return trip stops");
    assert.ok(await swingDirection(2400) > 0, "Carried box must lag left while accelerating right");
    assert.ok(await swingDirection(3480) < 0, "Carried box must overshoot right at drop-off");
    assert.ok(await swingDirection(10800) < 0, "Carried box must lag right on its return trip");
    assert.ok(await swingDirection(11400) > 0, "Carried box must overshoot left before landing");
    assert.equal(await page.locator("[data-motion-toggle]").count(), 0);
    assert.equal(await page.locator(".eyebrow,.hero-meta,.drawing-label").count(), 0);
    assert.ok(await page.locator(".vehicle-stage").evaluate(el => el.getBoundingClientRect().height <= 155));
    assert.equal(await page.locator(".vehicle-scene").evaluate(el => el.viewBox.baseVal.height), 180);
    assert.ok(await page.locator(".rock-transition path").count() <= 16, "Cliff should stay restrained line art");
    assert.ok(await page.locator(".rock-transition path:not(#rock-face-shape)").evaluateAll(paths => paths.every(path => getComputedStyle(path).fill === "none")));
    assert.equal(await page.locator(".rock-fill").evaluate(el => getComputedStyle(el).fill), "rgb(255, 255, 255)");
    assert.equal(await page.locator(".rock-fill").evaluate(el => getComputedStyle(el).fillOpacity), "1");
    assert.ok(await page.locator(".rock-transition").evaluate(el => el.getBoundingClientRect().height <= 132), "Desktop cliff should stay compact");
    assert.ok(await page.locator(".rock-fill").evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.left <= .5 && rect.right >= innerWidth - .5;
    }), "The desktop rock silhouette must span the full viewport width");
    assert.equal(await page.locator(".site-header").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
    assert.equal(await page.locator(".site-header").evaluate(el => getComputedStyle(el).backdropFilter), "none");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const heroCliff = await page.locator(".rock-transition").evaluate(cliff => {
      const rock = cliff.getBoundingClientRect();
      const hero = document.querySelector(".hero-section").getBoundingClientRect();
      const work = document.querySelector("#work").getBoundingClientRect();
      return {
        boundaryError: rock.top - hero.bottom,
        overlap: work.top < rock.bottom && work.bottom > rock.top,
        position: getComputedStyle(cliff).position,
        background: getComputedStyle(cliff).backgroundColor,
        zIndex: Number(getComputedStyle(cliff).zIndex),
        pointerEvents: getComputedStyle(cliff).pointerEvents,
      };
    });
    assert.ok(Math.abs(heroCliff.boundaryError) < 1, `Cliff must begin directly below the hero: ${JSON.stringify(heroCliff)}`);
    assert.equal(heroCliff.position, "sticky");
    assert.equal(heroCliff.background, "rgba(0, 0, 0, 0)", "The area below the rock silhouette must remain transparent");
    assert.equal(heroCliff.overlap, true, "The opening of the following section should pass beneath the cliff");
    assert.ok(heroCliff.zIndex > 1);
    assert.equal(heroCliff.pointerEvents, "none");
    await page.locator("#story").scrollIntoViewIfNeeded();
    assert.ok(await page.locator(".rock-transition").evaluate(cliff => {
      const rock = cliff.getBoundingClientRect();
      const header = document.querySelector(".site-header").getBoundingClientRect();
      return Math.abs(rock.top - header.bottom) < 1;
    }), "Cliff must stick directly beneath the header while content scrolls below it");
  });
  await check("Readable static homepage with JavaScript disabled", async () => {
    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(base);
    assert.equal((await staticPage.locator("h1").innerText()).trim(), 'Ben Woodward');
    assert.equal(await staticPage.locator(".vehicle-scene").isVisible(), true);
    assert.equal(await staticPage.locator(".work-card").count(), 5);
    assert.equal(await staticPage.locator("[data-motion-toggle]").isVisible(), false);
    await noOverflow(staticPage);
    await staticContext.close();
  });
  await check("Missing animation API leaves complete static artwork", async () => {
    const fallbackContext = await browser.newContext();
    await fallbackContext.addInitScript(() => { Element.prototype.animate = undefined; });
    const fallbackPage = await fallbackContext.newPage();
    await fallbackPage.goto(base, { waitUntil: "networkidle" });
    assert.equal(await fallbackPage.locator(".vehicle-scene").isVisible(), true);
    assert.equal(await fallbackPage.locator("[data-motion-toggle]").isVisible(), false);
    assert.equal(await fallbackPage.locator('[data-cycle-part="bulldozer"]').evaluate(el => getComputedStyle(el).visibility), "visible");
    assert.equal(await fallbackPage.locator('[data-cycle-part="helicopter"]').evaluate(el => getComputedStyle(el).visibility), "hidden");
    await fallbackContext.close();
  });
  await check("Unconfigured private page returns 404", async () => {
    assert.equal((await page.request.get(`${base}/visitors`)).status(), 404);
  });
  const protectedBase = await startSite(4332, { VISITS_KEY: "local-browser-test-only", KV_REST_API_URL: storeUrl, KV_REST_API_TOKEN: "synthetic-test-token" });
  await check("Private login rejects wrong password and accepts correct password", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(`${protectedBase}/visitors`);
    assert.match(response.headers()["x-robots-tag"], /noindex/);
    assert.match(response.headers()["cache-control"], /no-store/);
    await page.locator("#key").fill("wrong-password");
    await page.locator('button[type="submit"]').click();
    assert.equal(await page.locator("#key").getAttribute("aria-invalid"), "true");
    await noOverflow(page);
    await screenshot(page, "visitors-login-mobile");
    await page.locator("#key").fill("local-browser-test-only");
    await page.locator('button[type="submit"]').click();
    await page.locator(".live-view").waitFor();
    const cookie = (await context.cookies()).find(cookie => cookie.name === "visits");
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "Strict");
    assert.equal(new URL(page.url()).search, "");
  });
  await check("Dashboard ranges, durations and responsive layouts with synthetic visits", async () => {
    await page.locator('.ranges button').filter({ hasText: "All" }).click();
    assert.equal(await page.locator(".feed li").count(), 3);
    assert.match(await page.locator(".feed").textContent(), /1m 30s/);
    await page.locator('.ranges button').filter({ hasText: /^1h/ }).click();
    assert.equal(await page.locator(".feed li").count(), 1);
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await noOverflow(page);
      await screenshot(page, `visitors-${width}`, width < 900);
    }
    await page.setViewportSize({ width: 390, height: 600 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    await noOverflow(page);
    await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  });
  await check("Private empty and failed-store states remain visible", async () => {
    mode = "empty";
    await page.reload();
    assert.match(await page.locator(".notice").textContent(), /Nobody has been here/i);
    await screenshot(page, "visitors-empty");
    mode = "error";
    await page.reload();
    assert.match(await page.locator(".notice").textContent(), /503|couldn|failed|read/i);
    await screenshot(page, "visitors-error");
    mode = "populated";
  });
  await check("Initial hit and duration reports write separate records", async () => {
    const first = await page.request.post(`${protectedBase}/api/hit`, { data: { id: "test-visit-1234", path: "/", referrer: "" } });
    const second = await page.request.post(`${protectedBase}/api/hit`, { data: { id: "test-visit-1234", duration: 48000 } });
    assert.equal(first.status(), 204); assert.equal(second.status(), 204);
    assert.equal(writes.filter(command => command[0] === "LPUSH").length, 1);
    assert.equal(writes.filter(command => command[0] === "SET").length, 1);
  });
  const noStore = await startSite(4333, { VISITS_KEY: "local-browser-test-only" });
  await check("Missing-store state and loading fallback", async () => {
    await page.goto(`${noStore}/visitors`);
    assert.match(await page.locator(".notice").textContent(), /No store/);
    const staticContext = await browser.newContext({ javaScriptEnabled: false });
    await staticContext.addCookies(await context.cookies());
    const loadingPage = await staticContext.newPage();
    await loadingPage.goto(`${protectedBase}/visitors`);
    assert.match(await loadingPage.locator("body").textContent(), /Loading the globe/);
    await staticContext.close();
  });
  await check("No browser runtime errors", async () => { assert.deepEqual(errors, []); });
  await writeFile(`${output}/results.json`, JSON.stringify({ passed: results, screenshots: output }, null, 2));
  console.log(`\n${results.length} checks passed. Screenshots: ${output}`);
} finally {
  await browser?.close();
  for (const child of children) child.kill("SIGTERM");
  fixture.closeAllConnections();
  await new Promise(resolve => fixture.close(resolve));
}
