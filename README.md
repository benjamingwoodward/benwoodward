# Ben Woodward

A personal portfolio built with Astro, Lausanne typography, and self-contained animated SVG machinery adapted from Operator. The public page is static HTML with small React illustration islands. The private visitor globe remains a separate, authenticated route.

## Commands

```sh
npm ci
npm run check
npm run build
npm run dev
npm run build
```

Deploy on Vercel by importing this repository and using the default Astro settings.

## Content and visuals

- `src/data/profile.ts` owns work highlights, biography, gallery captions, and social links.
- `src/components/` contains the page sections; `machines/` owns the SVG artwork and native animation lifecycle.
- `src/styles/global.css` owns the shared palette, Lausanne faces, typography, and responsive layouts.
- `src/assets/story/` holds normalized copies of the original photographs. Astro generates responsive WebP images during the build. Original public media is retained for fallback links.
- `ASSET_PROVENANCE.md` records the source of the illustrations and supplied fonts.

The header uses local SVG social icons with the existing profile destinations. The age timeline shows every supplied photo in uncropped, responsive collages; optional enlargement preserves keyboard navigation and focus return. Chapters without media are text-only, with no decorative timeline machinery.

Pureflow is a frameless inline entrance animation in the software chapter. It loads and plays once when visible, pauses offscreen/in background tabs, and holds its final frame without an exit or replay. Reduced motion, disabled JavaScript, blocked autoplay and failed media retain a responsive white-background poster. No video dialog or play button remains.

Public branding, search/social metadata, structured data, accessible names and generated assets use **Ben Woodward**. Existing social profile handles/URLs are intentionally unchanged. The hero and metadata distinguish his founder background from his current GM role at Redo; they do not claim he founded Coverage or Redo.

The charcoal footer sits beneath rounded white content corners, with social icons and a large white BW reveal that plays once when visible. The page's underlying root/body canvas is also charcoal for Safari overscroll. The hero's “Seconds building” counter measures elapsed whole seconds from March 18, 2003 at midnight UTC (a date-only assumption), recalculates from the real clock every second, and uses Operator's rolling-digit timing. No-JavaScript visits show the birth date instead of a stale number.

The hero runs one 72-second sequence, beginning with the bulldozer after the intro clears, followed by the forklift and helicopter. The six phases alternate delivery and pickup, with the complete trio repeating in opposite roles. The loading-screen helicopter is unchanged. Each purpose-built work machine plays one four-second action, then rests; existing card links support hover/focus replay. Machinery pauses outside the viewport and when the tab is hidden. Reduced-motion users and browsers without animation support get static illustrations. The public page does not load the visitor globe, Three.js, or the retired snake videos.

Every page load and reload opens with a centered black BW reveal over orange, subtle React Bits ShapeWaves, and a helicopter that flies in, hooks the bottom edge, tugs, and banks upward to lift the panel (~6.35s total). No introductory text or visible Skip button; Escape exits early. The GPU effect loads only during a supported intro and is disposed on exit. Unsupported WebGPU retains plain orange. Direct anchor navigation, back/forward restores, reduced motion and no-JavaScript visits bypass the intro; reloading an anchor URL still replays it. `IntroGate.astro` provides first-paint gating and a timeout; `IntroSplash.astro` owns the animation. No session-storage gate is used. The underlying page is always server-rendered. Text is black on white/orange surfaces and white in the dark footer.

## Browser verification

```sh
npx playwright install chromium
npm run test:browser
```

The suite starts local servers on ports 4331–4333 and a disposable HTTP store with synthetic visits. It clears the visitor-service environment for its processes, tests login and dashboard states, and closes the servers afterward. It writes screenshots and results to `/tmp/benwoodward-qa` (override with `QA_OUTPUT`). `CHROMIUM_PATH` can select an already-installed test browser.

With `npm run dev` running, regenerate the social card and clean Pureflow poster using `npm run render:previews`. Set `PREVIEW_URL` if the preview is not on port 4321. This only renders local assets; it does not deploy anything.

Run `npm run test:intro-seo` against the preview for opening-sequence, fallback, metadata, schema, favicon, and text-color checks. Use `BRAND_BROWSER=webkit` and `WEBKIT_PATH` to select an installed WebKit browser. `npm run render:social` regenerates only the social image. See `SEO_REVIEW.md` for SEO scope and limits.

Run `npm run test:footer-age` for the footer reveal, UTC age arithmetic, live second ticks, digit rollover, timezone independence, responsive layouts and static fallbacks. It supports Chromium/WebKit and writes evidence to `/tmp/bio-footer-age-<engine>`.

Run `npm run test:pureflow` for visible-only media loading, one-shot playback, alpha transparency, final-frame hold, five widths and poster fallbacks. It supports Chromium/WebKit and writes evidence to `/tmp/bio-pureflow-<engine>`.

Run `npm run test:art` against the preview to sample the work machines' moving parts, stroke consistency, finite playback and static fallbacks, plus the timeline and entrance handoff. It supports the same Chromium/WebKit selection and writes evidence to `/tmp/benwoodward-art-<engine>`. The local-only art contact sheet is documented in `design/artwork/README.md`.

## Visitors

`/visitors` is a private live view of who is on the site: a globe of visitor
locations, time-range filters, durations, and a recent feed. The homepage
pings `/api/hit`, which reads Vercel's geo headers and stores the visit.

Environment variables (see `.env.example`):

- `VISITS_KEY` — the password for `/visitors`. Typed once, then remembered by
  an httpOnly cookie for six months. `/visitors?key=…` also works and is
  exchanged for the cookie.
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — injected by the Upstash Redis
  integration on Vercel. Without them visits only reach the Vercel logs.
- `VISITS_WEBHOOK_URL` — optional Slack/Discord webhook that gets each visit.
