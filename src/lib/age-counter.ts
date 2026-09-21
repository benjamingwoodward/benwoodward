// Date-only input from the owner: midnight UTC, not a claimed exact birth time.
export const BIRTH_EPOCH = Date.UTC(2003, 2, 18);
export const SECOND_MS = 1_000;
export function ageInSeconds(now = Date.now()) {
  return Math.max(0, Math.floor((now - BIRTH_EPOCH) / SECOND_MS));
}

/** Operator-inspired rolling digits; the total always comes from the real clock. */
export function mountAgeCounter(root: HTMLElement) {
  const value = root.querySelector<HTMLElement>("[data-age-value]");
  const accessible = root.querySelector<HTMLElement>("[data-age-accessible]");
  const live = root.querySelector<HTMLElement>("[data-age-live]");
  const fallback = root.querySelector<HTMLElement>("[data-age-fallback]");
  if (!value || !accessible || !live || !fallback) return;
  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = typeof IntersectionObserver === "undefined";
  let started = false;
  let previous = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  let animations: Animation[] = [];
  const cancel = () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
    value.querySelectorAll(".age-digit-previous").forEach(node => node.remove());
  };
  const render = (animate = false, opening = false) => {
    const seconds = ageInSeconds();
    const text = formatter.format(seconds);
    if (text === previous && !opening) return;
    cancel();
    const old = (opening ? text.replace(/\d/g, "0") : previous).padStart(text.length, " ");
    root.dataset.ageSeconds = String(seconds);
    accessible.textContent = `Seconds building: ${text}. Counting from March 18, 2003 at midnight UTC.`;
    value.replaceChildren();
    const canAnimate = animate && !reduced.matches && typeof value.animate === "function";
    let changed = 0;
    const digits = Array.from(text, (character, index) => {
      const cell = document.createElement("span");
      cell.className = /\d/.test(character) ? "age-digit" : "age-separator";
      const current = document.createElement("span");
      current.textContent = character;
      current.className = "age-digit-current";
      cell.append(current);
      return { cell, current, character, previous: old[index] ?? " " };
    });
    value.append(...digits.map(digit => digit.cell));
    // Ported from Operator marketing's sliding-number.tsx: right-to-left 54ms
    // stagger, 520ms ease-out, 105% vertical travel and the same opacity curve.
    for (const digit of [...digits].reverse()) {
      if (!canAnimate || digit.character === digit.previous || !/\d/.test(digit.character)) continue;
      const before = document.createElement("span");
      before.className = "age-digit-previous";
      before.textContent = digit.previous.trim() || "\u00a0";
      digit.cell.prepend(before);
      const timing = { duration: 520, delay: changed++ * 54, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" as const };
      try {
        animations.push(before.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-105%)", opacity: 0 }], timing));
        animations.push(digit.current.animate([{ transform: "translateY(105%)", opacity: 0 }, { opacity: 1, offset: .45 }, { transform: "translateY(0)", opacity: 1 }], timing));
      } catch { cancel(); break; } // Keep the accurate, complete number if animation fails.
    }
    previous = text;
    const currentAnimations = animations;
    if (currentAnimations.length) void Promise.all(currentAnimations.map(animation => animation.finished)).then(() => {
      if (animations === currentAnimations) cancel();
    }).catch(() => {});
  };
  const suspend = () => { clearTimeout(timer); cancel(); };
  const sync = () => {
    clearTimeout(timer);
    if (document.hidden || !visible || document.documentElement.dataset.intro) { cancel(); return; }
    const animate = document.documentElement.dataset.motion !== "paused" && !reduced.matches;
    if (!animate) cancel();
    const opening = !started;
    render(animate, opening);
    started = true;
    // Let the staggered opening finish even when it begins just before a second
    // boundary. Then catch up to the real clock; don't chop off the leading digits.
    const openingDuration = opening ? Math.max(0, ...animations.map(animation => Number(animation.effect?.getComputedTiming().endTime) || 0)) : 0;
    // Recalculate on every tick/return; never accumulate elapsed intervals.
    timer = setTimeout(sync, Math.max(openingDuration, SECOND_MS - ((Date.now() - BIRTH_EPOCH) % SECOND_MS) + 5));
  };
  render();
  live.hidden = false;
  fallback.hidden = true;
  const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    sync();
  }, { threshold: 0 });
  observer?.observe(root);
  const entrance = new MutationObserver(sync);
  entrance.observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro"] });
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("site-motion-change", sync);
  window.addEventListener("pagehide", suspend);
  window.addEventListener("pageshow", sync);
  sync();
}
