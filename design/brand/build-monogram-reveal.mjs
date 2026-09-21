// A one-shot growth reveal inspired by Operator's 2.4-second mark reveal.
// The approved logo remains the only visible geometry. Oversized reveal strokes
// are masks, so they never change its outline, band widths, or corner radii.
import { pathToFileURL } from 'node:url';
import { svg as staticSvg, polygon, band } from './build-clean-monogram.mjs';

const half = band / 2;
const n = v => +v.toFixed(4);
const p = ([x, y]) => `${n(x)} ${n(y)}`;
const midpoint = (a, b) => a.map((v, i) => (v + b[i]) / 2);
const floor = polygon[6][1] - half;
const junction = [polygon[25][0] + half / Math.cos(Math.PI / 6), polygon[25][1]];
const upperShoulder = [polygon[24][0] + half / Math.sqrt(3), polygon[24][1] - half];
// One uninterrupted B route: stem → lower bowl → right joint → upper arm.
// The arm is traced backwards from the joint, never from its detached tip.
const b = [
  [polygon[0][0] - half, 20],
  [polygon[0][0] - half, polygon[28][1] + half * Math.tan(Math.PI / 12)],
  [polygon[27][0] - half / Math.sqrt(3), floor],
  [polygon[26][0] + half / Math.sqrt(3), floor],
  junction,
  upperShoulder,
  [polygon[22][0], polygon[22][1] + half],
];
const w = [
  junction,
  [polygon[20][0] - half / Math.sqrt(3), floor],
  [polygon[19][0] + half / Math.sqrt(3), floor],
  [polygon[8][0], polygon[8][1] - band],
  [polygon[16][0] - half / Math.sqrt(3), floor],
  [polygon[15][0] + half / Math.sqrt(3), floor],
  [polygon[14][0] + half, polygon[14][1] + half * Math.tan(Math.PI / 12)],
  [midpoint(polygon[12], polygon[13])[0], polygon[12][1]],
];
const lengths = b.slice(1).map((point, i) => Math.hypot(point[0] - b[i][0], point[1] - b[i][1]));
const junctionProgress = lengths.slice(0, 4).reduce((a, v) => a + v, 0) / lengths.reduce((a, v) => a + v, 0);
// Solve the B's easing curve to start the W at the exact joint arrival time.
// This keeps the two branches attached even if the B geometry changes later.
const bezier = (t, a, c) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * c + t ** 3;
let low = 0, high = 1;
for (let i = 0; i < 40; i++) {
  const mid = (low + high) / 2;
  if (bezier(mid, 0, 1) < junctionProgress) low = mid; else high = mid;
}
const branchTime = n(.025 + (.65 - .025) * bezier((low + high) / 2, .42, .35));
const line = points => points.map((point, i) => `${i ? 'L' : 'M'}${p(point)}`).join('');
const outline = staticSvg.match(/<path fill="#142219" d="([^"]+)"/)[1];
const viewBox = staticSvg.match(/viewBox="([^"]+)"/)[1];
const maskStroke = (id, points, times, values, splines, hiddenUntil = 0) => `
      <path id="${id}" d="${line(points)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="0">
        ${hiddenUntil ? `<set attributeName="visibility" to="hidden" begin="0s" dur="${n(hiddenUntil * 2.4)}s" fill="remove"/>` : ''}
        <animate attributeName="stroke-dashoffset" values="${values}" keyTimes="${times}" keySplines="${splines}" calcMode="spline" begin="0s" dur="2.4s" repeatCount="1" fill="remove"/>
      </path>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" role="img" aria-labelledby="bw-reveal-title bw-reveal-description">
  <title id="bw-reveal-title">Ben Woodward — BW reveal</title>
  <desc id="bw-reveal-description">The B grows into place, followed by a continuous sweep through the W. Plays once, then holds the finished monogram.</desc>
  <style>
    .bw-rest{display:none}
    @media(prefers-reduced-motion:reduce){.bw-motion{display:none}.bw-rest{display:inline}}
  </style>
  <defs>
    <path id="bw-outline" d="${outline}"/>
    <mask id="bw-growth" maskUnits="userSpaceOnUse" x="-10" y="0" width="490" height="275" style="mask-type:luminance">
      <g fill="none" stroke="white" stroke-width="72" stroke-linecap="round" stroke-linejoin="round">
        <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.02;.12;1" begin="0s" dur="2.4s" repeatCount="1" fill="remove"/>
        ${maskStroke('bw-b-growth', b, '0;.025;.65;1', '1;1;0;0', '0 0 1 1;.42 0 .35 1;0 0 1 1')}
        ${maskStroke('bw-w-growth', w, `0;${branchTime};.97;1`, '1;1;0;0', '0 0 1 1;.42 0 .22 1;0 0 1 1', branchTime)}
      </g>
    </mask>
  </defs>
  <use class="bw-motion" href="#bw-outline" fill="#142219" mask="url(#bw-growth)">
    <set attributeName="mask" to="none" begin="2.4s" fill="freeze"/>
  </use>
  <use class="bw-rest" href="#bw-outline" fill="#142219"/>
</svg>`.replace(/[ \t]+$/gm, '');

const preview = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>BW logo reveal</title>
<style>
  @font-face{font-family:Lausanne;src:url('/fonts/TWKLausanne-400.woff2') format('woff2');font-display:swap}
  *{box-sizing:border-box}body{margin:0;background:#fafbf9;color:#142219;font-family:Lausanne,Arial,sans-serif}
  main{min-height:100svh;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:32px 24px;gap:44px}
  .stage{width:min(600px,100%);aspect-ratio:1.846;display:grid;place-items:center}.stage svg{width:100%;height:auto;display:block}
  .controls{display:flex;align-items:center;gap:24px}button,a{font:inherit;font-size:15px}button{border:0;border-radius:7px;padding:13px 23px;min-height:46px;background:#ff4f1f;color:#142219;cursor:pointer}button:disabled{background:#e9ece8;cursor:default}a{color:inherit;padding:14px 0;text-underline-offset:4px}
  button:focus-visible,a:focus-visible{outline:2px solid #142219;outline-offset:5px}p{font-size:14px;color:#657067;margin:0}button[hidden]{display:none}
</style><noscript><style>.stage .bw-motion{display:none}.stage .bw-rest{display:inline}</style></noscript></head>
<body><main><div class="stage">${svg}</div><div class="controls"><button id="replay" type="button" hidden>Replay reveal</button><a href="/brand/bw-reveal.svg">Animated SVG</a></div><p id="status">2.4 seconds · plays once</p></main>
<script>
  const mark=document.querySelector('.stage svg');
  const button=document.querySelector('#replay');
  const status=document.querySelector('#status');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const capable=typeof mark.setCurrentTime==='function';
  button.hidden=!capable;
  function preferences(){
    button.disabled=motion.matches;
    status.textContent=motion.matches?'Reduced motion · static logo':'2.4 seconds · plays once';
    if(motion.matches&&capable)mark.setCurrentTime(2.4);
  }
  function visibility(){
    if(!capable)return;
    if(document.hidden)mark.pauseAnimations();else mark.unpauseAnimations();
  }
  button.addEventListener('click',()=>{if(!motion.matches){mark.setCurrentTime(0);mark.unpauseAnimations();}});
  motion.addEventListener('change',preferences);
  document.addEventListener('visibilitychange',visibility);
  preferences();visibility();
</script></body></html>`;

export { svg, preview };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(process.argv.includes('--preview') ? preview : svg);
