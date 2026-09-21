export function MoneyBag() {
  return (
    <g transform="scale(0.7)">
      <path
        data-cash-part="bag-body"
        d="M-12 7C-20 21-45 26-52 45c-3 8-4.8 13-4.8 20 0 11 13.8 15 28.8 15h56c16 0 28-3 28-15 0-10-4-18-8-26C39 25 21 21 12 7Z"
        fill="var(--palette-lime-light)"
        strokeWidth="1.6"
      />
      <path
        d="M-12 13c-3 10-9 17-17 24M12 13c3 10 9 17 16 23M-43 58c-4 8-3 12 5 15m77-25c5 9 7 16 4 23"
        strokeWidth="1"
        strokeOpacity="0.65"
      />
      <path d="M-31 74c8 2 16 2 23 2m25 0 14-1" strokeWidth="0.8" strokeOpacity="0.4" />
      <text x="0" y="64" fontSize="44" textAnchor="middle" fill="currentColor" stroke="none">
        $
      </text>
      <path
        d="m-11 5-9-15q10-7 20-1 12-6 20 1L11 5Z"
        fill="var(--palette-lime-light)"
        strokeWidth="1.4"
      />
      <path d="M-10-7-4 3M9-7 4 3" strokeWidth="0.9" />
      <path d="M-13 2q13 2 26 0v5q-13 2-26 0z" fill="var(--background)" strokeWidth="1.3" />
      <path
        d="M4 5c4-6 10-5 9-1-1 3-6 2-9 1m0 0c-3-5-8-4-7-1 1 2 4 2 7 1m2 2 7 8m-9-8-3 9"
        strokeWidth="1"
      />
    </g>
  );
}
