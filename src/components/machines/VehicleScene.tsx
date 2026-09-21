import { useEffect, useRef } from "react";
import { HelicopterArtwork } from "./cash-helicopter";
import { PusherArtwork } from "./cash-pusher-artwork";
import { ForkliftArtwork } from "./cash-forklift-artwork";
import { CashPallet } from "./cash-pallet";
import { startCashCycle } from "./cash-cycle-motion";

export default function VehicleScene() {
  const root = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const scene = root.current;
    if (!scene) return;
    const resize = () => {
      const { width, height } = scene.getBoundingClientRect();
      if (!width || !height) return;
      // The illustration can rise above its road strip, so this tighter world
      // height makes the machinery unmistakably large even on narrow phones.
      // y=234.8 is the visible tire/pallet edge including its SVG stroke.
      const floor = 234.8;
      const worldHeight = 180;
      const worldWidth = width / height * worldHeight;
      const loadPosition = width < 640 ? 0.60 : 0.70;
      scene.setAttribute("viewBox", `${257 - worldWidth * loadPosition} ${floor - worldHeight} ${worldWidth} ${worldHeight}`);
    };
    resize();
    let motion: ReturnType<typeof startCashCycle> = null;
    const start = () => {
      if (document.documentElement.dataset.intro || motion) return;
      motion = startCashCycle(scene);
    };
    // Observe the gate itself, including watchdog/error exits and early dismissal.
    const entrance = new MutationObserver(start);
    entrance.observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro"] });
    start();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      resize();
      motion?.refresh();
    }) : null;
    observer?.observe(scene);
    return () => { entrance.disconnect(); observer?.disconnect(); motion?.dispose(); };
  }, []);
  return (
    <svg ref={root} className="vehicle-scene" viewBox="-50 54.8 540 180" preserveAspectRatio="xMidYMax meet" fill="none" aria-hidden="true" focusable="false">
      <g data-cycle-part="cargo"><g data-cycle-part="cargo-swing"><CashPallet /></g></g>
      <g data-cycle-part="helicopter" visibility="hidden"><HelicopterArtwork sharedCargo /></g>
      <g data-cycle-part="bulldozer"><g transform="translate(-10.2 0)"><PusherArtwork /></g></g>
      <g data-cycle-part="forklift" visibility="hidden"><ForkliftArtwork /></g>
    </svg>
  );
}
