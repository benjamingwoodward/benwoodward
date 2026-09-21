import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';

const engine = process.env.BRAND_BROWSER || 'chromium';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const output = `/tmp/bio-intro-first-frame-${engine}`;
await mkdir(output, { recursive: true });
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ executablePath: engine === 'webkit' ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390, deviceScaleFactor: 2 });
    await page.route('**/api/hit', route => route.fulfill({ status: 204 }));
    // Expose the real server-rendered intro before its controller can initialize.
    // This makes a first-paint flash deterministic instead of relying on timing.
    await page.route(base + '/', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (tag, script) => {
        if (!script.includes('const logo = dialog?.querySelector("svg")')) return tag;
        return `<script>window.__startIntro = () => {${script}}; document.getElementById('site-intro').showModal(); document.documentElement.dataset.intro = 'playing';</script>`;
      });
      await route.fulfill({ response, body });
    });
    await page.goto(base);
    assert.equal(await page.locator('.intro-logo animate,.intro-logo set').count(), 0, 'The intro must not run or reset an independent SMIL clock');
    assert.equal(await page.locator('#intro-bw-growth > g').evaluate(el => getComputedStyle(el).opacity), '0');
    assert.equal(await page.locator('#intro-bw-b-growth').getAttribute('stroke-dashoffset'), '1');
    assert.equal(await page.locator('#intro-bw-w-growth').getAttribute('visibility'), 'hidden');
    const ink = async name => {
      const screenshot = await page.locator('.intro-logo').screenshot({ path: `${output}/${width}-${name}.png` });
      const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      let black = 0;
      for (let i = 0; i < data.length; i += info.channels) if (data[i] < 30 && data[i + 1] < 30 && data[i + 2] < 30) black++;
      return black;
    };
    assert.equal(await ink('before-controller'), 0, 'No complete/static logo may paint before the reveal starts');
    await page.evaluate(() => {
      window.__startIntro();
      document.querySelector('.intro-logo svg').getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 0; });
    });
    assert.equal(await ink('time-zero'), 0, 'The very first animation frame must stay fully masked');
    const pose = time => page.locator('.intro-logo svg').evaluate((svg, time) => svg.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = time; }), time);
    await pose(900);
    const partial = await ink('drawing');
    await pose(2400);
    const complete = await ink('complete');
    assert.ok(partial > 0 && partial < complete * .9, 'The logo must grow into the completed mark');
    assert.ok(complete > 1000);
    assert.equal(await page.locator('.intro-center').evaluate(el => getComputedStyle(el).opacity), '1');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#site-intro').evaluate(el => el.open), false);
    console.log(`PASS ${engine} ${width}px: no static first-paint flash, empty initial frame, progressive reveal, complete hold`);
    await page.close();
  }
} finally { await browser.close(); }
