export function Pivot({ x = 0, y = 0, radius = 5 }: { x?: number; y?: number; radius?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill="var(--bento-machine-paper)" />
      <circle cx={x} cy={y} r={1.4} fill="currentColor" stroke="none" />
    </g>
  );
}
export function Wheel({
  part,
  x,
  y,
  radius = 11,
}: {
  part: string;
  x: number;
  y: number;
  radius?: number;
}) {
  return (
    <g transform={`translate(${String(x)} ${String(y)})`}>
      <circle r={radius + 2} fill="var(--bento-machine-paper)" />
      <g data-part={part}>
        <path
          d={`M0-${String(radius)}V0l${String(radius * 0.866)} ${String(radius * 0.5)}M0 0l-${String(radius * 0.866)} ${String(radius * 0.5)}`}
        />
        <circle r="2" fill="var(--cobalt)" />
      </g>
    </g>
  );
}
export function Packet({ part, x, y }: { part?: string; x: number; y: number }) {
  return (
    <g transform={`translate(${String(x)} ${String(y)})`}>
      <g data-part={part}>
        <rect x="-15" width="30" height="20" rx="2" fill="var(--cobalt)" />
        <path d="m-14 2 14 10L14 2" />
      </g>
    </g>
  );
}
