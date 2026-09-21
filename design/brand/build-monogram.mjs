// Prints editable SVG artwork. All corners come from the same geometric rules.
const radius = 64;
const band = 36;
const gap = 14;
const corner = 8;
const stemTop = 16;
const upperShoulder = 144;
const lowerShoulder = 176;
const rise = radius * Math.sqrt(3) / 2;
const baseline = lowerShoulder + rise;
const bowlTop = upperShoulder - rise;
const add = (a, b) => a.map((value, index) => value + b[index]);
const subtract = (a, b) => a.map((value, index) => value - b[index]);
const multiply = (a, factor) => a.map(value => value * factor);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const unit = a => multiply(a, 1 / Math.hypot(...a));
const coordinate = point => point.map(value => +value.toFixed(4)).join(" ");

function outline(points) {
  const normals = points.slice(1).map((point, index) => unit(subtract(point, points[index]))).map(([x, y]) => [-y, x]);
  const side = sign => points.map((point, index) => {
    const normal = index === 0 ? normals[0] : index === points.length - 1 ? normals.at(-1)
      : multiply(add(normals[index - 1], normals[index]), 1 / (1 + dot(normals[index - 1], normals[index])));
    return add(point, multiply(normal, band / 2 * sign));
  });
  return [...side(1), ...side(-1).reverse()];
}

function fillet(polygon) {
  return polygon.map((point, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const next = polygon[(index + 1) % polygon.length];
    const a = unit(subtract(previous, point));
    const b = unit(subtract(next, point));
    const angle = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
    const tangent = corner / Math.tan(angle / 2);
    const incoming = subtract(point, previous);
    const outgoing = subtract(next, point);
    const sweep = incoming[0] * outgoing[1] - incoming[1] * outgoing[0] > 0 ? 1 : 0;
    return `${index ? "L" : "M"}${coordinate(add(point, multiply(a, tangent)))}A${corner} ${corner} 0 0 ${sweep} ${coordinate(add(point, multiply(b, tangent)))}`;
  }).join("") + "Z";
}

const left = outline([[32, stemTop], [32, lowerShoulder], [64, baseline], [200, baseline]]);
// The B's lower cut is parallel to the neighboring W band, with a measured gap.
const cut = Math.sqrt(3) / 2 * 160 - lowerShoulder / 2 - band / 2 - gap;
for (const index of [3, 4]) left[index][0] = (cut + left[index][1] / 2) / (Math.sqrt(3) / 2);
const right = outline([
  [64, bowlTop], [128, bowlTop], [160, upperShoulder], [160, lowerShoulder],
  [192, baseline], [256, baseline], [288, lowerShoulder], [320, baseline],
  [384, baseline], [416, lowerShoulder], [416, bowlTop - band / 2],
]);

console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 ${(baseline + band / 2 + 16).toFixed(4)}" fill="none" role="img" aria-labelledby="bw-title bw-description">
  <title id="bw-title">Ben Woodward — refined BW monogram</title>
  <desc id="bw-description">A compact interlocking lowercase BW in dark ink, with softened geometric corners.</desc>
  <!-- 60-degree geometry; ${band}-unit bands; ${gap}-unit openings; ${corner}-unit circular corner radii.
       Matching W valleys, common baseline, aligned bowl and W terminal.
       Source: design/brand/build-monogram.mjs -->
  <g fill="#142219">
    <path d="${fillet(left)}"/>
    <path d="${fillet(right)}"/>
  </g>
</svg>`);
