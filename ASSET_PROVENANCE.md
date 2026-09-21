# Asset provenance

The construction illustrations in `src/components/machines/` were copied and adapted from the owner's local Operator repository on 2026-09-20, as requested for this site.

- Helicopter, bulldozer, forklift, pallet, money bag, and vehicle choreography: `operator/packages/ui/src/cash-*.tsx` and `cash-*-motion.ts`.
- Crane, robotic arm, press, conveyor, lamp, and their choreography: `operator/apps/marketing/app/bento-machine*.tsx` and `bento-machine-motion.ts`.
- Headline-mounted tower crane: `operator/apps/marketing/app/hero-headline.tsx`. Its 12-second lift/travel/lower loop is adapted to land on the actual “e” and “n” in “Ben,” using local font metrics rather than fixed coordinates for Operator's word “Build.”
- Local lifecycle wrappers add viewport/tab pausing, user motion control, reduced-motion/static fallbacks, deterministic opening, and container-relative travel. No Operator business logic or runtime package is imported.
- TWK Lausanne 300, 400, and 400 Italic: copied from `operator/apps/marketing/public/fonts/`. These are supplied licensed font assets, not open-source fonts. No separate license document was present beside the supplied files; this copy does not grant additional font rights.
- Biography, achievements, photographs, Pureflow videos, and social destinations come from this site's original content. Image derivatives and the new social preview are generated locally.
- The current GM of Coverage role and business-line worth of $750M were supplied by the owner in this task. The worth figure is not presented as revenue, GMV, or a personally generated result.
- The owner clarified that he took over Coverage rather than founding it or Redo. Founder background is separate from this GM role. His preferred public name is Ben Woodward; existing social handles remain unchanged.

No Operator product/customer demo screens or third-party icon libraries were copied.

## Purposeful machinery and age timeline

- `purposeful-machines.tsx` and `purposeful-motion.ts` implement the new work scenes locally: an inspection conveyor, cartridge-docking arm, mail machine, water-measurement instrument and prototype bench. The first replacement drafts were retired.
- The docking arm adapts this repository's existing Operator-derived `SupportArm` and `Pivot` geometry: tapered links, cast base, joints and wrist. Its cartridge, socket, locking action and finite choreography are local additions. The other four scenes and the timeline's small arm/parcel drawings are locally authored, using the established palette, material treatment and stroke rules.
- The five work cards use machinery only. The actual Pureflow preview and hackathon photographs remain in the age timeline.
- The timeline's arm/parcel drawings were subsequently removed from the page at the owner's request; only photographs and the actual Pureflow preview remain there. All photo-collage layouts are CSS, using the same supplied images without generative edits.
- The local contact sheet and geometry tests add no public route. No Operator files were edited during this implementation.

## BW identity

- The dark footer layout, rounded white-panel edge and rolling age-counter presentation are adapted from Operator marketing's `globals.css`, `site-footer-mark.tsx`, `hero-payments.tsx` and `sliding-number.tsx` as read-only references. The local “Seconds building” counter uses actual elapsed seconds, not Operator's demo revenue algorithm. Native animations retain the source's 520ms easing, right-to-left 54ms stagger and 105% vertical travel. No Next.js runtime code or dependencies were introduced.
- `FooterMark.astro` reuses the approved local BW reveal geometry with unique SVG IDs and native, visibility-controlled animation. The original intro/standalone assets are unchanged.

- The BW monogram was reconstructed as original local SVG geometry from the
  owner's selected image-generated concept, then refined with their feedback.
- `public/brand/bw-reveal.svg` is an original two-stroke masked reveal of that
  approved outline. Its one-shot 2.4-second growth timing is inspired by
  `operator/apps/marketing/public/media/operator-hexagon-reveal.svg`; no Operator
  logo paths, morph keyframes, or React/Next.js components were copied.

## Intro texture

- `src/components/effects/ShapeWaves.jsx` and its CSS are the React Bits component supplied by the owner. Copyright David Haz; the complete MIT + Commons Clause license is retained in `src/components/effects/REACT_BITS_LICENSE.md` (source: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md).
- Adaptations: explicit 2D mask-texture kind for pinned `vgpu@0.5.0` and a configurable DPR cap. The brief intro remains capped at 1×; the persistent hero field renders at up to 2× on high-density displays. The local wrappers use no text cutout, low-contrast colors, no interaction or glow, and a center fade to keep primary content clear.
- The effect is dynamically imported only during an active supported intro and unmounted on close/page exit. Unsupported WebGPU keeps the solid orange backdrop; reduced-motion visits bypass the intro altogether.
