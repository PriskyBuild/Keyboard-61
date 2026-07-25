// MIT License — Piano Learning App
// Falling-notes visualizer. Canvas-based for performance.

"use client";

import { useEffect, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import type { VisualizerNote } from "@/types";

export interface VisualizerProps {
  /** Snapshot of all notes to render (already tempo-scaled). */
  notes: VisualizerNote[];
  /** True while the song is currently playing. */
  isPlaying: boolean;
  /** Pixels of fall distance per second of song time. Higher = faster. */
  pixelsPerSecond?: number;
  /** Optional CSS height for the canvas. */
  height?: number;
}

const DEFAULT_HEIGHT = 220;
const DEFAULT_PX_PER_SEC = 220;
const LOOKAHEAD_SEC = 4; // notes within this many seconds are visible

const COLORS = {
  white: "#f59e0b",
  whiteEdge: "#fbbf24",
  black: "#f97316",
  blackEdge: "#fb923c",
  hitLine: "#f43f5e",
  bg: "rgba(15, 23, 42, 0.92)",
};

export function Visualizer({
  notes,
  isPlaying,
  pixelsPerSecond = DEFAULT_PX_PER_SEC,
  height = DEFAULT_HEIGHT,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const notesRef = useRef(notes);
  const isPlayingRef = useRef(isPlaying);
  const audio = useAudioEngine();

  // Keep refs in sync without re-arming the RAF loop.
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Resize observer so the canvas matches its container width + DPR.
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
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
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

      // Background
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // Hit line at the bottom edge of the canvas (notes "land" here).
      const hitLineY = h - 4;
      ctx.fillStyle = COLORS.hitLine;
      ctx.fillRect(0, hitLineY - 2, w, 4);

      // Draw each note that falls within [nowSec - 0.2, nowSec + LOOKAHEAD_SEC].
      const t0 = transportSec - 0.2;
      const t1 = transportSec + LOOKAHEAD_SEC;
      for (const n of notesRef.current) {
        if (n.startSec + n.durationSec < t0) continue;
        if (n.startSec > t1) continue;

        // Y position: notes fall from (nowSec + LOOKAHEAD_SEC) at the top to nowSec at the hit line.
        const dt = n.startSec - transportSec;
        // Top of the note should be at hitLineY - (dt * pxPerSec) - (noteHeight)
        const noteHeightPx = Math.max(8, n.durationSec * pixelsPerSecond * 0.8);
        const y = hitLineY - dt * pixelsPerSecond - noteHeightPx;

        const x = n.xRatio * w;
        const width = Math.max(6, n.widthRatio * w - 2);

        // Skip if entirely off-screen above.
        if (y + noteHeightPx < 0) continue;

        // Body
        const grad = ctx.createLinearGradient(x, y, x, y + noteHeightPx);
        if (n.isBlack) {
          grad.addColorStop(0, COLORS.blackEdge);
          grad.addColorStop(1, COLORS.black);
        } else {
          grad.addColorStop(0, COLORS.whiteEdge);
          grad.addColorStop(1, COLORS.white);
        }
        ctx.fillStyle = grad;
        roundRect(ctx, x + 1, y + 1, width - 2, noteHeightPx - 2, 4);
        ctx.fill();

        // Glow
        ctx.shadowColor = n.isBlack ? COLORS.black : COLORS.white;
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        roundRect(ctx, x + 1, y + 1, width - 2, Math.min(4, noteHeightPx - 2), 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Clock + progress text
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(transportSec.toFixed(2) + "s", 8, 16);
      ctx.textAlign = "right";
      ctx.fillText(isPlayingRef.current ? "▶ playing" : "⏸ paused", w - 8, 16);

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
      className="relative w-full overflow-hidden rounded-2xl border border-slate-700/40 shadow-inner"
      style={{ height }}
      aria-label="Falling notes visualizer"
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
