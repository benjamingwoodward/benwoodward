import { useEffect, useRef } from "react";
import { startFiniteMotion } from "./motion";

export default function TimelineDetail({ kind }: { kind: "arm" | "parcel" }) {
  const root = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = startFiniteMotion(element, animate => {
      const track = (name: string, frames: Keyframe[]) => { const part = element.querySelector(`[data-detail="${name}"]`); if (part) animate(part, frames, 2600); };
      if (kind === "arm") {
        track("shoulder", [{ transform: "rotate(48deg)", offset: 0, easing: "cubic-bezier(.4,0,.2,1)" }, { transform: "rotate(0deg)", offset: .7 }, { transform: "rotate(0deg)", offset: 1 }]);
        track("elbow", [{ transform: "rotate(-80deg)", offset: 0, easing: "cubic-bezier(.4,0,.2,1)" }, { transform: "rotate(0deg)", offset: .8 }, { transform: "rotate(0deg)", offset: 1 }]);
      } else {
        track("left-flap", [{ transform: "rotate(-100deg)", offset: 0 }, { transform: "rotate(0deg)", offset: .35 }, { transform: "rotate(0deg)", offset: 1 }]);
        track("right-flap", [{ transform: "rotate(100deg)", offset: 0 }, { transform: "rotate(100deg)", offset: .15 }, { transform: "rotate(0deg)", offset: .5 }, { transform: "rotate(0deg)", offset: 1 }]);
        track("parcel", [{ transform: "translateX(-30px)", offset: 0 }, { transform: "translateX(-30px)", offset: .55, easing: "cubic-bezier(.4,0,.2,1)" }, { transform: "translateX(0px)", offset: 1 }]);
      }
    });
    return () => motion?.dispose();
  }, [kind]);
  return <svg ref={root} className={`timeline-detail detail-${kind}`} viewBox="0 0 260 170" fill="none" aria-hidden="true" focusable="false">
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {kind === "arm" ? <>
        <path d="M36 149H222M67 147L73 135H109L115 147ZM79 135V124H103V135" fill="var(--bento-machine-paper)" />
        <g transform="translate(91 123)"><g data-detail="shoulder"><path d="M-7 4L-39-53L-32-62L-23-57L7-4Z" fill="var(--bento-machine-paper)" />
          <g transform="translate(-30 -55)"><g data-detail="elbow"><path d="M0-7H65L80-3V3L65 7H0Z" fill="var(--bento-machine-paper)" /><path d="M17-3H54V3H17Z" fill="var(--accent)" /><circle r="7" fill="var(--bento-machine-paper)" /><circle r="1.4" fill="currentColor" stroke="none" /><rect x="70" y="-5" width="13" height="10" rx="2" fill="var(--bento-machine-shade)" /><path d="M76 5V18M69 18H83V29M69 18V29" /></g></g><circle r="8" fill="var(--bento-machine-paper)" /><circle r="1.4" fill="currentColor" stroke="none" /></g></g>
      </> : <>
        <path d="M30 126L36 120H236V133L230 139H30Z" fill="var(--bento-machine-shade)" /><path d="M30 126H230V139H30ZM44 139V154H53V139M207 139V154H216V139" fill="var(--bento-machine-paper)" />
        {[46, 74, 102, 130, 158, 186, 214].map(x => <circle key={x} cx={x} cy="132.5" r="3.5" />)}
        <g data-detail="parcel"><path d="M120 81L129 74H183V118L174 125H120Z" fill="var(--bento-machine-shade)" /><rect x="120" y="81" width="54" height="44" fill="var(--bento-machine-paper)" /><path d="M120 81L129 74H183L174 81M174 81L183 74" /><path d="M141 81L150 74H162L153 81V95H141Z" fill="var(--accent)" />
          <g transform="translate(120 81)"><path data-detail="left-flap" d="M0 0H27" /></g>
          <g transform="translate(174 81)"><path data-detail="right-flap" d="M0 0H-27" /></g>
          <path d="M157 113H165M157 117H165" />
        </g>
      </>}
    </g>
  </svg>;
}
