/**
 * Access to /visitors: one shared password (VISITS_KEY), remembered in a
 * long-lived httpOnly cookie that carries a digest of it, never the password.
 */

export const SESSION_COOKIE = "visits";
const SESSION_DAYS = 180;

export function visitsSecret() {
  return process.env.VISITS_KEY ?? import.meta.env.VISITS_KEY ?? null;
}

/** SHA-256 of the secret, hex — what the cookie holds. */
export async function sessionToken(secret: string) {
  const bytes = new TextEncoder().encode(`visitors:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Same length and no early exit, so timing says nothing about how close a guess was. */
export function sameSecret(a: string, b: string) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export const sessionCookieOptions = {
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: SESSION_DAYS * 24 * 3600,
};
