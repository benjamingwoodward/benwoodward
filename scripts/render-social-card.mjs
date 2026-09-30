import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const font = (await readFile('public/fonts/TWKLausanne-400.woff2')).toString('base64');
  const logo = (await readFile('public/brand/bw-clean.svg', 'utf8')).replaceAll('#142219', '#000000');
  await page.setContent(`<!doctype html><html><head><style>
    @font-face{font-family:Lausanne;src:url(data:font/woff2;base64,${font});font-weight:400}
    *{box-sizing:border-box}body{margin:0;padding:52px 60px;width:1200px;height:630px;background:#ff4f1f;color:#000;font-family:Lausanne,Arial,sans-serif}
    header{display:flex;justify-content:space-between;align-items:center}header svg{width:112px;height:auto}header span{font-size:20px}
    main{display:grid;grid-template-columns:1fr 390px;gap:64px;align-items:end;margin-top:100px}h1{font-size:90px;font-weight:400;line-height:.98;margin:0}
    h2{font-size:34px;font-weight:400;line-height:1.16;margin:0 0 24px}p{font-size:20px;line-height:1.4;margin:0;max-width:320px}
    footer{border-top:1px solid #14221950;position:absolute;bottom:48px;left:60px;right:60px;padding-top:18px;font-size:16px}
  </style></head><body><header>${logo}<span>benwoodward.bio</span></header><main><h1>Ben<br>Woodward.</h1><div><h2>Exited founder.<br>Now GM of Coverage<br>at Redo.</h2><p>A business line worth $750M.</p></div></main><footer>Fintech · AI infrastructure · Automation</footer></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'public/og-image.png' });
  console.log('Rendered the 1200×630 social card.');
} finally { await browser.close(); }
