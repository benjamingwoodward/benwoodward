import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const engine = process.env.BRAND_BROWSER || "chromium";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const output = `/tmp/benwoodward-art-${engine}`;
await mkdir(output, { recursive: true });
const browser = await (engine === "webkit" ? webkit : chromium).launch({ executablePath: engine === "webkit" ? process.env.WEBKIT_PATH : process.env.CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.route("**/api/hit", route => route.fulfill({ status: 204 }));
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const results = [];
const check = async (name, run) => { const evidence = await run(); results.push({ name, evidence }); console.log(`PASS ${engine}: ${name}`, evidence ?? ""); };
const settle = async () => page.waitForTimeout(80);
try {
  await page.goto(`${base}/#work`);
  assert.equal(await page.locator(".achievement-svg").count(),5,"All five work cards use purpose-built machinery");
  await page.evaluate(() => document.documentElement.style.scrollBehavior = "auto");
  await check("Achievement order, static qualifications, nine overlapping age chapters", async () => {
    assert.deepEqual(await page.locator(".work-copy h3").allTextContents(), ["Fintech & fraud systems", "Water-quality analytics", "Onboarding automation", "AI outbound systems", "Rapid prototyping"]);
    assert.equal(await page.locator("#work-outbound + .work-metric").textContent(), "$1.04M annual run-rate");
    assert.deepEqual(await page.locator(".story-age").allTextContents(), ["Age 0–18", "Age 8–15", "Age 15", "Age 15–22", "Age 20–22", "Age 22", "Age 22", "Age 22", "Now"]);
    assert.match(await page.locator(".story-endurance").textContent(), /Helsinki Marathon in 3\.5 hours/);
    assert.match(await page.locator(".story-competition").textContent(), /Won at 15, 19, and 22/);
    assert.match(await page.locator(".story-now").textContent(), /business line worth \$750M at Redo/);
    assert.equal(await page.locator(".story-graphic").count(), 0);
    assert.equal(await page.locator(".story-software .pureflow-preview").count(), 1);
    assert.equal(await page.locator(".work-card:has(#work-pureflow) .work-machine").count(), 1);
    assert.equal(await page.locator(".work-section .pureflow-preview").count(), 0);
    assert.equal(await page.locator(".work-card:has(#work-building) img").count(), 0);
    assert.equal(await page.locator(".work-card:has(#work-building) a").count(), 0);
    assert.equal(await page.locator(".story-competition img").count(), 2);
    assert.equal(await page.locator(".timeline-detail,.story-section astro-island,.story-section svg").count(), 0);
    assert.deepEqual(await page.locator(".story-collage").evaluateAll(collages=>collages.map(el=>el.querySelectorAll("img").length)), [3,3,2,4,1]);
    assert.equal(await page.locator(".chapter-text-only .story-collage,.chapter-text-only .pureflow-preview").count(), 0);
    assert.equal(await page.locator(".story-competition svg,.story-mission svg,.story-endurance svg,.story-now svg").count(), 0);
    for (const card of await page.locator(".work-card").all()) {
      assert.equal(await card.evaluate(el => el.querySelector(".work-metric").getBoundingClientRect().bottom < el.querySelector(".work-machine,.pureflow-preview").getBoundingClientRect().top), true);
    }
  });
  for (const scene of ["financial-systems", "water-measurement", "merchant-connection", "outbound-system", "prototype-building"]) {
    await check(`${scene}: 101 sampled poses, attached parts, uniform strokes, final rest`, async () => {
      const machine = page.locator(`[data-illustration="${scene}"]`);
      await machine.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForFunction(id => document.querySelector(`[data-illustration="${id}"]`).getAnimations({ subtree: true }).length > 0, scene);
      const evidence = await machine.evaluate((root, scene) => {
        const svg = root.querySelector("svg");
        const animations = root.getAnimations({ subtree: true });
        animations.forEach(animation => animation.pause());
        const part = name => root.querySelector(`[data-art="${name}"]`);
        const point = (element, x, y) => new DOMPoint(x, y).matrixTransform(element.getScreenCTM());
        const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const expected = 1.6 * Math.hypot(svg.getScreenCTM().a, svg.getScreenCTM().b);
        let attachment = 0, stroke = 0, payloadCountError = 0, collision = false;
        for (let time = 0; time <= 4000; time += 40) {
          animations.forEach(animation => { animation.currentTime = time; });
          for (const element of svg.querySelectorAll("path,rect,circle")) {
            const style = getComputedStyle(element);
            if (style.stroke === "none") continue;
            const m = element.getScreenCTM();
            const w = parseFloat(style.strokeWidth);
            stroke = Math.max(stroke, Math.abs(w * Math.hypot(m.a,m.b) - expected), Math.abs(w * Math.hypot(m.c,m.d) - expected));
          }
          if (scene === "merchant-connection") {
            attachment = Math.max(attachment, distance(point(part("elbow"),92,0), point(part("gripper"),0,0)));
            if (time >= 920 && time < 2920) attachment = Math.max(attachment, distance(point(part("gripper"),0,22), point(part("merchant-carried"),0,22)));
            payloadCountError = Math.max(payloadCountError,Math.abs(["merchant-waiting","merchant-carried","merchant-seated"].filter(name=>getComputedStyle(part(name)).visibility === "visible").length-1));
          }
          if (scene === "water-measurement") {
            const shaft = part("probe-shaft"), shaftBox = shaft.getBBox();
            // WebKit returns an empty (0,0,0,0) bbox for a zero-height rect.
            attachment = Math.max(attachment,distance(point(shaft,76,Number(shaft.getAttribute("y"))+shaftBox.height),point(part("probe"),76,74)));
          }
          if (scene === "financial-systems") {
            const gate=part("inspection-gate"),card=part("transaction").getBoundingClientRect(),pivot=point(svg,233,105);
            attachment = Math.max(attachment,distance(point(gate,0,0),pivot));
            if(card.right>pivot.x && card.left<pivot.x+6*expected/1.6 && gate.getBoundingClientRect().bottom>card.top) collision=true;
          }
          if (scene === "prototype-building") {
            const jaw=point(part("jig-right"),214,130),board=point(part("circuit-board"),213,130);
            attachment=Math.max(attachment,Math.abs(distance(jaw,board)-expected/1.6));
            if(time>=2280 && time<=2760)attachment = Math.max(attachment,distance(point(part("driver"),155,130),point(part("fastener"),155,122)));
          }
        }
        return { tracks: animations.length, attachment, payloadCountError, collision, stroke, duration: animations[0].effect.getTiming().duration, iterations: animations[0].effect.getTiming().iterations };
      }, scene);
      assert.equal(evidence.duration,4000);
      assert.equal(evidence.iterations,1);
      assert.ok(evidence.attachment < .08, JSON.stringify(evidence));
      assert.ok(evidence.stroke < .001, JSON.stringify(evidence));
      assert.equal(evidence.payloadCountError,0);
      assert.equal(evidence.collision,false,"Inspection gate must be clear before the card passes it");
      for (const time of [0,1500,2800,4000]) {
        await machine.evaluate((el,time) => el.getAnimations({ subtree:true }).forEach(a=>{a.currentTime=time;}),time);
        await machine.screenshot({ path: `${output}/${scene}-${time}.png` });
      }
      return evidence;
    });
  }
  await check("Finite completion, no scroll replay, linked replay, offscreen and hidden-tab pause", async () => {
    await page.goto(`${base}/?art-review=lifecycle#work`);
    const target = page.locator('[data-illustration="financial-systems"]');
    await target.evaluate(el=>el.scrollIntoView({block:"center",behavior:"instant"}));
    await page.waitForFunction(()=>document.querySelector('[data-illustration="financial-systems"]').dataset.playback === "playing");
    await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));});
    await target.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.ready)));
    const time = await target.evaluate(el=>el.getAnimations({subtree:true})[0].currentTime);
    await page.waitForTimeout(120);
    assert.equal(await target.evaluate(el=>el.getAnimations({subtree:true})[0].currentTime),time);
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event("visibilitychange"));});
    await page.locator(".story-now").evaluate(el=>el.scrollIntoView({block:"center",behavior:"instant"}));
    await settle();
    assert.equal(await target.evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState === "paused")),true);
    await target.evaluate(el=>el.scrollIntoView({block:"center",behavior:"instant"}));
    await page.waitForFunction(()=>document.querySelector('[data-illustration="financial-systems"]').dataset.playback === "finished", undefined, {timeout:6000});
    assert.equal(await target.evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.currentTime === 4000 && a.playState === "finished")),true);
    await page.locator(".story-now").evaluate(el=>el.scrollIntoView({block:"center",behavior:"instant"}));
    await settle();
    await target.evaluate(el=>el.scrollIntoView({block:"center",behavior:"instant"}));
    await settle();
    assert.equal(await target.getAttribute("data-playback"),"finished");
    await page.locator('a[href="https://redo.com"]').focus();
    await settle();
    assert.equal(await target.getAttribute("data-playback"),"playing");
    assert.equal(await page.locator('.work-card:has(#work-onboarding) a,.work-card:has(#work-outbound) a,.work-card [tabindex],.work-machine button').count(),0);
  });
  await check("Responsive timeline, anchor and keyboard clearance, timeline Pureflow preview", async () => {
    await page.emulateMedia({ reducedMotion:"reduce" });
    // WebKit defers offscreen lazy images even when decode() is requested.
    for (const image of await page.locator(".story-collage img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(el=>el.decode());
    }
    for (const width of [360,390,768,1024,1440]) {
      await page.setViewportSize({width,height:width<600?600:1000});
      await page.locator("#story-title").evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.equal(await page.locator("#story-title").evaluate(el=>el.getBoundingClientRect().top >= document.querySelector(".rock-transition").getBoundingClientRect().bottom),true);
      const photo = page.locator('[data-gallery-open="origin"]').first();
      await photo.evaluate(el=>{scrollBy({top:el.getBoundingClientRect().top-40,behavior:"instant"});});
      await page.keyboard.press("Tab");
      await photo.focus();
      await settle();
      assert.equal(await photo.evaluate(el=>el.getBoundingClientRect().top >= document.querySelector(".rock-transition").getBoundingClientRect().bottom),true);
      for (const image of await page.locator(".story-collage img").all()) {
        // Responsive lazy-source swaps can temporarily clear naturalWidth in WebKit;
        // the authored intrinsic dimensions still reserve the exact full-photo ratio.
        assert.equal(await image.evaluate(el=>{ const box=el.getBoundingClientRect();const ratio=Number(el.getAttribute("width"))/Number(el.getAttribute("height"));return Math.abs(box.width/box.height-ratio)<.01; }),true,"Collage photos retain their complete natural frame");
      }
      await page.screenshot({path:`${output}/timeline-${width}.png`});
    }
    await page.evaluate(()=>document.body.style.zoom="2");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`${output}/timeline-200percent.png`});
    await page.evaluate(()=>document.body.style.zoom="");
    assert.equal(await page.locator("#video-dialog,[data-video-open],.preview-action").count(),0);
    await page.locator(".pureflow-preview").scrollIntoViewIfNeeded();
    assert.equal(await page.locator(".pureflow-preview video").evaluate(el=>el.paused),true,"Reduced motion keeps the static Pureflow poster");
    assert.equal(await page.locator(".pureflow-preview img").evaluate(el=>getComputedStyle(el).visibility),"visible");
  });
  await check("Complete static illustrations: reduced motion, no JS, no animation API", async () => {
    for (const mode of ["reduced","no-js","no-api"]) {
      const c = await browser.newContext({ javaScriptEnabled: mode !== "no-js", reducedMotion: mode === "reduced"?"reduce":"no-preference",viewport:{width:390,height:844} });
      await c.route("**/api/hit",route=>route.fulfill({status:204}));
      if(mode === "no-api") await c.addInitScript(()=>{Element.prototype.animate=undefined;});
      const p = await c.newPage();
      await p.goto(base);
      assert.equal(await p.locator(".achievement-svg,.bento-machine").count(),5);
      assert.equal(await p.locator(".story-card").count(),9);
      assert.equal(await p.locator(".work-card button,.work-machine a").count(),0);
      assert.equal(await p.locator(".achievement-svg,.bento-machine").evaluateAll(elements=>elements.every(el=>el.getAnimations({subtree:true}).length===0)),true);
      assert.equal(await p.locator('[data-art="connected"]').evaluate(el=>getComputedStyle(el).fill),"rgb(255, 79, 31)");
      assert.deepEqual(await p.locator('.vehicle-scene').evaluate(el=>["helicopter","bulldozer","forklift"].filter(name=>getComputedStyle(el.querySelector(`[data-cycle-part="${name}"]`)).visibility === "visible")),["bulldozer"]);
      await c.close();
    }
  });
  await check("Loading helicopter hands off to the hero bulldozer", async () => {
    await page.emulateMedia({reducedMotion:"no-preference"});
    await page.goto(base);
    await page.waitForFunction(()=>document.documentElement.dataset.intro === "leaving");
    assert.equal(await page.locator(".vehicle-scene").evaluate(el=>getComputedStyle(el).visibility),"hidden");
    assert.equal(await page.locator(".vehicle-scene").evaluate(el=>el.getAnimations({subtree:true}).length),0);
    await page.waitForFunction(()=>!document.documentElement.dataset.intro);
    await page.waitForFunction(()=>document.querySelector(".vehicle-scene").getAnimations({subtree:true}).length>0);
    assert.equal(await page.locator(".vehicle-scene").evaluate(el=>getComputedStyle(el).visibility),"visible");
    const elapsed = await page.locator(".vehicle-scene").evaluate(el=>Number(el.getAnimations({subtree:true})[0].currentTime));
    assert.ok(elapsed < 500,`Hero must start from its opening, not partway through: ${elapsed}`);
    assert.deepEqual(await page.locator('.vehicle-scene').evaluate(el=>["helicopter","bulldozer","forklift"].filter(name=>getComputedStyle(el.querySelector(`[data-cycle-part="${name}"]`)).visibility === "visible")),["bulldozer"]);
    assert.equal(await page.locator("#site-intro").evaluate(el=>el.open),false);
    return {heroElapsedAfterCurtain:elapsed};
  });
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
} finally { await browser.close(); }
