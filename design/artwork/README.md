# Purposeful machinery contact sheet

The homepage uses five custom machines: transaction inspection, merchant docking, mail handling, water measurement and prototype assembly. Artwork and choreography live in `src/components/machines/purposeful-machines.tsx` and `purposeful-motion.ts`. Each scene plays once for four seconds, then rests. Linked cards replay on hover or keyboard focus.

Run from the personal repository: `node node_modules/vite/bin/vite.js --config design/artwork/vite.config.mjs`. Open `http://127.0.0.1:4322/` for the isolated contact sheet. It adds no public Astro route and is excluded from the production build.

With the main Astro preview on port 4321, run `npm run test:art`. `CHROMIUM_PATH` selects an installed Chromium; `BRAND_BROWSER=webkit WEBKIT_PATH=...` selects WebKit. The suite samples 101 poses per scene, verifies attachments and rendered stroke widths, finite playback, responsive layouts, static fallbacks and the intro-to-hero handoff.

The Pureflow video and hackathon photographs are intentionally confined to the timeline, keeping the work cards consistent. Operator is a read-only reference; provenance is documented in `ASSET_PROVENANCE.md`.
