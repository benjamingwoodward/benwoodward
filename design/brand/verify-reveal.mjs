import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';
import { svg, preview } from './build-monogram-reveal.mjs';

const base = process.env.BRAND_PREVIEW_URL || 'http://127.0.0.1:4321';
const engine = process.env.BRAND_BROWSER || 'chromium';
const output = `/tmp/bw-reveal-qa-${engine}`;
await mkdir(output, { recursive: true });
assert.equal((await readFile(new URL('../../public/brand/bw-reveal.svg', import.meta.url), 'utf8')).trim(), svg);
assert.equal((await readFile(new URL('../../public/brand/reveal.html', import.meta.url), 'utf8')).trim(), preview);
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true,
  executablePath: (engine === 'webkit' ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH) || undefined });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/brand/reveal.html`);
  await page.evaluate(() => document.fonts.ready);
  const frame = page.locator('.stage svg');
  const seek = async seconds => {
    await frame.evaluate((el, t) => { el.pauseAnimations(); el.setCurrentTime(t); }, seconds);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    return frame.screenshot();
  };
  const frames = [];
  for (const t of [0, .24, .6, 1, 1.4, 1.8, 2.4, 4]) {
    const buffer = await seek(t);
    await sharp(buffer).toFile(`${output}/frame-${t}.png`);
    const raw = await sharp(buffer).removeAlpha().raw().toBuffer();
    let ink = 0;
    for (let i = 0; i < raw.length; i += 3) if (raw[i] < 60 && raw[i + 1] < 70 && raw[i + 2] < 60) ink++;
    frames.push({ t, buffer, ink });
  }
  assert.equal(frames[0].ink, 0, 'Initial frame should not flash the completed mark');
  for (let i = 1; i < frames.length; i++) assert.ok(frames[i].ink >= frames[i - 1].ink, 'Reveal regressed');
  assert.ok(frames[2].ink > 0 && frames[2].ink < frames[6].ink * .8, 'Reveal did not progress');
  assert.deepEqual(frames[6].buffer, frames[7].buffer, 'Final frame did not hold');
  // Regression: the B arm used to appear as a detached second segment. Sample
  // the whole reveal and require a single connected ink region (ignore only
  // sub-9px antialiasing specks at this 600px-wide render).
  for (let tick = 1; tick < 24; tick++) {
    const { data, info } = await sharp(await seek(tick / 10)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const ink = new Uint8Array(info.width * info.height);
    for (let i = 0; i < ink.length; i++) ink[i] = data[i * 3] < 230 ? 1 : 0;
    const components = [];
    for (let i = 0; i < ink.length; i++) {
      if (!ink[i]) continue;
      const stack = [i];
      ink[i] = 0;
      let size = 0;
      while (stack.length) {
        const current = stack.pop();
        size++;
        const x = current % info.width, y = Math.floor(current / info.width);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= info.width || ny < 0 || ny >= info.height) continue;
          const next = ny * info.width + nx;
          if (ink[next]) { ink[next] = 0; stack.push(next); }
        }
      }
      if (size > 8) components.push(size);
    }
    assert.ok(components.length <= 1, `Detached reveal segment at ${tick / 10}s: ${components}`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const rest = await seek(.3);
  await sharp(rest).toFile(`${output}/rest.png`);
  const staticPixels = await sharp(rest).raw().toBuffer();
  const finalPixels = await sharp(frames[6].buffer).raw().toBuffer();
  let changed = 0, maxDelta = 0;
  for (let i = 0; i < staticPixels.length; i++) {
    if (staticPixels[i] !== finalPixels[i]) changed++;
    maxDelta = Math.max(maxDelta, Math.abs(staticPixels[i] - finalPixels[i]));
  }
  assert.ok(staticPixels.equals(finalPixels), `Final differs from static: ${changed} channels; max delta ${maxDelta}`);
  assert.equal(await page.locator('#replay').isDisabled(), true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#replay').click();
  assert.ok(await frame.evaluate(el => el.getCurrentTime()) < .3, 'Replay did not restart');
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await noJs.newPage();
  await fallback.goto(`${base}/brand/reveal.html`);
  assert.equal(await fallback.locator('.bw-rest').isVisible(), true);
  assert.equal(await fallback.locator('#replay').isVisible(), false);
  await noJs.close();
  // Standalone SVG: deterministic timing, static reduced-motion, no preview dependency.
  await page.goto(`${base}/brand/bw-reveal.svg`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.bw-rest').isVisible(), true);
  assert.equal(await page.locator('.bw-motion').isVisible(), false);
  assert.deepEqual(errors, []);
  const thumbs = await Promise.all(frames.slice(0, 7).map(async ({ buffer }, i) => ({
    input: await sharp(buffer).resize({ width: 300 }).png().toBuffer(), left: (i % 3) * 320 + 10, top: Math.floor(i / 3) * 190 + 10,
  })));
  await sharp({ create: { width: 960, height: 570, channels: 4, background: '#fafbf9' } })
    .composite(thumbs).png().toFile(`${output}/sequence.png`);
  console.log(JSON.stringify(frames.map(({ t, ink }) => ({ seconds: t, inkPixels: ink }))));
  console.log('PASS: first paint, progressive reveal, connected stroke at 23 sampled times, exact final/rest pixel match, held final, replay, reduced motion, no-JS preview, four widths, standalone SVG, zero page errors.');
} finally { await browser.close(); }
