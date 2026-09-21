type AnimatePart = (element: Element, frames: Keyframe[], duration?: number) => void;
type Pose = { at: number; x: number; y: number };
const rotate = (value: number) => `rotate(${String(value)}deg)`;
const translate = (x: number, y = 0) => `translate(${String(x)}px, ${String(y)}px)`;

// Solve the two rigid links around their actual SVG joint centers. The wrist stays level.
function armAngles(x: number, y: number) {
  const dx = x - 53;
  const dy = y - 138;
  const elbow = Math.acos(
    Math.max(-1, Math.min(1, (dx * dx + dy * dy - 78 * 78 - 92 * 92) / (2 * 78 * 92))),
  );
  const shoulder = Math.atan2(dy, dx) - Math.atan2(92 * Math.sin(elbow), 78 + 92 * Math.cos(elbow));
  return [(shoulder * 180) / Math.PI, (elbow * 180) / Math.PI] as const;
}
const ARM_POSES: readonly Pose[] = [
  { at: 0, x: 115, y: 80 },
  { at: 0.06, x: 132, y: 108 },
  { at: 0.1, x: 132, y: 108 },
  { at: 0.16, x: 132, y: 72 },
  { at: 0.23, x: 196, y: 72 },
  { at: 0.29, x: 217, y: 108 },
  { at: 0.33, x: 217, y: 108 },
  { at: 0.38, x: 194, y: 78 },
  { at: 0.46, x: 115, y: 80 },
  { at: 1, x: 115, y: 80 },
];
function sampleArm(time: number): Pose {
  let previous = ARM_POSES[0];
  if (!previous) throw new Error("Missing arm rest pose");
  for (const next of ARM_POSES.slice(1)) {
    if (time <= next.at) {
      const t = (time - previous.at) / (next.at - previous.at);
      const eased = t * t * (3 - 2 * t);
      return {
        at: time,
        x: previous.x + (next.x - previous.x) * eased,
        y: previous.y + (next.y - previous.y) * eased,
      };
    }
    previous = next;
  }
  return previous;
}

export function animateBentoMachine(card: Element, animate: AnimatePart) {
  const kind = card.querySelector("[data-machine-kind]")?.getAttribute("data-machine-kind");
  const duration = kind === "conveyor" ? 4000 : 12000;
  const part = (name: string, frames: Keyframe[], origin = "0px 0px") => {
    const element = card.querySelector<SVGElement>(`[data-part="${name}"]`);
    if (!element) return;
    element.style.transformOrigin = origin;
    animate(element, frames, duration);
  };
  const track = (name: string, values: string[], offsets: number[], origin?: string) => {
    part(
      name,
      values.map((transform, index) => ({
        transform,
        offset: offsets[index] ?? 1,
        easing: "ease-in-out",
      })),
      origin,
    );
  };
  if (kind === "lamp") {
    const times = [0, 0.12, 0.22, 0.34, 0.46, 0.56, 0.7, 1];
    track("lamp-lower", [0, 20, 28, 38, 28, 34, 0, 0].map(rotate), times);
    track("lamp-upper", [0, 8, 10, 6, 10, 8, 0, 0].map(rotate), times);
    track("lamp-head", [0, -16, -24, -36, -24, -30, 0, 0].map(rotate), times);
  } else if (kind === "crane") {
    const times = [0, 0.08, 0.16, 0.3, 0.36, 0.48, 0.56, 0.62, 0.7, 0.8, 0.88, 0.96, 1];
    const xs = [0, 0, 0, -55, -55, 0, 0, 0, 0, -55, 0, 0, 0];
    const ys = [67, 67, 41, 45, 48, 41, 67, 67, 32, 32, 32, 67, 67];
    track(
      "crane-trolley",
      xs.map((x) => translate(x)),
      times,
    );
    track(
      "crane-cable",
      ys.map((y) => `scaleY(${String((y - 4) / 63)})`),
      times,
      "0px 4px",
    );
    track(
      "crane-hook",
      ys.map((y) => translate(0, y)),
      times,
    );
    track(
      "crane-module",
      xs.map((x, i) => (i <= 7 ? translate(0) : translate(x, (ys[i] ?? 67) - 67))),
      times,
    );
  } else if (kind === "arm") {
    // Dense samples keep the packet at the gripper through curved multi-joint motion.
    const poses = Array.from({ length: 241 }, (_, i) => sampleArm(i / 240));
    const angles = poses.map((pose) => armAngles(pose.x, pose.y));
    part(
      "arm-shoulder",
      angles.map(([shoulder], i) => ({ transform: rotate(shoulder), offset: i / 240 })),
    );
    part(
      "arm-elbow",
      angles.map(([, elbow], i) => ({ transform: rotate(elbow), offset: i / 240 })),
    );
    part(
      "arm-wrist",
      angles.map(([shoulder, elbow], i) => ({
        transform: rotate(-shoulder - elbow),
        offset: i / 240,
      })),
    );
    part(
      "arm-packet",
      poses.map((pose) => ({
        transform:
          pose.at < 0.1 || pose.at >= 0.97
            ? translate(-85)
            : pose.at <= 0.33
              ? translate(pose.x - 217, pose.y - 108)
              : translate(0),
        opacity: pose.at < 0.9 || pose.at >= 0.99 ? 1 : Math.max(0, (0.95 - pose.at) / 0.05),
        offset: pose.at,
      })),
    );
  } else if (kind === "press") {
    const times = [0, 0.06, 0.14, 0.26, 0.34, 0.88, 0.94, 1];
    part(
      "press-sheet",
      [-66, -66, -42, -13, 0, 0, -66, -66].map((y, i) => ({
        transform: translate(0, y),
        opacity: i === 6 || i === 7 || i === 0 ? 0 : 1,
        offset: times[i] ?? 1,
        easing: "ease-in-out",
      })),
    );
    track("press-left-roller", [0, 0, 90, 270, 360, 360, 360, 360].map(rotate), times);
    track("press-right-roller", [0, 0, -90, -270, -360, -360, -360, -360].map(rotate), times);
  } else if (kind === "conveyor") {
    const times = [0, 0.04, 0.26, 0.3, 0.35, 0.41, 0.46, 0.78, 0.86, 1];
    track(
      "belt-card",
      [-115, -115, 0, 0, 0, 0, 0, 60, 60, -115].map((x) => translate(x)),
      times,
    );
    part(
      "belt-card",
      [0, 1, 1, 1, 1, 1, 1, 1, 0, 0].map((opacity, i) => ({ opacity, offset: times[i] ?? 1 })),
    );
    part("stamp-result", [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: 0.36 },
      { opacity: 1, offset: 0.39 },
      { opacity: 1, offset: 0.86 },
      { opacity: 0, offset: 0.9 },
      { opacity: 0, offset: 1 },
    ]);
    track("belt-left", [0, 0, 180, 180, 180, 180, 180, 360, 360, 360].map(rotate), times);
    track("belt-right", [0, 0, 180, 180, 180, 180, 180, 360, 360, 360].map(rotate), times);
    track(
      "stamp-head",
      [-24, -24, -24, -24, -12, -12, -24, -24, -24, -24].map((y) => translate(0, y)),
      times,
    );
  }
}
