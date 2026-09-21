import { svg } from './build-clean-monogram.mjs';
const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
const outline = svg.match(/<path fill="#142219" d="([^"]+)"/)[1];
console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="icon-title">
  <title id="icon-title">Ben Woodward</title>
  <svg x="38" y="137" width="436" height="238" viewBox="${viewBox}">
    <path fill="#ff4f1f" d="${outline}"/>
  </svg>
</svg>`);
