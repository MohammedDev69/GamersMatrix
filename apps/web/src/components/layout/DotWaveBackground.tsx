"use client";

import { useEffect, useRef } from "react";

/**
 * Animated violet dot-wave field with soft pointer interaction.
 * Canvas-based; static denser grid when reduced-motion is preferred.
 */
export function DotWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    let raf = 0;
    let running = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let t = 0;

    let targetX = -9999;
    let targetY = -9999;
    let ptrX = -9999;
    let ptrY = -9999;
    let ptrActive = 0; // 0..1 smoothed presence

    const GAP = 24;
    const INFLUENCE = 160;
    const COLORS = [
      "139, 61, 255",
      "165, 107, 255",
      "194, 157, 255",
      "222, 203, 255",
    ] as const;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawFrame(timeScale: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Ease pointer toward target
      if (ptrX < -9000) {
        ptrX = targetX;
        ptrY = targetY;
      } else {
        ptrX += (targetX - ptrX) * 0.14;
        ptrY += (targetY - ptrY) * 0.14;
      }
      const wantActive = targetX > -9000 ? 1 : 0;
      ptrActive += (wantActive - ptrActive) * 0.08;

      const cols = Math.ceil(width / GAP) + 1;
      const rows = Math.ceil(height / GAP) + 1;
      const inf2 = INFLUENCE * INFLUENCE;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const baseX = col * GAP;
          const baseY = row * GAP;

          const wave =
            Math.sin(col * 0.34 + timeScale * 1.2) *
              Math.cos(row * 0.28 + timeScale * 0.9) +
            Math.sin((col + row) * 0.18 + timeScale * 0.6) * 0.5;

          const lift = wave * 7;
          const pulse = (wave + 1) * 0.5;

          let x = baseX;
          let y = baseY + lift;
          let boost = 0;

          if (ptrActive > 0.01 && ptrX > -9000) {
            const dx = baseX - ptrX;
            const dy = baseY - ptrY;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < inf2) {
              const dist = Math.sqrt(dist2) || 0.001;
              const falloff = 1 - dist / INFLUENCE;
              const strength = falloff * falloff * ptrActive;
              boost = strength;
              // Soft repulsion ripple away from cursor
              const push = strength * 10;
              x += (dx / dist) * push;
              y += (dy / dist) * push;
            }
          }

          const radius = 0.85 + pulse * 1.45 + boost * 2.1;
          const alpha = Math.min(0.42, 0.07 + pulse * 0.14 + boost * 0.32);
          const color = COLORS[(col + row) % COLORS.length];

          ctx.beginPath();
          ctx.fillStyle = `rgba(${color}, ${alpha})`;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();

          // Soft glow core near the pointer
          if (boost > 0.35) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(222, 203, 255, ${boost * 0.18})`;
            ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    function tick() {
      if (!running) return;
      t += 0.016;
      drawFrame(t);
      raf = window.requestAnimationFrame(tick);
    }

    resize();

    if (reduce.matches) {
      drawFrame(0.8);
    } else {
      raf = window.requestAnimationFrame(tick);
    }

    const onResize = () => {
      resize();
      if (reduce.matches) drawFrame(0.8);
    };

    const onMove = (e: PointerEvent) => {
      if (!finePointer.matches || reduce.matches) return;
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const onLeave = () => {
      targetX = -9999;
      targetY = -9999;
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce.matches) {
        running = true;
        raf = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="gm-dot-wave" aria-hidden />;
}
