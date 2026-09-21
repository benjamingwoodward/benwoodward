// Operator's marketing headline crane; landing points follow this headline's letters.
import { useEffect, useRef } from "react";
import { startMotion, type Animate } from "./motion";

export default function HeadlineCrane() {
  const root = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const scene = root.current;
    if (!scene) return;
    const word = scene.closest<HTMLElement>(".headline-build");
    const canvas = document.createElement("canvas").getContext("2d");
    if (!word || !canvas) return;
    let disposed = false;
    let motion: ReturnType<typeof startMotion>;
    // The card crane is authored at 280×169 and scaled into this 160×100 scene.
    const hoistOrigin = { x: 184 * .58, y: 55 * .58 };
    const landing = (name: string) => {
      const letter = word.querySelector<HTMLElement>(`[data-crane-letter="${name}"]`)!;
      const style = getComputedStyle(letter);
      canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const glyph = canvas.measureText(letter.textContent ?? "");
      const rect = letter.getBoundingClientRect();
      // TextMetrics are unscaled CSS pixels; the DOM/SVG matrices include zoom.
      const glyphScale = rect.width / glyph.width;
      const baseline = word.querySelector(".headline-build-baseline")!.getBoundingClientRect().bottom;
      // Lausanne 400's n arch crowns at .322em, right of its .2825em advance
      // midpoint. Anchor to that crown so the load balances on the curve, not
      // between the left stem and arch. Font-relative units preserve zoom/resize.
      const supportX = name === "to" ? parseFloat(style.fontSize) * .322 : glyph.width * .5;
      const point = new DOMPoint(rect.left + supportX * glyphScale, baseline - glyph.actualBoundingBoxAscent * glyphScale).matrixTransform(scene.getScreenCTM()!.inverse());
      // The bottom of the moving box is 27 units below its local origin.
      return { x: point.x - hoistOrigin.x, y: point.y - hoistOrigin.y - 27 };
    };
    const compose = (animate: Animate) => {
      const from = landing("from");
      const to = landing("to");
      const raised = Math.min(from.y, to.y) - 24.5;
      // Operator-style delivery loop: lift, travel, lower, release, send the
      // empty swinging hook away, return to collect, and bring the box home.
      const offsets = [0, .07, .16, .29, .37, .45, .54, .63, .72, .79, .86, .94, 1];
      const trolley = [from.x, from.x, from.x, to.x, to.x, to.x, from.x, from.x, to.x, to.x, to.x, from.x, from.x];
      const cable = [from.y, from.y, raised, raised, to.y, raised, raised, raised, raised, to.y, raised, raised, from.y];
      const move = (selector: string, transforms: string[], phases = offsets, easing = "cubic-bezier(.45, 0, .55, 1)") => {
        const element = scene.querySelector(selector);
        if (element) animate(element, transforms.map((transform, index) => ({ transform, offset: phases[index], easing })));
      };
      move(".headline-crane-hoist", trolley.map(x => `translateX(${x}px)`));
      move(".crane-cable", cable.map(y => `scaleY(${y / 44})`));
      move(".crane-load", cable.map(y => `translateY(${y}px)`));
      // The carried box is nested under this pendulum, so it follows the hook
      // through every sway instead of sliding independently across the page.
      move(
        ".crane-swing",
        [0, 0, 6, -4, 2, 0, 0, -12, 8, -4, 10, -6, 0, 0, -6, 4, -1.5, 0].map(angle => `rotate(${angle}deg)`),
        [0, .16, .20, .29, .34, .37, .45, .49, .58, .62, .67, .75, .79, .86, .89, .94, .97, 1],
        "cubic-bezier(.37, 0, .63, 1)",
      );
      const fade = (selector: string, values: number[], phases: number[]) => {
        const element = scene.querySelector(selector);
        if (element) animate(element, values.map((opacity, index) => ({ opacity, offset: phases[index], easing: "linear" })));
      };
      const handoff = [0, .369, .37, .789, .79, 1];
      fade(".headline-crane-payload-attached", [1, 1, 0, 0, 1, 1], handoff);
      fade(".headline-crane-payload-resting", [0, 0, 1, 1, 0, 0], handoff);
    };
    const resize = () => {
      const from = landing("from");
      const to = landing("to");
      // Reduced-motion/API fallbacks also rest on a real letter after fonts load.
      scene.querySelector(".headline-crane-hoist")!.setAttribute("transform", `translate(${from.x} 0)`);
      scene.querySelector(".crane-cable")!.setAttribute("transform", `scale(1 ${from.y / 44})`);
      scene.querySelector(".crane-load")!.setAttribute("transform", `translate(0 ${from.y})`);
      scene.querySelector(".headline-crane-payload-resting")!.setAttribute("transform", `translate(${to.x} ${to.y})`);
      motion?.refresh();
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      resize();
      motion = startMotion(scene, compose);
      observer?.observe(word);
    });
    return () => { disposed = true; observer?.disconnect(); motion?.dispose(); };
  }, []);
  return (
    <svg ref={root} className="headline-crane" viewBox="0 0 160 100" fill="none" aria-hidden="true" focusable="false">
      <g transform="scale(.58)" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M42 52h18v112H42zM42 80h18m-18 28h18m-18 28h18M42 52l18 28-18 28 18 28-18 28M46 39V25l5-8 5 8v14M51 10v7" />
        <path d="M34 164h34v5H34z" fill="var(--bento-machine-paper)" />
        <path d="M12 39h244v13H12zM12 52l24-13 24 13 24-13 24 13 24-13 24 13 24-13 24 13 24-13 24 13M51 17 12 39M51 17l180 22" />
        <path d="M12 56h22v17H12zM15 64h16M63 55h23v24H63zM66 58h17v12H66zM65 75h19M70 79v6h9v-6" fill="var(--bento-machine-paper)" />
      </g>
      <g transform="translate(106.72 31.9)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g className="headline-crane-hoist" transform="translate(3 0)">
          <path d="M-5-2h10v4H-5z" fill="currentColor" />
          <circle cx="-3" cy="-3" r="2" fill="currentColor" />
          <circle cx="3" cy="-3" r="2" fill="currentColor" />
          <g className="crane-swing">
            <path className="crane-cable" transform="scale(1 1.2)" d="M0 0v44" stroke="currentColor" strokeWidth="1.3" />
            <g className="crane-load" transform="translate(0 52.8)">
              <path className="crane-hook" d="M0 0v3c6 0 5 6 0 6" stroke="currentColor" strokeWidth="1.3" />
              <g className="headline-crane-payload-attached">
                <path d="M-7 14l7-5 7 5" stroke="currentColor" strokeWidth="1.3" />
                <rect className="headline-crane-box" x="-9" y="14" width="18" height="13" rx="1" stroke="currentColor" strokeWidth=".85" />
                <path d="M-3 14v13M3 14v13M-9 18h18" stroke="currentColor" strokeWidth=".6" opacity=".55" />
              </g>
            </g>
          </g>
        </g>
        <g className="headline-crane-payload-resting" transform="translate(3 52.8)" opacity="0">
          <path d="M-7 14l7-5 7 5" stroke="currentColor" strokeWidth="1.3" />
          <rect className="headline-crane-box" x="-9" y="14" width="18" height="13" rx="1" stroke="currentColor" strokeWidth=".85" />
          <path d="M-3 14v13M3 14v13M-9 18h18" stroke="currentColor" strokeWidth=".6" opacity=".55" />
        </g>
      </g>
    </svg>
  );
}
