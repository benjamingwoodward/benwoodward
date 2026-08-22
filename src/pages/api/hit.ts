import type { APIRoute } from "astro";
import { clientIp, describeClient, parsePlace } from "../../lib/visitor";
import { recordDuration, recordVisit } from "../../lib/visits";

// One of only two server-rendered routes; everything else stays static.
export const prerender = false;

/** Hostname with any leading "www." dropped, or null if it isn't a URL at all. */
function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const { headers } = request;

  let path = "/";
  let referrer: string | null = null;
  let id: string | undefined;
  try {
    const body = await request.json();

    // Ids are client-made, so only a plain token is allowed into a key name.
    if (typeof body?.id === "string" && /^[A-Za-z0-9-]{8,64}$/.test(body.id)) id = body.id;

    // A later report of how long the tab stayed open: update, never re-record —
    // even a malformed one must not masquerade as a fresh visit.
    if (body && typeof body === "object" && "duration" in body) {
      const ms = body.duration;
      if (id && typeof ms === "number" && ms >= 0 && ms <= 86_400_000) {
        await recordDuration(id, ms).catch((error) =>
          console.error("duration sink failed:", error),
        );
      }
      return new Response(null, { status: 204 });
    }

    if (typeof body?.path === "string") path = body.path;
    // The Referer header on a beacon is the page that sent it, so the page
    // passes document.referrer instead — and its own pages say nothing.
    if (typeof body?.referrer === "string" && body.referrer) referrer = body.referrer;
  } catch {
    // Beacon sent nothing parseable — the visit still counts.
  }
  if (referrer && hostOf(referrer) === hostOf(request.url)) referrer = null;

  const ip = clientIp(headers, clientAddress);
  const { place, city, region, country, lat, lng } = parsePlace(headers);
  const client = describeClient(headers.get("user-agent"));

  const sentence =
    `Visitor from ${place} (${ip}) opened ${path} using ${client}` +
    (referrer ? `, arriving from ${referrer}` : "") +
    ".";

  await recordVisit({
    id,
    ts: Date.now(),
    sentence,
    ip,
    place,
    client,
    path,
    referrer,
    lat,
    lng,
    city,
    region,
    country,
  });

  // Nothing to say back to the browser.
  return new Response(null, { status: 204 });
};
