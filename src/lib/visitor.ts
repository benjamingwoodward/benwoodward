/**
 * Turns Vercel's edge geo headers + user agent into a sentence a human
 * can read at a glance in the Runtime Logs.
 */

// Vercel sends region codes ("TX"), not names. Intl handles countries but
// not subdivisions, so the common ones are spelled out here and anything
// else falls through as its raw code.
const REGIONS: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "Washington DC",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  ON: "Ontario", QC: "Quebec", BC: "British Columbia", AB: "Alberta",
  MB: "Manitoba", SK: "Saskatchewan", NS: "Nova Scotia",
  NB: "New Brunswick", NL: "Newfoundland",
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string) {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export type Place = {
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  /** "Austin, Texas, United States" — skipping whatever Vercel couldn't resolve. */
  place: string;
};

function coordinate(value: string | null) {
  if (value == null) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** City arrives percent-encoded ("San%20Francisco"); a malformed one is worth less than no city. */
function decodeCity(raw: string | null) {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function parsePlace(headers: Headers): Place {
  const city = decodeCity(headers.get("x-vercel-ip-city"));
  const regionCode = headers.get("x-vercel-ip-country-region");
  const countryCode = headers.get("x-vercel-ip-country");

  // A named region reads well ("Austin, Texas"). A bare code does not, so
  // it only earns its place when there is no city to carry the detail.
  const regionName = regionCode ? REGIONS[regionCode] : null;
  const region =
    regionName && regionName !== city ? regionName
    : !city && regionCode ? regionCode
    : null;

  const country = countryCode ? countryName(countryCode) : null;
  const parts = [city, region, country].filter(Boolean);

  return {
    city,
    region,
    country,
    lat: coordinate(headers.get("x-vercel-ip-latitude")),
    lng: coordinate(headers.get("x-vercel-ip-longitude")),
    place: parts.length ? parts.join(", ") : "an unknown location",
  };
}

export function describePlace(headers: Headers) {
  return parsePlace(headers).place;
}

/** "Chrome on macOS" — enough to recognise yourself in the log, no more. */
export function describeClient(ua: string | null) {
  if (!ua) return "an unknown client";

  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "an unknown browser";

  const os =
    /iPhone|iPad/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Windows/.test(ua) ? "Windows"
    : /Linux/.test(ua) ? "Linux"
    : null;

  return os ? `${browser} on ${os}` : browser;
}

/** First entry of x-forwarded-for is the real client; the rest are proxies. */
export function clientIp(headers: Headers, fallback?: string) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? fallback ?? "unknown IP";
}
