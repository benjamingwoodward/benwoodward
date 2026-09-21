const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 810 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  // Match the frameless inline 4:3 crop against the white page, independent of
  // application playback state. Only transparent padding is cropped.
  await page.setContent(`<style>body{margin:0;background:#fff}video{display:block;width:1080px;height:810px;object-fit:cover}</style><video muted playsinline preload="auto" src="${base}/pureflow-enter.webm"></video>`);
  await page.waitForFunction(() => document.querySelector("video").readyState >= 2);
  await page.evaluate(() => { const video = document.querySelector("video"); video.currentTime = Math.max(0, video.duration - .04); });
  await page.waitForFunction(() => !document.querySelector("video").seeking);
  await page.locator("video").screenshot({ path: "public/pureflow-poster.jpg", type: "jpeg", quality: 92 });
  console.log("Rendered Pureflow poster.");
} finally { await browser.close(); }
await import('./render-social-card.mjs');
