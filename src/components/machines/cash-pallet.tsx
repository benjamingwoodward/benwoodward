import { MoneyBag } from "./cash-money-bag.tsx";

/** One physical load shared by every delivery and collection. */
export function CashPallet() {
  return (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m207 221 50-68 50 68" />
      <g transform="translate(257 165)">
        <MoneyBag />
        <path data-cycle-part="load-handle" d="M-6 0v-6a6 6 0 0 1 12 0v6" strokeWidth="1.8" />
      </g>
      <path d="M211 225h8v6h-8zM253 225h8v6h-8zM295 225h8v6h-8z" fill="var(--secondary)" />
      <path data-cycle-part="pallet-deck" d="M207 221h100v4H207z" fill="var(--background)" />
      <path d="M207 231h100v3H207z" fill="var(--background)" />
    </g>
  );
}
