"use client";

import { useEffect, useRef } from "react";
import { MoneyBag } from "./cash-money-bag.tsx";
import { startCashHelicopter } from "./cash-helicopter-motion.ts";

/** A decorative pickup story, with a grounded bag in its motion-free composition. */
export function CashHelicopter() {
  const root = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const motion = startCashHelicopter(root.current);
    return () => motion?.dispose();
  }, []);

  return (
    <div className="cash-helicopter-scene">
      <svg
        ref={root}
        data-slot="cash-helicopter"
        className="cash-helicopter"
        viewBox="0 0 440 236"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <HelicopterArtwork />
      </svg>
    </div>
  );
}

function Helicopter({ endpointGeometry = false }: { endpointGeometry?: boolean }) {
  return (
    <g>
      {/* CH-54-inspired raised spine and forward cab leave the lifting bay open. */}
      <path d="M-136-30l-7-29h9l15 32z" fill="var(--secondary)" />
      <path d="M-135-34-38-25-23-29h75l9 16h-88l-108-13z" fill="var(--background)" />
      <path d="M-29-29v-12l8-6h38l12 9v9z" fill="var(--secondary)" />
      <path d="M-5-47v-19H5v19" fill="var(--background)" />
      <path data-helicopter-rear-leg d="M-27-13-38 23-16-13Z" fill="var(--background)" stroke="none" />
      <path d="m-27-13-11 36m22-36-22 36M78 16v7" />
      <circle cx="-38" cy="28" r="5" fill="var(--secondary)" />
      <circle cx="78" cy="28" r="5" fill="var(--secondary)" />
      <path d="M48-25h23l22 18 5 19-9 7H48l-9-9v-24z" fill="var(--background)" />
      <path d="M48-17h20L85-3v9H48z" fill="var(--secondary)" />
      <path d="M66-17V6" />
      <path d="M48 6h47l3 6-9 7H48z" fill="var(--palette-lime-light)" />
      <path data-helicopter-center-pole d="M-9-13V3h18v-16" />
      <path d="M-11 3h22v8h-22z" fill="var(--secondary)" />
      <circle data-lift-part="winch" cx="0" cy="8" r="3" fill="var(--background)" />
      <g transform="translate(0 -69)">
        <g data-lift-part="rotor">
          {endpointGeometry
            ? <rect x="-112" y="-2" width="224" height="4" fill="var(--secondary)" />
            : <path d="M-112-2h224v4h-224z" fill="var(--secondary)" />}
        </g>
        <circle r="3" fill="var(--background)" />
      </g>
      <g transform="translate(-136 -41)">
        <g data-lift-part="tail-rotor">
          <path d="M-12 0h24M0-12v24" />
        </g>
        <circle r="2.5" fill="var(--background)" />
      </g>
    </g>
  );
}

export function HelicopterArtwork({ sharedCargo = false, endpointGeometry = false }: { sharedCargo?: boolean; endpointGeometry?: boolean } = {}) {
  return (
    <g
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(257 89)"
    >
      <g data-lift-part="flight">
        <g data-lift-part="airframe">
          <Helicopter endpointGeometry={endpointGeometry} />
        </g>
        <g transform="translate(0 8)">
          {/* This shared pivot keeps the hook and load connected during pendulum motion. */}
          <g data-lift-part="rig">
            <g data-lift-part="hoist">
              {endpointGeometry ? (
                <rect data-lift-part="cable" x="-.8" y="0" width="1.6" height={sharedCargo ? 50 : 63} fill="currentColor" stroke="none" />
              ) : <path
                data-lift-part="cable"
                d="M0 0v1"
                transform={sharedCargo ? "scale(1 50)" : "scale(1 63)"}
                strokeWidth="1.6"
                strokeLinecap="butt"
              />}
              <g
                data-lift-part="hook"
                transform={sharedCargo ? "translate(0 50)" : "translate(0 63)"}
              >
                <path d="M-2-4h4v5h-4z" fill="var(--secondary)" />
                <path data-lift-part="hook-tip" d="M0 1v1c5 0 5 5 0 4-2-1-3-2-1-4" />
              </g>
            </g>
            {!sharedCargo && (
              <g data-lift-part="payload" transform="translate(0 81)">
                <g data-lift-part="bag-visibility">
                  <MoneyBag />
                  <path data-lift-part="handle" d="M-6 0v-6a6 6 0 0 1 12 0v6" strokeWidth="1.8" />
                </g>
              </g>
            )}
          </g>
        </g>
      </g>
    </g>
  );
}
