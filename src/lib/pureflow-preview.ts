/** Play the existing entrance once; retain its final frame, never the exit clip. */
export function mountPureflowPreview(root: HTMLElement) {
  const video = root.querySelector("video");
  const sourceTemplate = root.querySelector("template");
  if (!video || !sourceTemplate || typeof IntersectionObserver === "undefined") return;
  // Keep real <source> nodes inert until needed. Empty/data-src source tags can
  // fire premature format errors in WebKit before playback is requested.
  const sources = Array.from(sourceTemplate.content.querySelectorAll("source"), source => source.cloneNode(true) as HTMLSourceElement);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let loaded = false;
  let finished = false;
  let failed = false;
  const canPlay = () => visible && !document.hidden && !reduced.matches
    && !document.documentElement.dataset.intro
    && document.documentElement.dataset.motion !== "paused" && !finished && !failed;
  const sync = () => {
    if (!canPlay()) {
      video.pause();
      if (reduced.matches) delete root.dataset.playback;
      return;
    }
    if (!loaded) {
      loaded = true;
      video.muted = true;
      video.append(...sources);
      video.load();
    }
    void video.play().catch(() => {
      // Autoplay may be blocked (e.g. Low Power Mode). Keep the finished poster.
      if (canPlay()) delete root.dataset.playback;
    });
  };
  video.addEventListener("playing", () => {
    if (canPlay()) root.dataset.playback = "playing";
    else video.pause();
  });
  video.addEventListener("pause", () => {
    if (root.dataset.playback === "playing") root.dataset.playback = "paused";
  });
  video.addEventListener("ended", () => {
    finished = true;
    root.dataset.playback = "finished";
  });
  video.addEventListener("error", () => {
    failed = true;
    video.pause();
    delete root.dataset.playback;
  });
  // With <source> alternatives, unsupported/failed formats report errors on
  // each source rather than reliably firing an error on the video itself.
  const failedSources = new Set<HTMLSourceElement>();
  sources.forEach(source => source.addEventListener("error", () => {
    failedSources.add(source);
    if (failedSources.size === sources.length) {
      failed = true;
      video.pause();
      delete root.dataset.playback;
    }
  }));
  const observer = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting && entry.intersectionRatio >= .35;
    sync();
  }, { threshold: [0, .35] });
  observer.observe(root);
  const entrance = new MutationObserver(sync);
  entrance.observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro"] });
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("site-motion-change", sync);
  window.addEventListener("pagehide", () => video.pause());
  window.addEventListener("pageshow", sync);
}
