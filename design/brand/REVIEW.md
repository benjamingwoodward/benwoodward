# BW monogram — critical review and polish

Reviewed the approved `bw-clean.svg`, preserving the regular-hexagon B counter,
continuous B-to-W diagonal, rounded corners, and short flat W peak.

## Findings and fixes

1. **Right terminal looked slightly low.** Its sharp construction tip was aligned
   with the B shoulder, but rounding placed its visible top 7.3205 units lower.
   Raised the construction tip by that amount; the visible top now aligns with
   the B's horizontal shoulder.
2. **Outside lower bends were not aligned.** The two inside bend vertices differed
   by about 4.50 units vertically. Aligned them, moving the right terminal about
   2.60 units horizontally to retain the 60° slope and 44-unit band thickness.
   The two W counter floors retain identical dimensions.
3. **Asset padding was uneven.** The prior viewBox left approximately 10/14 units
   horizontally and 23.32/20.36 vertically. Reframed around the rounded silhouette
   with 16 units on every side. This balances the asset box, not its centre of mass.
4. **The geometry generator had insufficient regression checks.** Added checks for
   fillet overlap, outline crossings, equal hexagon sides and diameters, the angle
   grid, key band weights, matched W valleys, terminal alignment, and padding.

## Deliberately retained

- The B counter uses regular-hexagon construction with equal sides and 120°
  corners. Its upper-left side is intentionally open to preserve the lowercase B;
  it is not a closed six-sided hole.
- Ten-unit fillets remain consistent. Internal and external corners produce
  different silhouettes even with the same radius; that is not a radius mismatch.
- The B ascender and connected junction make the left side visually heavier.
  This is part of the approved letter construction. Literal bilateral symmetry
  would change the mark and reduce its B readability.
- The centre W peak retains its short horizontal plateau. Its greater local
  thickness is a consequence of the meeting diagonal bands, not an accidental
  change in the straight stroke weight.

## Verification and limits

`node design/brand/verify-monogram.mjs` passes. It checks generated SVG parity,
one vector path, no raster/executable/external content, geometry assertions, and
successful rasterization at 32, 48, 64, 96, 160, 320, and 1344px wide.

Visually inspected the before/after size proof at 32–320px. At 32px the B opening
and W plateau become less distinct. Use 48px wide or larger for the full mark;
consider a separate optically simplified favicon below that size. No favicon or
site integration was performed. Contrast proof was on white; this dark-ink asset
needs a light background, or an explicitly reversed colour for dark surfaces.

`node design/brand/render-monogram-proof.mjs` regenerates the PNG preview and
before/after size proof. The pre-polish SVG is preserved in this directory.

The SVG's accessible title/description IDs are safe for external image use. If
inlining multiple copies on one page, namespace those IDs per instance or mark
decorative instances appropriately.
