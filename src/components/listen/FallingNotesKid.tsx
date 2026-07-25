// MIT License — Piano Learning App (Phase 2)
// Kid-friendly falling notes visualizer. Larger, slower, more colorful than
// the Phase-1 Visualizer. BPM 60 by default (slow enough for 6-7 year olds
// to react).
//
// Notes fall onto the matching column of the ListenPiano. Each card shows
// the note name + finger number (when provided).
//
// Canvas-based for smooth animation, but with bigger note rectangles and
// bolder colors than the Phase-1 visualizer.

"use client";

import { useEffect, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import type { VisualizerNote } from "@/types";

export interface KidFallingNote extends VisualizerNote {
  /** Finger number 1-5 (RH) or null if no hint. */
  finger?: number | null;
  /** Hand: "L" (left), "R" (right), or null. */
  hand?: "L" | "R" | null;
}

export interface FallingNotesKidProps {
  notes: KidFallingNote[];
  /** Song is currently playing. */
  isPlaying: boolean;
  /** Pixels of fall distance per second of song time. */
  pixelsPerSecond?: number;
  /** Canvas height in px. */
  height?: number;
}

const DEFAULT_HEIGHT = 280;
const DEFAULT_PX_PER_SEC = 140; // slower than Phase-1 (220) for kids
const LOOKAHEAD_SEC = 6;

const COLORS = {
  white: "#22c55e", // emerald — RH notes
  whiteEdge: "#4ade80",
  black: "#10b981",
  blackEdge: "#34d399",
  leftWhite: "#3b82f6", // blue — LH notes (we still avoid indigo per project rules, this is a softer blue)
  leftWhiteEdge: "#60a5fa",
  leftBlack: "#2563eb",
  leftBlackEdge: "#3b82f6",
  hitLine: "#f59e0b",
  bg: "rgba(15, 23, 42, 0.95)",
};

export function FallingNotesKid({
  notes,
  isPlaying,
  pixelsPerSecond = DEFAULT_PX_PER_SEC,
  height = DEFAULT_HEIGHT,
}: FallingNotesKidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const notesRef = useRef(notes);
  const isPlayingRef = useRef(isPlaying);
  const audio = useAudioEngine();

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // DPR-aware canvas sizing.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderFrame = async () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      let transportSec = 0;
      try {
        const transport = await audio.getTransport();
        transportSec = transport.seconds;
      } catch {
        transportSec = 0;
      }

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "rgba(15, 23, 42, 0.95)");
      bgGrad.addColorStop(1, "rgba(30, 41, 59, 0.85)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const hitY = h - 6;

      // Hit line — warm amber glow
      const hitGlow = ctx.createLinearGradient(0, hitY - 24, 0, hitY);
      hitGlow.addColorStop(0, "rgba(245, 158, 11, 0)");
      hitGlow.addColorStop(1, "rgba(245, 158, 11, 0.5)");
      ctx.fillStyle = hitGlow;
      ctx.fillRect(0, hitY - 24, w, 24);
      ctx.fillStyle = COLORS.hitLine;
      ctx.fillRect(0, hitY - 3, w, 6);
      // Sparkly ends
      ctx.fillStyle = "rgba(251, 191, 36, 0.7)";
      ctx.fillRect(0, hitY - 12, 6, 24);
      ctx.fillRect(w - 6, hitY - 12, 6, 24);

      // Draw notes
      const t0 = transportSec - 0.3;
      const t1 = transportSec + LOOKAHEAD_SEC;
      for (const n of notesRef.current) {
        if (n.startSec + n.durationSec < t0) continue;
        if (n.startSec > t1) continue;

        const dt = n.startSec - transportSec;
        // Bigger rectangles for kids — min height 28px
        const noteHeightPx = Math.max(28, n.durationSec * pixelsPerSecond * 0.7);
        const y = hitY - dt * pixelsPerSecond - noteHeightPx;
        const x = n.xRatio * w;
        const width = Math.max(28, n.widthRatio * w - 4);

        if (y + noteHeightPx < 0) continue;

        // Body — choose color based on hand
        const isLeft = n.hand === "L";
        const baseColor = n.isBlack
          ? isLeft
            ? COLORS.leftBlack
            : COLORS.black
          : isLeft
            ? COLORS.leftWhite
            : COLORS.white;
        const edgeColor = n.isBlack
          ? isLeft
            ? COLORS.leftBlackEdge
            : COLORS.blackEdge
          : isLeft
            ? COLORS.leftWhiteEdge
            : COLORS.whiteEdge;

        const grad = ctx.createLinearGradient(x, y, x, y + noteHeightPx);
        grad.addColorStop(0, edgeColor);
        grad.addColorStop(0.5, baseColor);
        grad.addColorStop(1, edgeColor);
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        roundRect(ctx, x + 2, y + 2, width - 4, noteHeightPx - 4, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Highlight strip on top
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        roundRect(ctx, x + 4, y + 4, width - 8, Math.min(6, noteHeightPx - 8), 4);
        ctx.fill();

        // Note name label (large, bold, white)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const labelY = y + noteHeightPx / 2;
        ctx.fillText(n.note, x + width / 2, labelY - 8);

        // Finger number (below note name)
        if (n.finger !== null && n.finger !== undefined) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = "bold 14px ui-sans-serif, system-ui, sans-serif";
          ctx.fillText(`finger ${n.finger}`, x + width / 2, labelY + 10);
        }

        // Approach glow when close to hit line
        const distToHit = Math.max(0, hitY - (y + noteHeightPx));
        if (distToHit < pixelsPerSecond * 0.5) {
          const alpha = 1 - distToHit / (pixelsPerSecond * 0.5);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
          ctx.lineWidth = 2;
          roundRect(ctx, x + 2, y + 2, width - 4, noteHeightPx - 4, 8);
          ctx.stroke();
        }
      }

      // Status text (top-left)
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "12px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(transportSec.toFixed(1) + "s", 8, 8);
      ctx.textAlign = "right";
      ctx.fillText(isPlayingRef.current ? "▶ playing" : "⏸ paused", w - 8, 8);

      rafRef.current = requestAnimationFrame(() => {
        void renderFrame();
      });
    };

    rafRef.current = requestAnimationFrame(() => {
      void renderFrame();
    });
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [audio]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border-2 border-amber-300/40 shadow-inner"
      style={{ height }}
      aria-label="Falling notes (kid mode)"
      role="img"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
