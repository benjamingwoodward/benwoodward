import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const engine = process.env.BRAND_BROWSER || 'chromium';
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ executablePath: engine === 'webkit' ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH });
try {
  for (const [width, height] of [[360, 600], [390, 844], [428, 926], [768, 1000], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: width < 500 ? 3 : 2, isMobile: width < 500, hasTouch: width < 500 });
    await context.route('**/api/hit', route => route.fulfill({ status: 204 }));
    const page = await context.newPage();
    await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:4321/');
    await page.waitForFunction(() => document.documentElement.dataset.intro === 'leaving');
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    assert.equal(await page.locator('#site-intro').evaluate(dialog => dialog.open), true, 'A redundant mobile resize must not dismiss the intro');
    const result = await page.evaluate(() => {
      const intro = document.querySelector('#site-intro');
      const curtain = intro.querySelector('.intro-curtain');
      const tracks = intro.getAnimations({ subtree: true }).filter(animation => animation.effect.getTiming().duration === 2800);
      tracks.forEach(animation => animation.pause());
      const rotor = intro.querySelector('[data-lift-part="rotor"] rect').getAnimations()[0];
      rotor.pause();
      const part = name => intro.querySelector(`[data-lift-part="${name}"]`);
      const angle = name => {
        const matrix = new DOMMatrix(getComputedStyle(part(name)).transform);
        return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
      };
      let hookGap = 0;
      let bankError = 0;
      let cableHookGap = 0;
      let winchGap = 0;
      let strokeError = 0;
      let curlBelowMin = Infinity;
      let curlBelowMax = 0;
      for (let time = 0; time < 2800; time += 31) {
        tracks.forEach(animation => { animation.currentTime = time; });
        rotor.currentTime = time % 160;
        const tip = new DOMPoint(0, 4).matrixTransform(part('hook').getScreenCTM());
        const edge = intro.querySelector('.intro-curtain').getBoundingClientRect();
        hookGap = Math.max(hookGap, Math.abs(tip.y - edge.bottom), Math.abs(tip.x - intro.clientWidth * .65));
        const curlBelow = part('hook-tip').getBoundingClientRect().bottom - edge.bottom;
        curlBelowMin = Math.min(curlBelowMin, curlBelow);
        curlBelowMax = Math.max(curlBelowMax, curlBelow);
        const cable = part('cable');
        const matrix = cable.getScreenCTM();
        const bounds = cable.getBBox();
        const start = new DOMPoint(0, bounds.y).matrixTransform(matrix);
        const end = new DOMPoint(0, bounds.y + bounds.height).matrixTransform(matrix);
        const winch = new DOMPoint(0, 8).matrixTransform(part('winch').getScreenCTM());
        const hook = new DOMPoint(0, 0).matrixTransform(part('hook').getScreenCTM());
        winchGap = Math.max(winchGap, Math.hypot(start.x - winch.x, start.y - winch.y));
        cableHookGap = Math.max(cableHookGap, Math.hypot(end.x - hook.x, end.y - hook.y));
        // Equal CSS widths alone miss strokes thinned by scaleX/scaleY.
        const reference = part('winch').getScreenCTM();
        const expected = 1.6 * Math.hypot(reference.a, reference.b);
        strokeError = Math.max(strokeError, Math.abs(bounds.width * Math.hypot(matrix.a, matrix.b) - expected));
        for (const element of intro.querySelectorAll('.intro-rescue path,.intro-rescue circle,.intro-rescue rect')) {
          const style = getComputedStyle(element);
          if (style.stroke === 'none') continue;
          const m = element.getScreenCTM();
          const weight = parseFloat(style.strokeWidth);
          strokeError = Math.max(strokeError, Math.abs(weight * Math.hypot(m.a, m.b) - expected), Math.abs(weight * Math.hypot(m.c, m.d) - expected));
        }
        if (time > 1300) bankError = Math.max(bankError, Math.abs(angle('airframe') - angle('rig') * .55));
      }
      // Simulate mobile compositor frames running ahead of an SVG repaint:
      // freeze all relative helicopter motion, then advance only the panel.
      // The hook must remain attached without relying on matching paint clocks.
      tracks.forEach(animation => { animation.currentTime = 900; });
      const panelTrack = tracks.find(animation => animation.effect.target === curtain);
      let delayedPaintGap = 0;
      for (const time of [0, 450, 900, 1540, 2150, 2650]) {
        panelTrack.currentTime = time;
        const tip = new DOMPoint(0, 4).matrixTransform(part('hook').getScreenCTM());
        delayedPaintGap = Math.max(delayedPaintGap, Math.abs(tip.y - curtain.getBoundingClientRect().bottom));
      }
      tracks.forEach(animation => { animation.currentTime = 1540; });
      return {
        tracks: tracks.length,
        hookGap,
        delayedPaintGap,
        sharedLayer: intro.querySelector('.intro-rescue').parentElement === curtain,
        curlBelowMin, curlBelowMax,
        bankError,
        bank: angle('airframe'),
        cableHookGap, winchGap, strokeError,
      };
    });
    assert.equal(result.tracks, 6);
    assert.equal(result.sharedLayer, true, 'The aircraft must travel inside the moving orange curtain');
    assert.ok(result.hookGap < 1, `Detached hook: ${result.hookGap}px`);
    assert.ok(result.delayedPaintGap < 1, `Hook drift when SVG painting lags: ${result.delayedPaintGap}px`);
    assert.ok(result.curlBelowMin > .5 && result.curlBelowMax < 5, `Only the small curl should wrap below the panel: ${result.curlBelowMin}–${result.curlBelowMax}px`);
    assert.equal(await page.locator('.intro-rescue').evaluate(el => getComputedStyle(el).overflow), 'visible', 'Do not clip the curl at the curtain edge');
    assert.ok(result.cableHookGap < .01, `Cable must terminate at the hook: ${result.cableHookGap}px`);
    assert.ok(result.winchGap < .01, `Cable must start at the winch center: ${result.winchGap}px`);
    assert.ok(result.strokeError < .01, `Rendered strokes must stay uniform through transforms: ${result.strokeError}px`);
    assert.ok(result.bankError < .01, `Bank must softly follow the pull: ${result.bankError}deg`);
    assert.ok(result.bank > 5 && result.bank < 22, 'The bank must stay visible but restrained');
    await page.screenshot({ path: `/tmp/helicopter-tug-${engine}-${width}.png` });
    const winch = await page.locator('.intro-rescue [data-lift-part="winch"]').boundingBox();
    await page.screenshot({ path: `/tmp/helicopter-winch-${engine}-${width}.png`, clip: { x: winch.x - 60, y: winch.y - 70, width: 160, height: 180 } });
    const hook = await page.locator('.intro-rescue [data-lift-part="hook"]').boundingBox();
    await page.screenshot({ path: `/tmp/helicopter-hook-${engine}-${width}.png`, clip: { x: hook.x - 35, y: hook.y - 35, width: 80, height: 80 } });
    console.log(`PASS ${width}px`, result);
    if (width === 390) {
      await page.setViewportSize({ width: height, height: width });
      await page.waitForFunction(() => !document.querySelector('#site-intro').open);
    } else await page.keyboard.press('Escape');
    assert.equal(await page.locator('#site-intro').evaluate(dialog => dialog.open), false);
    await context.close();
  }
} finally {
  await browser.close();
}
