import React, { useEffect, useRef } from "react";

export default function FuzzyText({
  children = "",
  text,
  fontSize = "1em",
  fontWeight = 400,
  fontFamily = "inherit",
  fontStyle = "inherit",
  color = "#fff",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = "horizontal",
  transitionDuration = 0,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  gradient = null,
  letterSpacing = 0,
  textPaddingStart = 2,
  textPaddingEnd = 10,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let glitchTimeoutId;
    let glitchEndTimeoutId;
    let clickTimeoutId;
    let isCancelled = false;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const init = async () => {
      const context = canvas.getContext("2d");
      if (!context) return;

      const computed = window.getComputedStyle(canvas);
      const computedFontFamily =
        fontFamily === "inherit" ? computed.fontFamily || "serif" : fontFamily;
      const computedFontStyle =
        fontStyle === "inherit" ? computed.fontStyle || "normal" : fontStyle;
      const fontSizeString = typeof fontSize === "number"
        ? `${fontSize}px`
        : /(?:em|rem|%)$/.test(fontSize)
          ? computed.fontSize
          : fontSize;
      const fontString = `${computedFontStyle} ${fontWeight} ${fontSizeString} ${computedFontFamily}`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }

      if (isCancelled) return;

      const renderedText =
        text !== undefined ? String(text) : React.Children.toArray(children).join("");
      const offscreen = document.createElement("canvas");
      const offscreenContext = offscreen.getContext("2d");
      if (!offscreenContext) return;

      offscreenContext.font = fontString;
      offscreenContext.textBaseline = "alphabetic";

      let measuredWidth = 0;
      if (letterSpacing) {
        for (const char of renderedText) {
          measuredWidth += offscreenContext.measureText(char).width + letterSpacing;
        }
        measuredWidth -= letterSpacing;
      } else {
        measuredWidth = offscreenContext.measureText(renderedText).width;
      }

      const metrics = offscreenContext.measureText(renderedText);
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight = letterSpacing
        ? measuredWidth
        : metrics.actualBoundingBoxRight ?? metrics.width;
      const actualAscent = metrics.actualBoundingBoxAscent ?? Number.parseFloat(computed.fontSize);
      const actualDescent = metrics.actualBoundingBoxDescent ?? actualAscent * 0.2;
      const textWidth = Math.ceil(letterSpacing ? measuredWidth : actualLeft + actualRight);
      const textHeight = Math.ceil(actualAscent + actualDescent);
      const offscreenWidth = textWidth + textPaddingStart + textPaddingEnd;
      const xOffset = textPaddingStart;

      offscreen.width = offscreenWidth;
      offscreen.height = textHeight;
      offscreenContext.font = fontString;
      offscreenContext.textBaseline = "alphabetic";

      if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
        const fillGradient = offscreenContext.createLinearGradient(0, 0, offscreenWidth, 0);
        gradient.forEach((stop, index) => {
          fillGradient.addColorStop(index / (gradient.length - 1), stop);
        });
        offscreenContext.fillStyle = fillGradient;
      } else {
        offscreenContext.fillStyle = color;
      }

      if (letterSpacing) {
        let x = xOffset;
        for (const char of renderedText) {
          offscreenContext.fillText(char, x, actualAscent);
          x += offscreenContext.measureText(char).width + letterSpacing;
        }
      } else {
        offscreenContext.fillText(renderedText, xOffset - actualLeft, actualAscent);
      }

      const maxHorizontalShift = Math.ceil(
        Math.max(baseIntensity, hoverIntensity, clickEffect || glitchMode ? 1 : 0) *
          fuzzRange *
          0.5,
      );
      const horizontalMargin = Math.max(3, maxHorizontalShift + 2);
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = textHeight;
      context.translate(horizontalMargin, 0);

      let isHovering = false;
      let isClicking = false;
      let isGlitching = false;
      let currentIntensity = baseIntensity;
      let targetIntensity = baseIntensity;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return;
        glitchTimeoutId = window.setTimeout(() => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeoutId = window.setTimeout(() => {
            isGlitching = false;
            startGlitchLoop();
          }, glitchDuration);
        }, glitchInterval);
      };

      startGlitchLoop();

      const run = (timestamp) => {
        if (isCancelled) return;

        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = window.requestAnimationFrame(run);
          return;
        }
        lastFrameTime = timestamp;

        context.clearRect(
          -horizontalMargin,
          -fuzzRange - 10,
          offscreenWidth + horizontalMargin * 2,
          textHeight + 2 * (fuzzRange + 10),
        );

        if (isClicking || isGlitching) {
          targetIntensity = 1;
        } else if (isHovering) {
          targetIntensity = hoverIntensity;
        } else {
          targetIntensity = baseIntensity;
        }

        if (transitionDuration > 0) {
          const step = 1 / (transitionDuration / frameDuration);
          currentIntensity += Math.sign(targetIntensity - currentIntensity) * step;
          if (Math.abs(targetIntensity - currentIntensity) < step) {
            currentIntensity = targetIntensity;
          }
        } else {
          currentIntensity = targetIntensity;
        }

        if (direction === "vertical") {
          for (let x = 0; x < offscreenWidth; x += 1) {
            const dy = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
            context.drawImage(offscreen, x, 0, 1, textHeight, x, dy, 1, textHeight);
          }
        } else {
          for (let y = 0; y < textHeight; y += 1) {
            const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
            context.drawImage(offscreen, 0, y, offscreenWidth, 1, dx, y, offscreenWidth, 1);
          }
        }

        animationFrameId = window.requestAnimationFrame(run);
      };

      const handleMouseMove = (event) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        isHovering = x >= horizontalMargin && x <= horizontalMargin + textWidth && y >= 0 && y <= textHeight;
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleClick = () => {
        if (!clickEffect) return;
        isClicking = true;
        window.clearTimeout(clickTimeoutId);
        clickTimeoutId = window.setTimeout(() => {
          isClicking = false;
        }, 150);
      };

      if (enableHover) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
      }

      if (clickEffect) {
        canvas.addEventListener("click", handleClick);
      }

      animationFrameId = window.requestAnimationFrame(run);

      canvas.cleanupFuzzyText = () => {
        window.cancelAnimationFrame(animationFrameId);
        window.clearTimeout(glitchTimeoutId);
        window.clearTimeout(glitchEndTimeoutId);
        window.clearTimeout(clickTimeoutId);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("click", handleClick);
      };
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(glitchTimeoutId);
      window.clearTimeout(glitchEndTimeoutId);
      window.clearTimeout(clickTimeoutId);
      if (canvas.cleanupFuzzyText) {
        canvas.cleanupFuzzyText();
      }
    };
  }, [
    baseIntensity,
    children,
    clickEffect,
    color,
    direction,
    enableHover,
    fontFamily,
    fontSize,
    fontStyle,
    fontWeight,
    fps,
    fuzzRange,
    glitchDuration,
    glitchInterval,
    glitchMode,
    gradient,
    hoverIntensity,
    letterSpacing,
    textPaddingEnd,
    textPaddingStart,
    transitionDuration,
    text,
  ]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
