import { SupportArm } from "./bento-machine-arm.tsx";
import { Pivot, Wheel } from "./bento-machine-parts.tsx";
export type MachineKind = "lamp" | "crane" | "arm" | "press" | "conveyor";

function Lamp() {
  return (
    <>
      <path
        d="M22 169h231M40 163c0-8 16-15 39-15s39 7 39 15v4H40zM67 150v-10h22v10"
        fill="var(--bento-machine-paper)"
      />
      <path d="M43 161c13 5 53 6 72 0M104 157h5" />
      <g transform="translate(78 143)">
        <g data-part="lamp-lower">
          <path d="M-4 0l-35-53 8-5L4-4z" fill="var(--bento-machine-paper)" />
          <path d="M-8-16l-2-7-8-3 2-7-8-3 2-7-8-3-1-6" />
          <Pivot radius={7} />
          <g transform="translate(-33 -54)">
            <g data-part="lamp-upper">
              <path d="M-4-2l54-55 7 7L3 4z" fill="var(--bento-machine-paper)" />
              <path d="M11-9l7-4 1-7 7-1 1-7 7-1 1-7 7-1 5-7" />
              <Pivot radius={6} />
              <g transform="translate(54 -53)">
                <g data-part="lamp-head">
                  <path d="M0 0l14-9 6 9-12 8z" fill="var(--bento-machine-shade)" />
                  <path d="M17-6c10-5 17-1 23 5l19 26-45 16-1-32z" fill="var(--cobalt)" />
                  <path d="M23 0l3 4M29-1l3 4M36 3l3 4" />
                  <ellipse
                    cx="37"
                    cy="29"
                    rx="24"
                    ry="5"
                    transform="rotate(-19 37 29)"
                    fill="var(--bento-machine-paper)"
                  />
                  <path d="M29 32c2 7 11 6 14-3" />
                  <path d="m29 46-1 8m15-13 3 7m12-11 6 5" opacity="0.5" />
                  <Pivot radius={4} />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
      <path
        data-part="lamp-paper"
        d="M170 166v-34h48l8 7v27zM217 132v9h9M178 147h27m-27 7h18"
        fill="var(--bento-machine-paper)"
      />
    </>
  );
}

function Crane() {
  return (
    <>
      <path d="M11 169h256M42 52h18v112H42zM42 80h18m-18 28h18m-18 28h18M42 52l18 28-18 28 18 28-18 28M46 39V25l5-8 5 8v14M51 10v7" />
      <path d="M34 164h34v5H34z" fill="var(--bento-machine-paper)" />
      <path d="M12 39h244v13H12zM12 52l24-13 24 13 24-13 24 13 24-13 24 13 24-13 24 13 24-13 24 13M51 17 12 39M51 17l180 22" />
      <path
        d="M12 56h22v17H12zM15 64h16M63 55h23v24H63zM66 58h17v12H66zM65 75h19M70 79v6h9v-6"
        fill="var(--bento-machine-paper)"
      />
      <path
        d="M105 151h48v15h-48zM111 146h36v5h-36zM211 149h45v17h-45zM216 157h35"
        fill="var(--bento-machine-shade)"
      />
      <g transform="translate(184 55)">
        <g data-part="crane-trolley">
          <path d="M-10-4h20v8h-20z" fill="var(--cobalt)" />
          <Pivot x={-6} y={-5} radius={3} />
          <Pivot x={6} y={-5} radius={3} />
          <path data-part="crane-cable" d="M0 4v63" />
          <g data-part="crane-hook" transform="translate(0 67)">
            <path d="M0 0v5c7 0 6 8 0 8" />
          </g>
        </g>
      </g>
      <g transform="translate(184 145)">
        <g data-part="crane-module">
          <path d="m-15 3 15-13 15 13" />
          <rect x="-22" y="3" width="44" height="18" rx="2" fill="var(--cobalt)" />
          <path d="M-22 11h44" />
        </g>
      </g>
    </>
  );
}

function Press() {
  return (
    <>
      <path
        d="M13 169h253M31 166V73h21v93M216 166V73h22v93M26 166h31m155 0h31"
        fill="var(--bento-machine-shade)"
      />
      <path d="M52 131h164M57 56V18h145v38M65 25h129M65 33h129" fill="var(--bento-machine-paper)" />
      <rect x="27" y="51" width="211" height="52" rx="8" fill="var(--bento-machine-paper)" />
      <path d="M50 66h163v16H50z" fill="var(--bento-machine-shade)" />
      <Wheel part="press-left-roller" x={43} y={78} radius={10} />
      <Wheel part="press-right-roller" x={222} y={78} radius={10} />
      <rect
        data-part="press-slot"
        x="76"
        y="91"
        width="106"
        height="6"
        rx="3"
        fill="currentColor"
      />
      <svg
        data-part="press-output"
        x="81"
        y="94"
        width="96"
        height="66"
        viewBox="0 0 96 66"
        overflow="hidden"
      >
        <g data-part="press-sheet">
          <path d="M0-4h96v66H0z" fill="var(--bento-machine-paper)" />
          <rect x="10" y="10" width="76" height="30" rx="2" fill="var(--cobalt)" />
          <path d="M17 35l16-16 16 12 11-7 17 11M11 48h52m-52 7h37" />
          <circle cx="69" cy="18" r="3" />
        </g>
      </svg>
      <path d="M78 94h102" />
      <circle cx="200" cy="94" r="2" fill="var(--cobalt)" />
    </>
  );
}

function Conveyor() {
  return (
    <>
      <path d="M10 169h257M29 153v14m14-14v14m183-14v14m14-14v14" />
      <rect
        data-part="belt-deck"
        x="16"
        y="127"
        width="247"
        height="27"
        rx="13.5"
        fill="var(--bento-machine-paper)"
      />
      <path d="M57 135v9m36-9v9m36-9v9m36-9v9m36-9v9" />
      <Wheel part="belt-left" x={31} y={140} radius={8} />
      <Wheel part="belt-right" x={248} y={140} radius={8} />
      <path d="M176 28h60v107h-14V42h-46zM208 42l14 18" fill="var(--bento-machine-paper)" />
      <rect
        data-part="stamp-mount"
        x="218"
        y="127"
        width="19"
        height="21"
        fill="var(--bento-machine-shade)"
      />
      <path d="M226 65v45" />
      <circle cx="228" cy="133" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="228" cy="142" r="1.5" fill="currentColor" stroke="none" />
      <Pivot x={228} y={35} radius={3} />
      <path d="M183 42h23v27h-23zM180 39h29v6h-29z" fill="var(--bento-machine-shade)" />
      <g data-part="stamp-head" transform="translate(0 -24)">
        <path d="M190 68h7v24h-7zM169 111h50v8h-50z" fill="var(--bento-machine-shade)" />
        <path d="M176 92h36v19h-36z" fill="var(--bento-machine-paper)" />
        <path d="M181 101h26" />
      </g>
      <g data-part="belt-card">
        <g transform="translate(194 107)">
          <rect x="-15" width="30" height="20" rx="2" fill="var(--bento-machine-shade)" />
          <g data-part="stamp-result">
            <rect x="-15" width="30" height="20" rx="2" fill="var(--cobalt)" />
            <path d="m-6 10 4 4 9-9" strokeWidth="2" />
          </g>
        </g>
      </g>
      <path d="M27 124v-29h35v29M31 103h27m-27 9h27" fill="var(--bento-machine-paper)" />
    </>
  );
}

const MACHINES = { lamp: Lamp, crane: Crane, arm: SupportArm, press: Press, conveyor: Conveyor };
export function BentoMachine({ kind }: { kind: MachineKind }) {
  const Machine = MACHINES[kind];
  return (
    <svg
      className={`bento-machine bento-machine-${kind}`}
      data-machine-kind={kind}
      viewBox="0 0 280 169"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <Machine />
      </g>
    </svg>
  );
}
