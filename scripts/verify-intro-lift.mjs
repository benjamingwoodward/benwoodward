import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const engine = process.env.BRAND_BROWSER || 'chromium';
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ executablePath: engine === 'webkit' ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 600 : 900 }, deviceScaleFactor: 2 });
    await context.route('**/api/hit', route => route.fulfill({ status: 204 }));
    const page = await context.newPage();
    await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:4321/');
    await page.waitForFunction(() => document.documentElement.dataset.intro === 'leaving');
    const result = await page.evaluate(() => {
      const intro = document.querySelector('#site-intro');
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
      for (let time = 0; time < 2800; time += 31) {
        tracks.forEach(animation => { animation.currentTime = time; });
        rotor.currentTime = time % 160;
        const tip = new DOMPoint(0, 6).matrixTransform(part('hook').getScreenCTM());
        const edge = intro.querySelector('.intro-curtain').getBoundingClientRect();
        hookGap = Math.max(hookGap, Math.abs(tip.y - edge.bottom), Math.abs(tip.x - intro.clientWidth * .65));
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
      tracks.forEach(animation => { animation.currentTime = 1540; });
      return {
        tracks: tracks.length,
        hookGap,
        bankError,
        bank: angle('airframe'),
        cableHookGap, winchGap, strokeError,
      };
    });
    assert.equal(result.tracks, 6);
    assert.ok(result.hookGap < 1, `Detached hook: ${result.hookGap}px`);
    assert.ok(result.cableHookGap < .01, `Cable must terminate at the hook: ${result.cableHookGap}px`);
    assert.ok(result.winchGap < .01, `Cable must start at the winch center: ${result.winchGap}px`);
    assert.ok(result.strokeError < .01, `Rendered strokes must stay uniform through transforms: ${result.strokeError}px`);
    assert.ok(result.bankError < .01, `Bank must softly follow the pull: ${result.bankError}deg`);
    assert.ok(result.bank > 5 && result.bank < 22, 'The bank must stay visible but restrained');
    await page.screenshot({ path: `/tmp/helicopter-tug-${engine}-${width}.png` });
    const winch = await page.locator('.intro-rescue [data-lift-part="winch"]').boundingBox();
    await page.screenshot({ path: `/tmp/helicopter-winch-${engine}-${width}.png`, clip: { x: winch.x - 60, y: winch.y - 70, width: 160, height: 180 } });
    console.log(`PASS ${width}px`, result);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#site-intro').evaluate(dialog => dialog.open), false);
    await context.close();
  }
} finally {
  await browser.close();
}
