import {
  flightBounds,
  flightDeparture,
  helicopterPitchFrames,
  helicopterSwingFrames,
} from "./cash-helicopter-motion.ts";
import { startIllustrationMotion } from "./illustration-motion.ts";

type Vehicle = "helicopter" | "bulldozer" | "forklift";
type Pose = {
  at: number;
  x: number;
  y?: number;
  cable?: number;
  forkY?: number;
  cargoX: number;
  cargoY: number;
  easing?: string;
};
type Story = { vehicle: Vehicle; poses: Pose[] };
const EASING = "cubic-bezier(0.35, 0, 0.3, 1)";
const HOLD = "steps(1, end)";

function helicopterStory(entry: number, exit: number, delivery: boolean): Story {
  // Winch97 + cable50 + hook6 meets the load's handle at153.
  const departureAt = delivery ? 0.65 : 0.5;
  const cable = delivery ? 18 : 50;
  const departure = flightDeparture(exit, cable, departureAt, delivery ? 0.25 : 0.4);
  return {
    vehicle: "helicopter",
    poses: [
      {
        at: 0,
        x: entry,
        y: -14,
        cable: 22,
        cargoX: delivery ? entry : 0,
        cargoY: delivery ? -42 : 0,
      },
      { at: 0.28, x: 0, cable: 22, cargoX: 0, cargoY: delivery ? -28 : 0 },
      { at: 0.34, x: 0, cable: 22, cargoX: 0, cargoY: delivery ? -28 : 0 },
      { at: 0.5, x: 0, cable: 50, cargoX: 0, cargoY: 0 },
      ...(delivery
        ? [
            { at: 0.55, x: 0, cable: 50, cargoX: 0, cargoY: 0 },
            { at: 0.65, x: 0, cable: 18, cargoX: 0, cargoY: 0 },
          ]
        : []),
      ...departure.map((pose) => ({
        ...pose,
        cargoX: delivery ? 0 : pose.x,
        cargoY: delivery ? 0 : pose.y,
      })),
      {
        at: 0.98,
        x: exit,
        y: -110,
        cable,
        cargoX: delivery ? 0 : exit,
        cargoY: delivery ? 0 : -110,
        easing: HOLD,
      },
    ],
  };
}

function dozerStory(entry: number, exit: number, delivery: boolean): Story {
  return {
    vehicle: "bulldozer",
    poses: [
      { at: 0, x: entry, cargoX: delivery ? entry : 0, cargoY: 0 },
      { at: 0.28, x: 0, cargoX: 0, cargoY: 0 },
      { at: 0.4, x: 0, cargoX: 0, cargoY: 0 },
      { at: 0.88, x: delivery ? entry : exit, cargoX: delivery ? 0 : exit, cargoY: 0 },
      {
        at: 0.98,
        x: delivery ? entry : exit,
        cargoX: delivery ? 0 : exit,
        cargoY: 0,
        easing: HOLD,
      },
    ],
  };
}

function forkliftStory(entry: number, exit: number, delivery: boolean): Story {
  return {
    vehicle: "forklift",
    poses: [
      {
        at: 0,
        x: entry,
        forkY: delivery ? -30 : 0,
        cargoX: delivery ? entry : 0,
        cargoY: delivery ? -28 : 0,
      },
      { at: 0.28, x: 0, forkY: delivery ? -30 : 0, cargoX: 0, cargoY: delivery ? -28 : 0 },
      { at: 0.34, x: 0, forkY: delivery ? -30 : -2, cargoX: 0, cargoY: delivery ? -28 : 0 },
      { at: 0.5, x: 0, forkY: delivery ? -2 : -30, cargoX: 0, cargoY: delivery ? 0 : -28 },
      { at: 0.56, x: 0, forkY: delivery ? 0 : -30, cargoX: 0, cargoY: delivery ? 0 : -28 },
      { at: 0.62, x: 0, forkY: delivery ? 0 : -30, cargoX: 0, cargoY: delivery ? 0 : -28 },
      {
        at: 0.9,
        x: delivery ? entry : exit,
        forkY: delivery ? 0 : -30,
        cargoX: delivery ? 0 : exit,
        cargoY: delivery ? 0 : -28,
      },
      {
        at: 0.98,
        x: delivery ? entry : exit,
        forkY: delivery ? 0 : -30,
        cargoX: delivery ? 0 : exit,
        cargoY: delivery ? 0 : -28,
        easing: HOLD,
      },
    ],
  };
}

/** Six alternating roles share one physical load and one native animation clock. */
export function startCashCycle(root: SVGSVGElement) {
  // Start with the bulldozer delivering the load; keep delivery/pickup pairs intact.
  // Rotating by four preserves the even-delivery / odd-pickup helicopter timing.
  const firstStory = 4;
  return startIllustrationMotion(
    root,
    ["data-lift-part", "data-push-part", "data-fork-part", "data-cycle-part"],
    (track) => {
      const flight = flightBounds(root);
      const leftEntry = root.viewBox.baseVal.x - 24 - 307;
      const rightExit = root.viewBox.baseVal.x + root.viewBox.baseVal.width + 24 - 59;
      const cycle = [
        helicopterStory(flight.entry, flight.exit, true),
        dozerStory(leftEntry, rightExit, false),
        forkliftStory(leftEntry, rightExit, true),
        helicopterStory(flight.entry, flight.exit, false),
        dozerStory(leftEntry, rightExit, true),
        forkliftStory(leftEntry, rightExit, false),
      ];
      const stories = [...cycle.slice(firstStory), ...cycle.slice(0, firstStory)];
      const frames = (value: (pose: Pose, story: Story) => Keyframe) => {
        const result = stories.flatMap((story, index) =>
          story.poses.map((pose) => ({
            offset: (index + pose.at) / stories.length,
            easing: pose.easing ?? EASING,
            ...value(pose, story),
          })),
        );
        // Every preceding .98 frame is a step hold: only offscreen loads may reposition.
        const first = result[0];
        return first ? [...result, { ...first, offset: 1 }] : result;
      };
      const translate = (x: number, y = 0) => `translate(${String(x)}px, ${String(y)}px)`;
      track(
        "cargo",
        frames((pose) => ({ transform: translate(pose.cargoX, pose.cargoY) })),
      );
      track(
        "flight",
        frames((pose, story) => ({
          transform:
            story.vehicle === "helicopter"
              ? translate(pose.x, pose.y)
              : translate(flight.entry, -14),
        })),
      );
      track("airframe", [
        ...stories.flatMap((story, index) => {
          const pitch =
            story.vehicle === "helicopter"
              ? helicopterPitchFrames(index % 2 === 0 ? 0.65 : 0.5, index % 2 === 0 ? 0.25 : 0.4)
              : [{ offset: 0, transform: "rotate(0deg)", easing: HOLD }];
          return pitch
            .filter((frame) => frame.offset < 1)
            .map((frame) => ({ ...frame, offset: (index + frame.offset) / stories.length }));
        }),
        { offset: 1, transform: "rotate(0deg)" },
      ]);
      const swing = stories.flatMap((story, index) =>
        (story.vehicle === "helicopter"
          ? helicopterSwingFrames(index % 2 === 0)
          : [
              { offset: 0, angle: 0, pivotY: 97 },
              { offset: 1, angle: 0, pivotY: 97 },
            ]
        ).map((pose) => ({ ...pose, offset: (index + pose.offset) / stories.length })),
      );
      track(
        "rig",
        swing.map(({ offset, angle }) => ({
          offset,
          transform: `rotate(${String(angle)}deg)`,
          easing: "linear",
        })),
      );
      track(
        "cargo-swing",
        swing.map(({ offset, angle, pivotY }) => ({
          offset,
          transform: `translate(257px, ${String(pivotY)}px) rotate(${String(angle)}deg) translate(-257px, ${String(-pivotY)}px)`,
          easing: "linear",
        })),
      );
      track(
        "cable",
        frames((pose) => ({ transform: `scaleY(${String(pose.cable ?? 50)})` })),
      );
      track(
        "hook",
        frames((pose) => ({ transform: translate(0, pose.cable ?? 50) })),
      );
      track(
        "push-vehicle",
        frames((pose, story) => ({
          transform: translate(story.vehicle === "bulldozer" ? pose.x : leftEntry),
        })),
      );
      track(
        "push-treads",
        frames((pose, story) => ({
          strokeDashoffset:
            story.vehicle === "bulldozer" ? String(-(pose.x - leftEntry) / 0.8) : "0",
        })),
      );
      track(
        "fork-vehicle",
        frames((pose, story) => ({
          transform: translate(story.vehicle === "forklift" ? pose.x : leftEntry),
        })),
      );
      track(
        "fork-carriage",
        frames((pose) => ({ transform: translate(0, pose.forkY ?? 0) })),
      );
      for (const vehicle of ["helicopter", "bulldozer", "forklift"] as const) {
        track(
          vehicle,
          frames((_, story) => ({
            visibility: story.vehicle === vehicle ? "visible" : "hidden",
            easing: HOLD,
          })),
        );
      }
      track(
        "rotor",
        Array.from({ length: 865 }, (_, index) => ({
          offset: index / 864,
          transform: `scaleX(${index % 2 === 0 ? "1" : "0.12"})`,
        })),
      );
      track("tail-rotor", [{ transform: "rotate(0deg)" }, { transform: "rotate(129600deg)" }]);
    },
    { duration: 72000, initialTime: 0 },
  );
}
