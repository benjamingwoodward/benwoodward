/**
 * Where a visit goes after it is described.
 *
 * Every sink is optional and activates purely by the presence of its env
 * vars, so the site works unconfigured (logs only) and gains durability
 * the moment a store is attached — no code change.
 */

export type Visit = {
  ts: number;
  sentence: string;
  ip: string;
  place: string;
  client: string;
  path: string;
  referrer: string | null;
  // Added later, so rows stored before then simply lack them.
  id?: string;
  /** Foreground milliseconds, reported by the page as it goes; null until the first report. */
  duration?: number | null;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

const LIST_KEY = "visits";
const KEEP = 1000;
// Durations live in their own keys so a list row never has to be rewritten;
// they expire on their own long after the list would have dropped the visit.
const DURATION_KEY = (id: string) => `visit:dur:${id}`;
const DURATION_TTL = String(90 * 24 * 3600);

function env(...names: string[]) {
  for (const name of names) {
    // Vercel injects real env vars; a local .env only reaches import.meta.env.
    const value = process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name];
    if (value) return value;
  }
  return undefined;
}

/** Vercel's Upstash integration injects KV_*; a direct Upstash project injects UPSTASH_*. */
function redis() {
  const url = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
  const token = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  return url && token ? { url, token } : null;
}

async function command(body: unknown, path = "/pipeline") {
  const conn = redis();
  if (!conn) return null;

  const res = await fetch(conn.url + path, {
    method: "POST",
    headers: {
      authorization: `Bearer ${conn.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  return res.json();
}

export function hasStore() {
  return redis() !== null;
}

export async function recordVisit(visit: Visit) {
  // Always: readable in Vercel → Logs, but only for an hour on Hobby.
  console.log(visit.sentence);

  // Sinks are independent — a dead webhook must not lose the stored row.
  const results = await Promise.allSettled([
    command([
      ["LPUSH", LIST_KEY, JSON.stringify(visit)],
      ["LTRIM", LIST_KEY, "0", String(KEEP - 1)],
    ]),
    notify(visit.sentence),
  ]);

  for (const result of results) {
    // A failed sink is worth knowing about but never worth failing the request.
    if (result.status === "rejected") console.error("visit sink failed:", result.reason);
  }
}

/** The page reports cumulative foreground time, so the latest value wins. */
export async function recordDuration(id: string, ms: number) {
  await command([["SET", DURATION_KEY(id), String(Math.round(ms)), "EX", DURATION_TTL]]);
}

/** Slack and Discord both accept a bare {text}/{content} JSON post. */
async function notify(sentence: string) {
  const hook = env("VISITS_WEBHOOK_URL");
  if (!hook) return null;

  const payload = hook.includes("discord.com")
    ? { content: sentence }
    : { text: sentence };

  const res = await fetch(hook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`webhook ${res.status}`);
  return null;
}

export async function readVisits(limit = 200): Promise<Visit[]> {
  const body = (await command(
    [["LRANGE", LIST_KEY, "0", String(limit - 1)]],
  )) as Array<{ result?: string[]; error?: string }> | null;

  const rows = body?.[0]?.result ?? [];
  const visits = rows.flatMap((row) => {
    try {
      return [JSON.parse(row) as Visit];
    } catch {
      return [];
    }
  });

  const ids = visits.map((v) => v.id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return visits;

  const durations = (await command(
    [["MGET", ...ids.map(DURATION_KEY)]],
  )) as Array<{ result?: Array<string | null> }> | null;
  const byId = new Map(ids.map((id, i) => [id, durations?.[0]?.result?.[i] ?? null]));

  return visits.map((v) => {
    const raw = v.id ? byId.get(v.id) : null;
    const ms = raw == null ? null : Number(raw);
    return { ...v, duration: Number.isFinite(ms as number) ? ms : null };
  });
}
