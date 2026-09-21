# Opening sequence and SEO — 2026-09-20

## Delivered

Latest identity/copy revision: every displayed name, accessible brand name, title, description, author/site-name field, manifest, SVG title and social image now uses **Ben Woodward**. The Person record uses `name: "Ben Woodward"`, `givenName: "Ben"` and `familyName: "Woodward"`; the WebSite name and H1 match. Removed the redundant alternate-name field. Existing profile URLs and the X creator handle remain unchanged to preserve their real destinations. The title is concise: “Ben Woodward | Founder & Operator.” Copy describes the Pureflow founder background separately from the current Coverage GM role, without implying he founded Coverage or Redo. No keyword repetition, hidden SEO text or fabricated claims were added.

The Pureflow entrance is now lazy inline media with a responsive static fallback, not a modal. It plays only its existing entrance and holds the final frame; neither exit media nor additional autoplaying loops are loaded. The user-facing media caption is supplied by the adjacent software chapter, with a descriptive image alternative for assistive technology.

Latest presentation exception: the footer is now charcoal with white text and a white BW reveal. The main page remains black text on white, with black controls on orange. The intro/SEO text-color assertions explicitly verify both surface treatments. The new client-side age counter leaves the supplied birth date in static HTML; no build-time age total is cached into the page.

- Orange opening sequence: centered black BW reveal (2.4s), helicopter arrival and hook lowering, then a 2.8s tug and banked lift of the panel. Total ~6.35s, replayed on every load/reload without session suppression. No name/role copy in the intro. Subtle ShapeWaves are progressively enhanced with WebGPU, lazy-loaded and disposed on exit.
- No visible Skip button, as requested. Escape still exits. Reduced motion, direct anchor navigation, back/forward and unsupported animation APIs bypass it; reloading an anchor URL replays it. No JavaScript leaves content visible. An independent 8s watchdog prevents script failure from trapping the page. Leaving the tab dismisses it.
- Approved BW header mark. Orange-only transparent favicon; the separate Apple home-screen icon uses white. All HTML text is black; formerly dark text panels are light. Intro artwork is pure black. Photography/video content is unchanged.
- Updated title/description, consistent Open Graph/Twitter metadata, and a new 1200×630 social image. Preserved all qualifications: $750M is business-line worth, $500M+ is GMV, $1.04M is annual run-rate.
- ProfilePage now references its required mainEntity Person. Removed the favicon-as-portrait. Social profiles come from the same content record as the footer.
- Preserved absolute canonical URL, static HTML, public indexing, semantic headings, local fonts, responsive images, explicit dimensions and below-fold lazy loading. Removed obsolete keywords metadata.
- Sitemap contains only the public homepage, with the actual local revision date and without priority/frequency guesses.
- Private visitors page remains authenticated, noindex and no-store. Its unconfigured 404 now explicitly carries those headers. Robots does not block that URL, allowing crawlers to observe noindex.
- Brand preview HTML remains noindex. `vercel.json` adds noindex response headers to `/brand/*`; this hosting rule needs verification after deployment (Astro dev does not emulate it).
- The follow-up texture adds pinned `vgpu@0.5.0`; no new application route, backend service, external font or tracking event. Hero H1 is “Ben Woodward,” with founder/GM details below; metadata now consistently uses the same preferred name.

## Local evidence

Baseline and final Astro check/build passed. This runtime has no npm executable, so the underlying package commands were invoked directly with bundled Node: `node node_modules/astro/bin/astro.mjs check` and `... build`, with telemetry disabled. Check: zero errors/warnings and two existing hints (`grant` and SVG-test DOM type inference). Build retains the existing private-globe large-chunk warning; that chunk does not load on the homepage.

`scripts/verify-intro-seo.mjs` passed in installed Chromium and WebKit: centered logo/exit sequence, one initial hit, session suppression, button-free intro, black text/artwork, focus containment/Escape, five widths (360/390/768/1024/1440), short mobile viewport, reduced motion/change events, no JS, blocked storage, missing animation API, intentionally missing body script/watchdog, SSR metadata/schema, image dimensions/alt, private noindex, sitemap/robots, transparent orange-only favicon, social-image dimensions and no page exceptions.

The existing `scripts/verify-browser.mjs` passed all 16 groups again: navigation, galleries, Pureflow, machinery, responsive/zoom reflow, synthetic private-dashboard login/empty/error/filter states, and duration tracking. Desktop/mobile intro and social-card screenshots were inspected. `git diff --check` passes.

Evidence folders: `/tmp/bw-intro-seo-chromium`, `/tmp/bw-intro-seo-webkit`, `/tmp/benwoodward-qa`. No physical-phone or full screen-reader audit is claimed. No deployment, commit or push performed.

## Tradeoff and remaining work

A full-screen intro delays visual access on every load/reload despite server-rendered HTML. It may worsen perceived speed/LCP and is not an SEO advantage. The requested sequence has fallbacks, but those do not erase the interstitial tradeoff. For maximum page-experience performance, omit it or use an inline logo reveal.

After deployment: confirm canonical-host redirects and response headers, run the public URL through Rich Results Test/PageSpeed Insights, submit the sitemap through the owner's Search Console, and monitor real Core Web Vitals and indexing. These deployed/account-level checks were not performed. No ranking improvement, rich-result outcome or field-performance score is claimed.

## Sources

- [Google: concise titles and consistent prominent headings](https://developers.google.com/search/docs/appearance/title-link)
- [Google: consistent site names](https://developers.google.com/search/docs/appearance/site-names)
- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: ProfilePage data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Google: noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: intrusive interstitials](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials)
- [Vercel: header configuration](https://vercel.com/docs/project-configuration/vercel-json)
