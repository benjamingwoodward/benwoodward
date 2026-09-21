import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const before = readFileSync(new URL('design/brand/bw-before-polish.svg', root));
const after = readFileSync(new URL('public/brand/bw-clean.svg', root));
await sharp(after).resize({ width: 1344 }).flatten({ background: '#fff' })
  .extend({ top: 120, bottom: 120, left: 120, right: 120, background: '#fff' })
  .png().toFile(new URL('public/brand/bw-clean-preview.png', root).pathname);
const layers = [];
const label = (text, left, top) => layers.push({
  input: Buffer.from(`<svg width="420" height="30"><text x="0" y="22" font-family="sans-serif" font-size="16" fill="#58615b">${text}</text></svg>`), left, top,
});
label('Before', 60, 28);
label('Polished', 550, 28);
let y = 88;
for (const width of [320, 160, 96, 64, 48, 32]) {
  const a = await sharp(before).resize({ width }).png().toBuffer({ resolveWithObject: true });
  const b = await sharp(after).resize({ width }).png().toBuffer({ resolveWithObject: true });
  layers.push({ input: a.data, left: 60, top: y }, { input: b.data, left: 550, top: y });
  label(`${width}px`, 60, y + Math.max(a.info.height, b.info.height) + 7);
  y += Math.max(a.info.height, b.info.height) + 63;
}
await sharp({ create: { width: 980, height: y + 20, channels: 4, background: '#fff' } })
  .composite(layers).png().toFile(new URL('public/brand/bw-polish-review.png', root).pathname);
console.log('Rendered preview and before/after size proof.');
