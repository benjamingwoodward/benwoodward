# BW reveal

- Asset: `public/brand/bw-reveal.svg`.
- Replay preview: `/brand/reveal.html` (noindex).
- Generator: `build-monogram-reveal.mjs`; pass `--preview` for preview HTML.
- Timing: 2.4 seconds, one shot. One continuous stroke descends the B stem,
  rounds its lower bowl, and climbs its right side into the upper arm. The W
  branches from that same right-side joint at the calculated arrival time,
  rather than revealing the B arm as a detached segment. Both ease into rest.
- The approved outline is unchanged. Animated mask strokes reveal its fill;
  they are not visible strokes. The mask is removed after completion to avoid
  even the one-channel antialiasing differences introduced by compositing.
- Native SVG animation, no runtime dependencies, no animation library, no
  embedded raster. Unsupported SVG animation leaves the completed mask visible.
- Reduced motion shows the static outline. The preview has a keyboard-accessible
  replay button, a no-JavaScript static fallback, and background-tab pausing.
- The site header and static `bw-clean.svg` were not changed.

## Local verification

`verify-reveal.mjs` passed against the local Astro server in installed Chromium
and WebKit. Explicit browser executable overrides were used because the cached
browser versions differ from this repository's Playwright defaults.

Checks: generated asset parity; no completed-logo flash at time zero; progressive
ink coverage at sampled times; final frame remains held; final frame exactly
matches the static outline in each browser; replay resets the SVG timeline;
reduced-motion fallback and disabled replay; no-JavaScript static preview;
no horizontal overflow at 360, 390, 768 and 1440px; standalone SVG reduced-motion
styles; no page exceptions. Examined the captured intermediate-frame contact
sheet. `verify-monogram.mjs` and `git diff --check` also pass.

The continuous-arm revision adds a raster connectivity regression check at 23
times, 0.1 seconds apart. At a 600px render every sampled visible reveal must be
one connected ink region, ignoring only isolated antialiasing specks of eight
pixels or fewer. B-to-W branch timing is derived from path length and the B's
easing curve, rather than estimated with an unrelated delay.

Evidence: `/tmp/bw-reveal-qa` (initial Chromium run),
`/tmp/bw-reveal-qa-webkit` (WebKit run).
Physical phones, production deployment, and future header integration were not
tested. Background-tab pausing is implemented in the preview, not inside a
standalone SVG image document.

For eventual integration, inline SVG gives the host control over replay,
visibility, and motion preferences. Namespace the SVG IDs if mounting more than
one inline copy. For an external image, use a picture/static-source fallback for
reduced motion and a new image URL identity when an explicit replay is needed;
WebKit may retain a completed cached image timeline. Do not hide the only static
fallback while waiting for JavaScript.
