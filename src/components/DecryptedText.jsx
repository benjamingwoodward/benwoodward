import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import FuzzyText from "./FuzzyText.jsx";

const defaultCharacters =
  ".:-=+*#%@";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const smoothstep = (edge0, edge1, value) => {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);

  return amount * amount * (3 - 2 * amount);
};

const styles = {
  wrapper: {
    display: "inline-block",
    whiteSpace: "pre-wrap",
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    border: 0,
  },
};

export default function DecryptedText({
  text = "",
  speed = 80,
  characters = defaultCharacters,
  revealDirection = "end",
  useOriginalCharsOnly = false,
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  hiddenClassName = "",
  animateOn = "scroll",
  mode = "disappear",
  fuzzyBeforeDecrypt = false,
  fuzzyAfterDecrypt = false,
  fuzzyProps = {},
  scrollSelector = "[data-ascii-hero]",
  introScrollShare = 0.24,
  disappearStart = 0.08,
  disappearEnd = 0.86,
  ...props
}) {
  const [progress, setProgress] = useState(0);
  const [tick, setTick] = useState(0);

  const availableChars = useMemo(() => {
    if (useOriginalCharsOnly) {
      return Array.from(new Set(text.split(""))).filter((char) => char !== " ");
    }

    return characters.split("");
  }, [characters, text, useOriginalCharsOnly]);

  const orderedIndices = useMemo(() => {
    const indices = text
      .split("")
      .map((char, index) => ({ char, index }))
      .filter(({ char }) => char !== " ")
      .map(({ index }) => index);

    if (revealDirection === "start") return indices;
    if (revealDirection === "center") {
      const middle = Math.floor(indices.length / 2);
      const ordered = [];

      for (let offset = 0; ordered.length < indices.length; offset += 1) {
        const next = offset % 2 === 0
          ? middle + offset / 2
          : middle - Math.ceil(offset / 2);

        if (indices[next] !== undefined) ordered.push(indices[next]);
      }

      return ordered;
    }

    return indices.reverse();
  }, [revealDirection, text]);

  useEffect(() => {
    if (animateOn !== "scroll") return undefined;

    let frame = 0;

    const syncProgress = () => {
      frame = 0;
      const section = document.querySelector(scrollSelector);

      if (!section) return;

      const start = section.offsetTop;
      const end = section.offsetTop + section.offsetHeight - window.innerHeight;
      const scrollProgress = end <= start
        ? 0
        : clamp((window.scrollY - start) / (end - start), 0, 1);
      const introProgress = smoothstep(
        0,
        1,
        clamp(scrollProgress / introScrollShare, 0, 1),
      );

      setProgress(smoothstep(disappearStart, disappearEnd, introProgress));
    };

    const queueProgress = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncProgress);
    };

    syncProgress();
    window.addEventListener("scroll", queueProgress, { passive: true });
    window.addEventListener("resize", queueProgress);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueProgress);
      window.removeEventListener("resize", queueProgress);
    };
  }, [animateOn, disappearEnd, disappearStart, introScrollShare, scrollSelector]);

  useEffect(() => {
    const shouldAnimate =
      animateOn === "scroll" &&
      ((mode === "reveal" && progress < 1) ||
        (mode !== "reveal" && progress > 0 && progress < 1));

    if (!shouldAnimate) return undefined;

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, speed);

    return () => window.clearInterval(interval);
  }, [animateOn, mode, progress, speed]);

  const scrambleCount = Math.ceil(orderedIndices.length * 0.22);
  const isRevealMode = mode === "reveal";
  const vanishedCount = Math.floor(progress * orderedIndices.length);
  const revealedCount = Math.floor(progress * orderedIndices.length);
  const vanished = new Set(orderedIndices.slice(0, vanishedCount));
  const revealed = new Set(orderedIndices.slice(0, revealedCount));
  const scrambling = new Set(
    orderedIndices.slice(
      isRevealMode ? revealedCount : vanishedCount,
      (isRevealMode ? revealedCount : vanishedCount) + scrambleCount,
    ),
  );
  const showFuzzy =
    (fuzzyBeforeDecrypt && !isRevealMode && progress <= 0) ||
    (fuzzyAfterDecrypt && isRevealMode && progress >= 1);
  const showPlainText =
    (!isRevealMode && !showFuzzy && progress <= 0) ||
    (isRevealMode && !showFuzzy && progress >= 1);

  return (
    <motion.span className={parentClassName} style={styles.wrapper} {...props}>
      <span style={styles.srOnly}>{text}</span>
      {showFuzzy ? (
        <span className="decrypted-text__fuzzy" aria-hidden="true">
          <FuzzyText {...fuzzyProps}>{text}</FuzzyText>
        </span>
      ) : showPlainText ? (
        <span aria-hidden="true">{text}</span>
      ) : isRevealMode ? (
        <span aria-hidden="true">
          {text.split("").map((char, index) => {
            const isSpace = char === " ";
            const isRevealed = revealed.has(index);
            const randomIndex = Math.abs((index * 31 + tick * 17) % availableChars.length);
            const displayChar = isSpace
              ? "\u00A0"
              : isRevealed
                ? char
                : availableChars[randomIndex];

            return (
              <span
                key={`${char}-${index}`}
                className={[
                  "decrypted-text__char",
                  className,
                  !isRevealed && encryptedClassName,
                  isSpace && "decrypted-text__char--space",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {displayChar}
              </span>
            );
          })}
        </span>
      ) : (
        <span aria-hidden="true">
          {text.split("").map((char, index) => {
            const isSpace = char === " ";
            const isVanished = vanished.has(index) || progress >= 1;
            const isScrambling = !isVanished && scrambling.has(index) && progress > 0;
            const randomIndex = Math.abs((index * 31 + tick * 17) % availableChars.length);
            const displayChar = isSpace ? "\u00A0" : isScrambling ? availableChars[randomIndex] : char;

            return (
              <span
                key={`${char}-${index}`}
                className={[
                  "decrypted-text__char",
                  className,
                  isScrambling && encryptedClassName,
                  isVanished && hiddenClassName,
                  isSpace && "decrypted-text__char--space",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {displayChar}
              </span>
            );
          })}
        </span>
      )}
    </motion.span>
  );
}
