// SVG reconstruction of the selected image-generated BW concept.
// Run with Node to print the SVG. No raster tracing or external dependencies.
import { pathToFileURL } from 'node:url';

const band = 44;
const corner = 10;
const slope = Math.sqrt(3);
const top = 94;
const bottom = top + 76 * slope;
const shoulder = bottom - 32 * slope;
const half = band / 2;
const miter = half / slope;
const xy = ([x, y]) => `${+x.toFixed(4)} ${+y.toFixed(4)}`;
const sub = (a, b) => a.map((n, i) => n - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const unit = p => p.map(n => n / Math.hypot(...p));

// The two boundaries of the B's returning stroke intersect the same straight
// 60-degree edge of the W. A single outline removes seams at that shared join.
// The counter is a regular flat-top hexagon: six equal sides, 120° corners.
// Its upper-left edge stays open where the bowl meets the ascender.
const counterRadius = (bottom - half - (top + half)) / slope;
const counterCenter = [54 + counterRadius, (top + bottom) / 2];
const counter = Array.from({ length: 6 }, (_, i) => [
  counterCenter[0] + counterRadius * Math.cos(i * Math.PI / 3),
  counterCenter[1] + counterRadius * Math.sin(i * Math.PI / 3),
]);
const [right, lowerRight, lowerLeft, left, upperLeft, upperRight] = counter;
const shift = upperRight[0] - (128 - miter);
const diagonalX = y => upperRight[0] + (y - upperRight[1]) / slope;
const joinY = (lowerRight[1] + band + upperRight[1]
  + (lowerRight[0] + 2 * miter - upperRight[0]) * slope) / 2;
const peak = joinY - band;
const peakFlatDrop = 24;
const valleyEnd = 292 - (bottom - peak) / slope;
const valleyStart = 292 + (bottom - peak) / slope;
// Match the actual curved terminal silhouette to the B's horizontal shoulder,
// rather than aligning the invisible sharp point above the terminal fillet.
const capOvershoot = corner * (slope - 1);
const rightTip = top - half - capOvershoot;
// Align the two outside lower bends while preserving the W valley widths.
const terminalShift = ((shoulder - half * Math.tan(Math.PI / 12)) - left[1]) / slope;
const terminalOuter = 434 + shift + terminalShift;
const terminalInner = terminalOuter - band;
const polygon = [
  [54, 16], [10, 16 + band / slope],
  [10, left[1] + band * Math.tan(Math.PI / 12)],
  [lowerLeft[0] - 2 * miter, bottom + half], [lowerRight[0] + 2 * miter, bottom + half],
  [diagonalX(joinY), joinY],
  [204 + shift - miter, bottom + half], [valleyEnd + shift + miter, bottom + half],
  [292 + shift, joinY],
  [valleyStart + shift - miter, bottom + half], [380 + shift + miter, bottom + half],
  [terminalOuter, left[1] + band * Math.tan(Math.PI / 12)],
  [terminalOuter, rightTip], [terminalInner, rightTip + band / slope],
  [terminalInner, left[1]],
  [380 + shift - miter, bottom - half], [valleyStart + shift + miter, bottom - half],
  // Truncate the W apex into a short horizontal plateau, with matching fillets.
  [292 + shift + peakFlatDrop / slope, peak - band + peakFlatDrop],
  [292 + shift - peakFlatDrop / slope, peak - band + peakFlatDrop],
  [valleyEnd + shift - miter, bottom - half], [204 + shift + miter, bottom - half],
  // This entire edge is one straight diagonal, without the generated kink.
  [upperRight[0] + 2 * miter, top - half], [upperLeft[0], top - half],
  upperLeft, upperRight, right, lowerRight, lowerLeft, left,
];

for (let i = 0; i < counter.length; i++) {
  const length = Math.hypot(...sub(counter[i], counter[(i + 1) % counter.length]));
  if (Math.abs(length - counterRadius) > 1e-9) throw new Error('Unequal hexagon sides');
}

const fillets = polygon.map((point, i) => {
  const previous = polygon[(i + polygon.length - 1) % polygon.length];
  const next = polygon[(i + 1) % polygon.length];
  const a = unit(sub(previous, point));
  const b = unit(sub(next, point));
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  const tangent = corner / Math.tan(angle / 2);
  // Adjacent fillets must fit their shared edge without overlapping.
  const incoming = sub(point, previous);
  const outgoing = sub(next, point);
  const sweep = incoming[0] * outgoing[1] - incoming[1] * outgoing[0] > 0 ? 1 : 0;
  const start = point.map((n, k) => n + a[k] * tangent);
  const end = point.map((n, k) => n + b[k] * tangent);
  return { start, end, tangent, sweep, radius: corner };
});

// Keep equal clear space around the actual rounded silhouette, not its control
// vertices. This prevents a visually off-centre image when used as an asset.
const padding = 16;
const bounds = { left: 10, top: 16 + capOvershoot, right: terminalOuter, bottom: bottom + half };
const viewBox = [bounds.left - padding, bounds.top - padding,
  bounds.right - bounds.left + 2 * padding, bounds.bottom - bounds.top + 2 * padding];
const path = fillets.map(({ start, end, sweep }, i) =>
  `${i ? 'L' : 'M'}${xy(start)}A${corner} ${corner} 0 0 ${sweep} ${xy(end)}`
).join('') + 'Z';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.map(n => +n.toFixed(4)).join(' ')}" fill="none" role="img" aria-labelledby="bw-title bw-description">
  <title id="bw-title">Ben Woodward — BW monogram</title>
  <desc id="bw-description">Rounded geometric lowercase BW with a regular hexagonal B counter, a continuous diagonal join, and a lowered flat-topped W peak.</desc>
  <!-- Single vector outline. Regular hexagonal counter, 60-degree diagonals,
       44-unit bands, 10-unit fillets.
       Source: design/brand/build-clean-monogram.mjs -->
  <path fill="#142219" d="${path}"/>
</svg>`;

export { svg, polygon, fillets, counter, counterRadius, corner, band, bounds, viewBox, padding };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(svg);
