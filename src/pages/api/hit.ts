import type { APIRoute } from "astro";
import { clientIp, describeClient, describePlace } from "../../lib/visitor";
import { recordVisit } from "../../lib/visits";

// One of only two server-rendered routes; everything else stays static.
export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const { headers } = request;

  let path = "/";
  try {
    const body = await request.json();
    if (typeof body?.path === "string") path = body.path;
  } catch {
    // Beacon sent nothing parseable — the visit still counts.
  }

  const ip = clientIp(headers, clientAddress);
  const place = describePlace(headers);
  const client = describeClient(headers.get("user-agent"));
  const referrer = headers.get("referer");

  const sentence =
    `Visitor from ${place} (${ip}) opened ${path} using ${client}` +
    (referrer ? `, arriving from ${referrer}` : "") +
    ".";

  await recordVisit({
    ts: Date.now(),
    sentence,
    ip,
    place,
    client,
    path,
    referrer,
  });

  // Nothing to say back to the browser.
  return new Response(null, { status: 204 });
};
