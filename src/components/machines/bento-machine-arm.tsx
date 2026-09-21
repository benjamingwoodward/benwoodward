import { Packet, Pivot } from "./bento-machine-parts.tsx";

export function SupportArm() {
  return (
    <>
      <path
        d="M14 169h249M25 167l7-12h49l9 12M35 155v-13h34v13M40 141v-7h23v7"
        fill="var(--bento-machine-paper)"
      />
      {[132, 217].map((x) => (
        <g key={x} transform={`translate(${String(x)} 0)`}>
          <path d="M-18 157h36l5 10h-46z" fill="var(--bento-machine-shade)" />
          <path d="M-18 150h36v7h-36z" fill="var(--bento-machine-paper)" />
        </g>
      ))}
      <Packet part="arm-packet" x={217} y={130} />
      <g transform="translate(53 138)">
        <g data-part="arm-shoulder" transform="rotate(-111.7121)">
          <path d="M0-10h64l15 5v10l-15 5H0z" fill="var(--bento-machine-paper)" />
          <Pivot radius={11} />
          <g transform="translate(78 0)">
            <g data-part="arm-elbow" transform="rotate(120.7589)">
              <path d="M-3-8h82l11 5v6l-11 5H-3z" fill="var(--bento-machine-paper)" />
              <path d="M17-4h42v8H17z" fill="var(--cobalt)" />
              <Pivot radius={9} />
              <g transform="translate(92 0)">
                <g data-part="arm-wrist" transform="rotate(-9.0468)">
                  <rect
                    x="-9"
                    y="-6"
                    width="18"
                    height="12"
                    rx="3"
                    fill="var(--bento-machine-shade)"
                  />
                  <path d="M-3 6v6h6V6M-12 9h24M-12 9l-3 5v10h4M12 9l3 5v10h-4" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </>
  );
}
