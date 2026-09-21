import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { MeshPhongMaterial } from "three";
import "./VisitorsGlobe.css";

const HOUR = 3600e3;
const RANGES = [
  { key: "1h", label: "1h", ms: HOUR },
  { key: "24h", label: "24h", ms: 24 * HOUR },
  { key: "7d", label: "7d", ms: 7 * 24 * HOUR },
  { key: "30d", label: "30d", ms: 30 * 24 * HOUR },
  { key: "all", label: "All", ms: Infinity },
];
// Anything this fresh gets a pulsing ring, like a "visitors right now" marker.
const LIVE_MS = 30 * 60e3;
const TOOLTIP_ROWS = 5;

// Palette mirrors global.css; the canvas can't read CSS variables.
const SURFACE = "#e1e5da";
const LAND = "#647762";
const ACCENT = "#ff4f1f";

// Rows arrive compact to keep the page small — see visitors.astro.
function inflate([ts, lat, lng, place, client, path, referrer, ip, duration]) {
  return { ts, lat, lng, place, client, path, referrer, ip, duration };
}

/** "48s", "1m 20s", "1h 05m" — or null when the page never reported back. */
function fmtDuration(ms) {
  if (ms == null) return null;
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return sec ? `${m}m ${String(sec).padStart(2, "0")}s` : `${m}m`;
}

/** "first visit", "2nd visit", "11th visit" — how many times this address has been here so far. */
function nthVisit(n) {
  if (n === 1) return "first visit";
  const mod100 = n % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13 ? "th"
    : n % 10 === 1 ? "st"
    : n % 10 === 2 ? "nd"
    : n % 10 === 3 ? "rd"
    : "th";
  return `${n}${suffix} visit`;
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function ago(ts, now) {
  const seconds = Math.round((now - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function plural(n, word) {
  if (n === 1) return `${n} ${word}`;
  return `${n} ${word}${word.endsWith("s") ? "es" : "s"}`;
}

// The tooltip is raw HTML and path/referrer come from the visitor's browser.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

/** One pin per location; 2 dp (~1 km) folds a city's jittery geo-IP into one. */
function cluster(visits) {
  const groups = new Map();
  for (const visit of visits) {
    if (visit.lat == null || visit.lng == null) continue;
    const key = `${visit.lat.toFixed(2)},${visit.lng.toFixed(2)}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, lat: visit.lat, lng: visit.lng, place: visit.place, visits: [] };
      groups.set(key, group);
    }
    group.visits.push(visit);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    count: group.visits.length,
    latest: group.visits[0].ts,
  }));
}

function tooltip(group, now) {
  const rows = group.visits
    .slice(0, TOOLTIP_ROWS)
    .map(
      (v) =>
        `<li><span>${ago(v.ts, now)}</span> · ${escapeHtml(v.client)} · <code>${escapeHtml(v.path)}</code>` +
        (v.referrer ? ` · from ${escapeHtml(host(v.referrer))}` : "") +
        (v.duration != null ? ` · ${fmtDuration(v.duration)}` : "") +
        `</li>`,
    )
    .join("");
  const hidden = group.count - TOOLTIP_ROWS;
  const ips = [...new Set(group.visits.map((v) => v.ip))];
  const typical = median(group.visits.map((v) => v.duration).filter((d) => d != null));

  return (
    `<div class="pin-tip">` +
    `<strong>${escapeHtml(group.place)}</strong>` +
    `<p>${plural(group.count, "visit")} · ${plural(ips.length, "address")}` +
    (typical != null ? ` · typically ${fmtDuration(typical)}` : "") +
    `</p>` +
    `<ul>${rows}</ul>` +
    (hidden > 0 ? `<p class="more">and ${plural(hidden, "more visit")}</p>` : "") +
    `<p class="ips">${ips.slice(0, 3).map(escapeHtml).join(" · ")}</p>` +
    `</div>`
  );
}

export default function VisitorsGlobe({ visits: rows }) {
  // Client time, not server time: the tab may sit open for a while.
  const [now] = useState(() => Date.now());
  const visits = useMemo(() => {
    const all = rows.map(inflate).sort((a, b) => a.ts - b.ts);
    // Count each address's visits oldest-first so every row knows its ordinal.
    const seen = new Map();
    for (const v of all) {
      const n = (seen.get(v.ip) ?? 0) + 1;
      seen.set(v.ip, n);
      v.nth = n;
    }
    return all.reverse();
  }, [rows]);

  const [range, setRange] = useState("24h");
  const [land, setLand] = useState([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState(null);
  const frameRef = useRef(null);
  const globeRef = useRef(null);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        RANGES.map((r) => [r.key, visits.filter((v) => now - v.ts <= r.ms).length]),
      ),
    [visits, now],
  );
  const inRange = useMemo(() => {
    const { ms } = RANGES.find((r) => r.key === range);
    return visits.filter((v) => now - v.ts <= ms);
  }, [visits, range, now]);
  const clusters = useMemo(() => cluster(inRange), [inRange]);
  const live = useMemo(
    () => clusters.filter((c) => now - c.latest <= LIVE_MS),
    [clusters, now],
  );
  const liveCount = live.reduce(
    (n, c) => n + c.visits.filter((v) => now - v.ts <= LIVE_MS).length,
    0,
  );
  const addresses = new Set(inRange.map((v) => v.ip)).size;
  const timed = inRange.map((v) => v.duration).filter((d) => d != null);
  const typicalStay = median(timed);
  const longestStay = timed.length ? Math.max(...timed) : null;

  useEffect(() => {
    fetch("/data/land-110m.geojson")
      .then((res) => res.json())
      .then((geo) => setLand(geo.features))
      .catch(() => {});
  }, []);

  // globe.gl sizes itself to the window unless told otherwise.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const globeMaterial = useMemo(
    () => new MeshPhongMaterial({ color: SURFACE, shininess: 4 }),
    [],
  );

  const aim = (target, altitude = 1.8, ms = 1200) => {
    const globe = globeRef.current;
    if (!globe || target?.lat == null) return;
    globe.pointOfView({ lat: target.lat, lng: target.lng, altitude }, ms);
  };

  const onReady = () => {
    // Dev-only handle so the globe can be driven from a test harness.
    if (import.meta.env.DEV) window.__globe = globeRef.current;
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
    }
    aim(clusters[0] ?? { lat: 30, lng: -40 }, 2.1);
  };

  // Switching ranges swings the camera to the newest pin that survives the filter.
  useEffect(() => {
    aim(clusters[0], 2.1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Hold still while a pin is under the cursor so the tooltip stays put.
  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) controls.autoRotate = !hovered;
  }, [hovered]);

  const byCount = [...clusters].sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = byCount[0]?.count ?? 1;
  const rangeLabel = RANGES.find((r) => r.key === range).label;

  return (
    <section className="live-view">
      <aside className="rail">
        <header className="panel-head">
          <h1>Visitors</h1>
          <span className={`pulse ${liveCount > 0 ? "on" : ""}`}>
            {liveCount > 0 ? `${liveCount} here in the last 30 min` : "quiet right now"}
          </span>
        </header>

        <div className="ranges" role="tablist" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.key}
              role="tab"
              type="button"
              aria-selected={range === r.key}
              className={range === r.key ? "on" : ""}
              onClick={() => setRange(r.key)}
            >
              {r.label}
              <small>{counts[r.key]}</small>
            </button>
          ))}
        </div>

        <div className="tiles">
          <Tile label="Right now" value={liveCount} note="last 30 min" />
          <Tile label="Visits" value={inRange.length} note={range === "all" ? "all time" : `last ${rangeLabel}`} />
          <Tile label="Addresses" value={addresses} note="distinct IPs" />
          <Tile label="Locations" value={clusters.length} note="on the globe" />
          <Tile
            label="Time on page"
            value={typicalStay != null ? fmtDuration(typicalStay) : "—"}
            note={timed.length ? `median of ${timed.length}` : "no reports yet"}
          />
          <Tile label="Longest stay" value={longestStay != null ? fmtDuration(longestStay) : "—"} note="in range" />
        </div>

        <section className="card">
          <h2>Visits by location</h2>
          {byCount.length === 0 ? (
            <p className="empty">No located visits in this range.</p>
          ) : (
            <ol className="bars">
              {byCount.map((c) => (
                <li key={c.key}>
                  <button type="button" onClick={() => aim(c, 1.5, 900)} onMouseEnter={() => aim(c, 1.5, 900)}>
                    <span className="bar-label">{c.place}</span>
                    <span className="bar-track">
                      <span className="bar-fill" style={{ width: `${(100 * c.count) / maxCount}%` }} />
                    </span>
                    <span className="bar-count">{c.count}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

      </aside>

      <section className="recent card">
          <h2>Recent</h2>
          {inRange.length === 0 ? (
            <p className="empty">Nothing in this range yet.</p>
          ) : (
            <ol className="feed">
              {inRange.map((v, i) => (
                <li
                  key={`${v.ts}-${v.ip}-${i}`}
                  onMouseEnter={() => aim(v, 1.5, 700)}
                  className={v.lat == null ? "unlocated" : ""}
                >
                  <p className="sentence">
                    {v.place} · {v.client}
                    {v.path !== "/" && <> · <code>{v.path}</code></>}
                    {v.referrer ? <> · from {host(v.referrer)}</> : null}
                  </p>
                  <p className="meta">
                    <time dateTime={new Date(v.ts).toISOString()}>{ago(v.ts, now)}</time>
                    <span>{nthVisit(v.nth)}</span>
                    {v.duration != null && <i>stayed {fmtDuration(v.duration)}</i>}
                    {v.lat == null && <em>no coordinates</em>}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

      <div className="stage">
        <div className="globe-frame" ref={frameRef}>
          {size.width > 0 && (
            <Globe
              ref={globeRef}
              width={size.width}
              height={size.height}
              backgroundColor="rgba(0,0,0,0)"
              globeMaterial={globeMaterial}
              showAtmosphere
              atmosphereColor={LAND}
              atmosphereAltitude={0.18}
              hexPolygonsData={land}
              hexPolygonResolution={3}
              hexPolygonMargin={0.55}
              hexPolygonUseDots
              hexPolygonColor={() => LAND}
              pointsData={clusters}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => ACCENT}
              pointAltitude={(c) => 0.012 + 0.006 * Math.log2(c.count)}
              pointRadius={(c) => 0.7 + 0.18 * Math.log2(c.count)}
              pointsTransitionDuration={600}
              pointLabel={(c) => tooltip(c, now)}
              onPointHover={setHovered}
              ringsData={live}
              ringLat="lat"
              ringLng="lng"
              ringColor={() => (t) => `rgba(255, 79, 31, ${1 - t})`}
              ringMaxRadius={3}
              ringPropagationSpeed={1.2}
              ringRepeatPeriod={1200}
              onGlobeReady={onReady}
            />
          )}
        </div>
        <div className="legend" aria-hidden="true">
          <span><i className="dot" /> visit</span>
          <span><i className="ring" /> last 30 min</span>
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value, note }) {
  return (
    <div className="tile">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {note && <span className="note">{note}</span>}
    </div>
  );
}
