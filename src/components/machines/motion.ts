/** Shared lifecycle for native SVG animations. Static markup is always the fallback. */
export type Animate = (element: Element, frames: Keyframe[], duration?: number) => void;

/** One action, then a complete resting composition. Never restarts on scrolling. */
export function startFiniteMotion(root: Element, compose: (animate: Animate) => void, replayLink?: HTMLAnchorElement | null) {
  if (typeof root.animate !== "function" || typeof IntersectionObserver === "undefined") return null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
  let animations: Animation[] = [];
  let visible = false;
  let completed = false;
  let disposed = false;
  const cancel = () => { animations.forEach(animation => animation.cancel()); animations = []; };
  const animate: Animate = (element, frames, duration = 4000) => {
    const animation = element.animate(frames, { duration, iterations: 1, fill: "both" });
    animation.pause();
    animation.currentTime = 0;
    animations.push(animation);
  };
  function sync() {
    if (disposed) return;
    if (reduced.matches) { completed = true; cancel(); root.setAttribute("data-playback", "static"); return; }
    if (completed) return;
    const running = visible && !document.hidden && document.documentElement.dataset.motion !== "paused";
    // Prepare the starting pose while the island is still just outside view,
    // then run only after meaningful visibility. Avoid a final-to-start flash.
    if (!animations.length) {
      try { compose(animate); }
      catch (error) { cancel(); completed = true; console.error("Using static illustration.", error); return; }
      const current = animations;
      void Promise.all(current.map(animation => animation.finished)).then(() => {
        if (disposed || animations !== current) return;
        completed = true;
        root.setAttribute("data-playback", "finished");
      }).catch(() => {});
    }
    const clock = document.timeline.currentTime;
    for (const animation of animations) {
      if (animation.playState === "finished") continue;
      if (!running) {
        const time = animation.currentTime;
        animation.pause();
        // Resolve a pending pause at the captured frame in both engines.
        if (time !== null) animation.currentTime = time;
      }
      else if (animation.playState !== "running") {
        const time = Number(animation.currentTime ?? 0);
        animation.play();
        if (typeof clock === "number") animation.startTime = clock - time;
      }
    }
    root.setAttribute("data-playback", animations.length ? (running ? "playing" : "paused") : "static");
  }
  const replay = () => {
    if (!completed || !visible || reduced.matches || document.hidden) return;
    completed = false;
    cancel();
    sync();
  };
  const onHover = () => { if (hover.matches) replay(); };
  let observer: IntersectionObserver;
  const observe = () => {
    observer?.disconnect();
    const header = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
    const cliff = document.querySelector(".rock-transition")?.getBoundingClientRect().height ?? 0;
    observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting && entry.intersectionRatio >= .35; sync(); }, { threshold: [0, .35], rootMargin: `-${Math.ceil(header + cliff)}px 0px 0px 0px` });
    observer.observe(root);
  };
  observe();
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("site-motion-change", sync);
  window.addEventListener("resize", observe);
  replayLink?.addEventListener("pointerenter", onHover);
  replayLink?.addEventListener("focus", replay);
  sync();
  return { replay, dispose() {
    disposed = true;
    observer.disconnect();
    reduced.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("site-motion-change", sync);
    window.removeEventListener("resize", observe);
    replayLink?.removeEventListener("pointerenter", onHover);
    replayLink?.removeEventListener("focus", replay);
    cancel();
  } };
}

export function startMotion(root: Element, compose: (animate: Animate) => void, initialTime = 0) {
  if (typeof root.animate !== "function" || typeof IntersectionObserver === "undefined") return null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animations: Animation[] = [];
  let visible = false;
  const paused = () => document.documentElement.dataset.motion === "paused";
  const animate: Animate = (element, frames, duration = 12000) => {
    const animation = element.animate(frames, { duration, iterations: Infinity, fill: "both" });
    animation.pause();
    animation.currentTime = initialTime;
    animations.push(animation);
  };
  const cancel = () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
  };
  function sync() {
    if (reduced.matches) { cancel(); return; }
    if (!animations.length) {
      try { compose(animate); }
      catch (error) { cancel(); console.error("Illustration unavailable; using static artwork.", error); return; }
    }
    const running = visible && !document.hidden && !paused();
    const clock = document.timeline.currentTime;
    for (const animation of animations) {
      if (!running) animation.pause();
      else if (animation.playState !== "running") {
        const time = Number(animation.currentTime ?? initialTime);
        animation.play();
        if (typeof clock === "number") animation.startTime = clock - time;
      }
    }
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; sync(); });
  observer.observe(root);
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("site-motion-change", sync);
  sync();
  return { refresh() {
    if (!animations.length) return;
    // Recalculate travel bounds without restarting the shared story clock.
    compose((element, frames) => {
      const animation = animations.find(item => item.effect instanceof KeyframeEffect && item.effect.target === element);
      if (animation?.effect instanceof KeyframeEffect) animation.effect.setKeyframes(frames);
    });
  }, dispose() {
    observer.disconnect();
    reduced.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("site-motion-change", sync);
    cancel();
  } };
}
