import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { svg, polygon, fillets, counter, counterRadius, corner, band, bounds, viewBox, padding } from './build-clean-monogram.mjs';

const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-7, `${label}: ${a} != ${b}`);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const lineDistance = (p, a, b) => Math.abs(cross(a, b, p)) / distance(a, b);

assert.equal(readFileSync(new URL('../../public/brand/bw-clean.svg', import.meta.url), 'utf8').trim(), svg);
assert.equal((svg.match(/<path /g) ?? []).length, 1);
assert.ok(!/<image|<script|<foreignObject|href=/i.test(svg));
for (let i = 0; i < 6; i++) {
  near(distance(counter[i], counter[(i + 1) % 6]), counterRadius, 'Hexagon side');
  near(distance(counter[i], counter[(i + 3) % 6]), 2 * counterRadius, 'Hexagon diameter');
}
for (let i = 0; i < polygon.length; i++) {
  const j = (i + 1) % polygon.length;
  const [dx, dy] = polygon[j].map((v, k) => v - polygon[i][k]);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  near(angle / 30, Math.round(angle / 30), '30° construction grid');
  near(fillets[i].radius, corner, 'Corner radius');
  assert.ok(fillets[i].tangent + fillets[j].tangent < distance(polygon[i], polygon[j]), 'Fillets overlap');
  for (let k = i + 2; k < polygon.length; k++) {
    const l = (k + 1) % polygon.length;
    if (l === i) continue;
    assert.ok(!(cross(polygon[i], polygon[j], polygon[k]) * cross(polygon[i], polygon[j], polygon[l]) < -1e-8
      && cross(polygon[k], polygon[l], polygon[i]) * cross(polygon[k], polygon[l], polygon[j]) < -1e-8), 'Self-intersecting outline');
  }
}
near(polygon[0][0] - polygon[1][0], band, 'B stem weight');
near(polygon[12][0] - polygon[13][0], band, 'W terminal weight');
near(lineDistance(polygon[21], polygon[24], polygon[25]), band, 'Shared diagonal weight');
near(lineDistance(polygon[8], polygon[18], polygon[19]), band, 'W rising band weight');
near(distance(polygon[15], polygon[16]), distance(polygon[19], polygon[20]), 'W counter floors');
near(fillets[15].start[1], fillets[19].start[1], 'W counter floor heights');
near(polygon[5][1], polygon[8][1], 'Lower notch heights');
near(polygon[2][1], polygon[11][1], 'Outside lower bend heights');
near(polygon[12][1] + corner * (Math.sqrt(3) - 1), polygon[21][1], 'Optical terminal alignment');
assert.ok(distance(fillets[17].end, fillets[18].start) > 16, 'W plateau too short');
near(bounds.left - viewBox[0], padding, 'Left padding');
near(bounds.top - viewBox[1], padding, 'Top padding');
near(viewBox[0] + viewBox[2] - bounds.right, padding, 'Right padding');
near(viewBox[1] + viewBox[3] - bounds.bottom, padding, 'Bottom padding');
for (const width of [32, 48, 64, 96, 160, 320, 1344]) {
  const { info } = await sharp(Buffer.from(svg)).resize({ width }).png().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, width);
}
console.log('PASS: reproducible single-path SVG; regular hexagon; angular grid; band weights; matched W valleys; aligned terminals/bends; uniform padding; non-overlapping fillets; no outline crossings; seven raster sizes.');
