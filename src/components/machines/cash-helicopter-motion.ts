import { startIllustrationMotion, type IllustrationTrack } from "./illustration-motion.ts";

/** Converts SVG user units to screen pixels for both compact and expanded viewports. */
export function svgScreenScale(root: SVGSVGElement) {
  const matrix = root.getScreenCTM();
  const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 0;
  if (Number.isFinite(scale) && scale > 0) return scale;
  const { width } = root.getBoundingClientRect();
  return width > 0 ? width / 440 : 1;
}

/**
 * Screen position of SVG user coordinate x=0.
 *
 * This is deliberately different from the SVG viewport's left edge when the
 * mobile viewBox extends into negative x coordinates. Vehicle travel is
 * authored in the artwork's coordinate system, so its bounds must use this
 * origin rather than the element's clipped viewport rectangle.
 */
export function svgScreenOriginX(root: SVGSVGElement) {
  const matrix = root.getScreenCTM();
  if (matrix && Number.isFinite(matrix.e)) return matrix.e;
  return root.getBoundingClientRect().left;
}

export function flightBounds(root: SVGSVGElement) {
  const { x, width } = root.viewBox.baseVal;
  return {
    entry: x - 24 - 257 - 114,
    exit: x + width + 24 - 257 + 151,
  };
}

export function startCashHelicopter(root: SVGSVGElement) {
  return startIllustrationMotion(
    root,
    "data-lift-part",
    (track) => {
      composeFlight(track, flightBounds(root));
    },
    { responsive: true },
  );
}

export function composeFlight(track: IllustrationTrack, bounds: { entry: number; exit: number }) {
  const easing = "cubic-bezier(0.3, 0, 0.25, 1)";
  // Winch=(257,97); handle=(257,166). Cable63 + hook6 = payload81 - handle12.
  // Smooth sampled Bezier flight joins the vertical lift to the outbound acceleration.
  const departure = flightDeparture(bounds.exit);
  const poses = [
    { at: 0, x: bounds.entry, y: -14, cable: 16, easing },
    { at: 0.28, x: 0, y: 0, cable: 16, easing },
    { at: 0.32, x: 0, y: 0, cable: 16, easing },
    { at: 0.44, x: 0, y: 0, cable: 63, easing },
    ...departure,
    { at: 0.94, x: bounds.exit, y: -110, cable: 63, easing: "steps(1, end)" },
    { at: 0.96, x: bounds.exit, y: -110, cable: 63, easing: "steps(1, end)" },
    { at: 1, x: bounds.entry, y: -14, cable: 16, easing },
  ];
  const frames = (value: (pose: (typeof poses)[number]) => string) =>
    poses.map((pose) => ({
      offset: pose.at,
      transform: value(pose),
      easing: pose.easing,
    }));
  track(
    "flight",
    frames(({ x, y }) => `translate(${String(x)}px, ${String(y)}px)`),
  );
  track("airframe", helicopterPitchFrames());
  track(
    "payload",
    frames(({ at, x, y }) =>
      at < 0.48 || at >= 0.96
        ? `translate(${String(-x)}px, ${String(81 - y)}px)`
        : "translate(0px, 81px)",
    ),
  );
  track(
    "cable",
    frames(({ cable }) => `scaleY(${String(cable)})`),
  );
  track(
    "hook",
    frames(({ cable }) => `translateY(${String(cable)}px)`),
  );
  track(
    "rig",
    helicopterSwingFrames(false, 0.48).map(({ offset, angle }) => ({
      offset,
      transform: `rotate(${String(angle)}deg)`,
      easing: "linear",
    })),
  );
  track("bag-visibility", [
    { offset: 0, opacity: 1 },
    { offset: 0.9, opacity: 1 },
    { offset: 0.94, opacity: 0 },
    { offset: 0.96, opacity: 0 },
    { offset: 0.995, opacity: 1 },
    { offset: 1, opacity: 1 },
  ]);
  track(
    "rotor",
    Array.from({ length: 145 }, (_, index) => ({
      offset: index / 144,
      transform: `scaleX(${index % 2 === 0 ? "1" : "0.12"})`,
    })),
  );
  track("tail-rotor", [{ transform: "rotate(0deg)" }, { transform: "rotate(21600deg)" }]);
}

/** Pitch around the winch so the independently suspended cable stays attached and vertical. */
export function helicopterPitchFrames(departureAt = 0.48, departureSpan = 0.4) {
  const departure = Array.from({ length: 41 }, (_, index) => {
    const t = index / 40;
    // One continuous lean with zero angular velocity and acceleration at both ends.
    const progress = t * t * t * (10 + t * (-15 + 6 * t));
    return { at: departureAt + departureSpan * t, angle: 8 * progress, easing: "linear" };
  });
  const poses = [
    { at: 0, angle: 0 },
    { at: 0.045, angle: 8 },
    { at: 0.16, angle: 8 },
    { at: 0.26, angle: -3 },
    { at: 0.32, angle: 0 },
    ...departure,
    { at: 0.98, angle: 8 },
    { at: 1, angle: 0 },
  ];
  return poses.map((pose) => ({
    offset: pose.at,
    transform: `translateY(8px) rotate(${String(pose.angle)}deg) translateY(-8px)`,
    easing:
      "easing" in pose
        ? pose.easing
        : pose.at === 0.98
          ? "steps(1, end)"
          : "cubic-bezier(0.4, 0, 0.2, 1)",
  }));
}

/** The load lags, swings through, then settles before its next physical handoff. */
export function helicopterSwingFrames(delivery: boolean, liftAt = 0.5) {
  return Array.from({ length: 241 }, (_, index) => {
    const offset = index / 240;
    const t = delivery ? offset / 0.32 : (offset - liftAt) / 0.4;
    const angle = t > 0 && t < 1 ? 4.5 * Math.sin(2 * Math.PI * t) * Math.sin(Math.PI * t) ** 2 : 0;
    return { offset, angle, pivotY: delivery ? 125 : 97 };
  });
}

export function flightDeparture(exit: number, cable = 63, start = 0.48, span = 0.4) {
  return Array.from({ length: 41 }, (_, index) => {
    const t = index / 40;
    const u = t * t * (3 - 2 * t);
    const v = 1 - u;
    return {
      at: start + t * span,
      x: 3 * v * u * u * exit * 0.15 + u * u * u * exit,
      y: -300 * v * v * u - 360 * v * u * u - 110 * u * u * u,
      cable,
      easing: "linear",
    };
  });
}
