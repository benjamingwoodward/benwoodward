/** Fixed blade and load share a floor; only the sprung cab moves independently. */
export function PusherArtwork() {
  return (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <g data-push-part="push-vehicle">
        {/* Two units at this scale match the helicopter's 1.6-unit line weight. */}
        <g transform="translate(218 234) scale(0.8)" strokeWidth="2">
          <path d="M-168-36h123a18 18 0 0 1 0 36h-123a18 18 0 0 1 0-36Z" fill="var(--secondary)" />
          <path
            data-push-part="push-treads"
            d="M-168-31h123a13 13 0 0 1 0 26h-123a13 13 0 0 1 0-26Z"
            strokeDasharray="3 7"
          />
          {[-163, -106, -49].map((x) => (
            <circle key={x} cx={x} cy="-18" r="8" fill="var(--background)" />
          ))}
          <g data-push-part="push-body">
            <path d="M-172-47h136l11 11h-154z" fill="var(--background)" />
            <path d="M-165-67h21v20h-21z" fill="var(--secondary)" />
            <path d="M-144-112h48l17 25v40h-65z" fill="var(--background)" />
            <path d="M-149-119h58l7 7h-65z" fill="var(--secondary)" />
            <path d="M-136-104h35l14 21v20h-49z" fill="var(--secondary)" />
            <path d="M-109-104v41M-132-54h8" />
            <path d="M-79-77h36l15 14v16h-51z" fill="var(--palette-lime-light)" />
            <path d="M-67-65v10m9-10v10m9-10v10M-48-77v-20h7" />
          </g>
          {/* Fixed links reach the blade; its face stays aligned with the bag. */}
          <path d="m-56-30 45 12 2-8-45-12z" fill="var(--secondary)" />
          <path d="M-48-61-11-46" />
          <path d="m-49-64 20 8-3 7-20-8z" fill="var(--background)" />
          <path
            data-push-part="push-blade"
            d="M-10-66H-1v63h-9C-20-23-20-45-10-66Z"
            fill="var(--secondary)"
          />
        </g>
      </g>
    </g>
  );
}
