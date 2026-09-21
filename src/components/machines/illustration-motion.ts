import { startMotion } from "./motion";
export type IllustrationTrack = (name: string, frames: Keyframe[]) => void;

export function startIllustrationMotion(
  root: SVGSVGElement,
  attribute: string | readonly string[],
  compose: (track: IllustrationTrack) => void,
  options: { duration?: number; responsive?: boolean; initialTime?: number } = {},
) {
  const attributes = typeof attribute === "string" ? [attribute] : attribute;
  return startMotion(root, animate => compose((name, frames) => {
    const part = root.querySelector(attributes.map(key => `[${key}="${name}"]`).join(","));
    if (part) animate(part, frames, options.duration);
  }), options.initialTime ?? 3600);
}
