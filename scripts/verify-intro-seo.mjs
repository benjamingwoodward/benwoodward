import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const engine = process.env.BRAND_BROWSER || 'chromium';
const verifyGpu = process.env.VERIFY_INTRO_GPU === '1' && engine === 'chromium';
const output = `/tmp/bw-intro-seo-${engine}`;
await mkdir(output, { recursive: true });
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true,
  ...(verifyGpu ? { args: ['--enable-unsafe-webgpu', '--use-angle=metal'] } : {}),
  executablePath: (engine === 'webkit' ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH) || undefined });
const errors = [];
const contexts = [];
async function fresh(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  contexts.push(context);
  await context.route('**/api/hit', route => route.fulfill({ status: 204 }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
async function ready(page) { await page.goto(base, { waitUntil: 'domcontentloaded' }); }
async function closed(page) {
  await page.waitForFunction(() => !document.getElementById('site-intro').open && !document.documentElement.dataset.intro, null, { timeout: 9000 });
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden');
}
try {
  const page = await fresh();
  const hits = [];
  page.on('request', request => { if (request.url().endsWith('/api/hit')) hits.push(request.postDataJSON()); });
  await ready(page);
  assert.equal(await page.locator('#site-intro').evaluate(el => el.open), true);
  assert.equal(await page.locator('.intro-copy,.intro-name,.intro-role').count(), 0);
  assert.equal(await page.locator('.intro-curtain').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 79, 31)');
  assert.equal(await page.locator('#site-intro button').count(), 0);
  assert.equal(await page.locator('.intro-waves').evaluate(el => getComputedStyle(el).opacity), '0.18');
  assert.equal(await page.locator('.intro-logo .intro-bw-motion').getAttribute('fill'), '#000000');
  assert.equal(await page.locator('.intro-rescue [data-helicopter-center-pole]').evaluate(el => getComputedStyle(el).fill), 'rgb(255, 255, 255)');
  assert.equal(await page.locator('.intro-rescue [data-helicopter-rear-leg]').evaluate(el => getComputedStyle(el).fill), 'rgb(255, 255, 255)');
  assert.deepEqual(await page.locator('.intro-rescue').evaluate(scene => Array.from(scene.querySelectorAll('path,circle,rect'))
    .filter(el => getComputedStyle(el).stroke !== 'none')
    .map(el => getComputedStyle(el).strokeWidth)
    .filter((width, index, widths) => widths.indexOf(width) === index)), ['1.6px']);
  assert.ok(await page.locator('.intro-rescue').evaluate(scene => {
    const cable = scene.querySelector('[data-lift-part="cable"]');
    const airframe = scene.querySelector('[data-lift-part="airframe"]');
    return Boolean(airframe.compareDocumentPosition(cable) & Node.DOCUMENT_POSITION_FOLLOWING)
      && cable.getBBox().y === 0 && Math.abs(cable.getBBox().width - 1.6) < .001;
  }), 'The cable must paint from exactly the winch circle center without overshooting it');
  await page.waitForTimeout(700);
  if (verifyGpu) {
    await page.waitForFunction(() => document.querySelector('.shape-waves')?.dataset.ready === 'true', null, { timeout: 1500 });
    assert.equal(await page.locator('#intro-waves').getAttribute('data-fallback'), null);
    console.log('PASS actual WebGPU shader rendering (Metal backend)');
  }
  await page.screenshot({ path: `${output}/intro-logo-desktop.png` });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${output}/intro-complete-desktop.png` });
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'leaving');
  assert.equal(await page.locator('.intro-center').evaluate(el => getComputedStyle(el).opacity), '1', 'Logo must stay opaque during the curtain exit');
  await page.waitForTimeout(500);
  const hookGap = await page.locator('.intro-rescue').evaluate(scene => {
    const tip = scene.querySelector('[data-lift-part="hook"]');
    const tipPosition = new DOMPoint(0, 4).matrixTransform(tip.getScreenCTM());
    const edge = document.querySelector('.intro-curtain').getBoundingClientRect().bottom;
    return Math.abs(tipPosition.y - edge);
  });
  assert.ok(hookGap < 1, `Helicopter hook must stay attached to the lifted panel: ${hookGap}px`);
  await page.screenshot({ path: `${output}/helicopter-lift-desktop.png` });
  await closed(page);
  await page.waitForFunction(() => !document.querySelector('#intro-waves canvas'));
  if (verifyGpu) {
    await page.waitForFunction(() => document.querySelector('.hero-waves .shape-waves')?.dataset.ready === 'true', null, { timeout: 2000 });
    assert.equal(await page.locator('.hero-waves').getAttribute('data-fallback'), null);
    console.log('PASS actual hero ShapeWaves rendering after intro cleanup');
  }
  await page.screenshot({ path: `${output}/home-desktop.png` });
  assert.equal(hits.filter(hit => !('duration' in hit)).length, 1, 'Duplicate initial tracking');
  // A legacy session marker must no longer suppress replays.
  await page.evaluate(() => sessionStorage.setItem('bw:intro:v1', 'seen'));
  for (let reload = 0; reload < 2; reload++) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#site-intro').evaluate(el => el.open), true, 'Every reload must replay the intro');
    await closed(page);
    await page.waitForFunction(() => !document.querySelector('#intro-waves canvas'));
    assert.equal(await page.locator('#intro-waves canvas').count(), 0, 'Intro texture must be disposed after replay');
  }
  console.log('PASS intro choreography, automatic exit, repeated reload replay, scroll recovery, tracking');

  for (const width of [360, 390, 768, 1024, 1440]) {
    const mobile = await fresh({ viewport: { width, height: width < 500 ? 600 : 1000 } });
    await ready(mobile);
    assert.ok(await mobile.locator('.intro-logo').evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && Math.abs(r.top + r.height / 2 - innerHeight / 2) < 1 && Math.abs(r.left + r.width / 2 - document.documentElement.clientWidth / 2) < 1;
    }), 'Logo must be centered in the viewport');
    await mobile.waitForTimeout(1600);
    if (width <= 390) await mobile.screenshot({ path: `${output}/intro-logo-${width}.png` });
    await mobile.keyboard.press('Escape');
    await closed(mobile);
    assert.equal(await mobile.evaluate(() => document.activeElement.id), 'main-content');
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await mobile.context().close();
  }
  const keyboard = await fresh();
  await ready(keyboard);
  await keyboard.keyboard.press('Tab');
  assert.ok(await keyboard.evaluate(() => document.getElementById('site-intro').contains(document.activeElement)), 'Focus escaped dialog');
  await keyboard.keyboard.press('Escape');
  await closed(keyboard);
  console.log('PASS five widths, short mobile viewport, button-free intro, Escape, focus containment/return');

  const reduced = await fresh({ reducedMotion: 'reduce' });
  await ready(reduced); await closed(reduced);
  assert.equal(await reduced.locator('#intro-waves canvas').count(), 0);
  const noGpu = await fresh();
  await noGpu.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined }));
  await ready(noGpu); await closed(noGpu);
  assert.equal(await noGpu.locator('#intro-waves canvas').count(), 0);
  const noJs = await fresh({ javaScriptEnabled: false });
  await ready(noJs);
  assert.equal(await noJs.locator('#site-intro').isVisible(), false);
  assert.equal(await noJs.locator('.hero-summary').isVisible(), true);
  const hash = await fresh();
  await hash.goto(`${base}/#work`); await closed(hash);
  await hash.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await hash.locator('#site-intro').evaluate(el => el.open), true, 'Reload must replay even with an anchor');
  await hash.keyboard.press('Escape'); await closed(hash);
  const changing = await fresh();
  await ready(changing); await changing.emulateMedia({ reducedMotion: 'reduce' }); await closed(changing);
  const storage = await fresh();
  await storage.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Synthetic storage restriction'); };
    Storage.prototype.setItem = () => { throw new Error('Synthetic storage restriction'); };
  });
  await ready(storage); await storage.keyboard.press('Escape'); await closed(storage);
  const unsupported = await fresh();
  await unsupported.addInitScript(() => { Element.prototype.animate = undefined; });
  await ready(unsupported); await closed(unsupported);
  const failed = await fresh();
  await failed.route(base + '/', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,
      tag => tag.includes('const logo = dialog?.querySelector("svg")') ? '' : tag);
    await route.fulfill({ response, body });
  });
  await ready(failed);
  assert.equal(await failed.evaluate(() => document.documentElement.dataset.intro), 'pending');
  await closed(failed);
  console.log('PASS reduced motion, no JS, anchors, live preference changes, blocked storage, missing API, failed-script watchdog');

  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.title(), 'Ben Woodward | Founder & Operator');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://benwoodward.bio/');
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  assert.ok(description.length >= 100 && description.length <= 170);
  assert.match(description, /worth \$750M/);
  assert.match(description, /Ben Woodward built and sold Pureflow and is now GM of Coverage at Redo/);
  assert.match(await page.locator('.hero-summary').textContent(), /^I built and sold Pureflow\. Today I’m GM of Coverage at Redo/);
  assert.doesNotMatch(description, /founder (and|&) GM of Coverage/i);
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  const person = graph.find(item => item['@type'] === 'Person');
  const profile = graph.find(item => item['@type'] === 'ProfilePage');
  assert.equal(profile.mainEntity['@id'], person['@id']);
  assert.equal(person.jobTitle, 'GM of Coverage');
  assert.equal(person.name, 'Ben Woodward');
  assert.equal(person.givenName, 'Ben');
  assert.equal(person.familyName, 'Woodward');
  assert.equal(graph.find(item => item['@type'] === 'WebSite').name, 'Ben Woodward');
  assert.equal(await page.locator('meta[name="author"]').getAttribute('content'), 'Ben Woodward');
  assert.equal(await page.locator('meta[property="og:site_name"]').getAttribute('content'), 'Ben Woodward');
  assert.equal(await page.locator('meta[property="profile:first_name"]').getAttribute('content'), 'Ben');
  assert.doesNotMatch(await page.locator('body').innerText(), /\bBenjamin\b/);
  assert.doesNotMatch(await page.content(), /\bBenjamin Woodward\b/);
  assert.equal(person.image, undefined, 'Do not misrepresent the favicon as a portrait');
  assert.equal(person.sameAs.length, 4);
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /^index, follow/);
  assert.equal(await page.locator('img:not([alt]),img:not([width]),img:not([height])').count(), 0);
  const nonBlack = await page.evaluate(() => Array.from(document.querySelectorAll('h1,h2,h3,p,a,button,summary,figcaption,footer span'))
    .filter(el => el.getBoundingClientRect().width && el.getBoundingClientRect().height && getComputedStyle(el).color !== (el.closest('.site-footer') && !el.closest('.primary') ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'))
    .map(el => ({ tag: el.tagName, text: el.textContent.slice(0, 50), color: getComputedStyle(el).color })));
  assert.deepEqual(nonBlack, [], 'Text is black on white/orange surfaces and white in the dark footer');
  const raw = await (await page.request.get(base)).text();
  assert.ok(raw.includes('business line worth $750M') && /merchant onboarding/i.test(raw));
  const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
  assert.ok(sitemap.includes('https://benwoodward.bio/') && !/visitors|brand\//.test(sitemap));
  assert.match(await (await page.request.get(`${base}/robots.txt`)).text(), /Sitemap: https:\/\/benwoodward.bio\/sitemap.xml/);
  const privateResponse = await page.request.get(`${base}/visitors`);
  assert.match(privateResponse.headers()['x-robots-tag'], /noindex/);
  const previewResponse = await page.request.get(`${base}/brand/reveal.html`);
  assert.match(await previewResponse.text(), /name="robots" content="noindex,nofollow"/);
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(config.headers[0].headers[0].value, 'noindex, nofollow');
  const image = await sharp('public/og-image.png').metadata();
  assert.equal(image.width, 1200); assert.equal(image.height, 630);
  const icon = await sharp('public/favicon.png').ensureAlpha().raw().toBuffer();
  assert.equal(icon[3], 0, 'Favicon background must be transparent');
  for (let i = 0; i < icon.length; i += 4) {
    if (icon[i + 3] === 255) assert.ok(icon[i] === 255 && icon[i + 1] === 79 && icon[i + 2] === 31, 'Favicon should be orange only');
  }
  for (const asset of ['/favicon.svg', '/favicon.png', '/apple-touch-icon.png', '/og-image.png']) {
    assert.equal((await page.request.get(base + asset)).status(), 200);
  }
  assert.deepEqual(errors, []);
  console.log('PASS SSR content, metadata/schema, image dimensions/alt, sitemap/robots, private noindex, branding assets, no page exceptions');
} finally {
  await Promise.all(contexts.map(context => context.close().catch(() => {})));
  await browser.close();
}
