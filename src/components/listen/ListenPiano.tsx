// MIT License — Piano Learning App (Phase 2)
// Reference-only 61-key display for Listen Mode. The kid can't click keys —
// they play their real piano and we light up the matching key here.
//
// Reuses the layout math from Piano.tsx (C2..C7, 36 white + 25 black,
// computed black-key positioning) but renders simplified <div>s instead of
// <button>s (no pointer handlers, no a11y "button" role).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  blackKeyLeftRatio,
  getBlackKeys,
  getWhiteKeys,
  isBlackKey,
  parseNote,
} from "@/lib/notes";
import { cn } from "@/lib/utils";

// Kid-mode keys are bigger than the Phase-1 Piano (64px+ touch target).
const MIN_WHITE_WIDTH = 40;
const MAX_WHITE_WIDTH = 72;
const DEFAULT_WHITE_HEIGHT = 240;
const BLACK_HEIGHT_RATIO = 0.62;

export interface ListenPianoProps {
  /** Currently-active note (lit up green). */
  activeNote: string | null;
  /** Expected note (highlighted amber). */
  expectedNote: string | null;
  /** Wrong note (just attempted; soft yellow wiggle). */
  wrongNote?: string | null;
  /** Show note-name labels on the keys. */
  showNoteNames?: boolean;
}

export function ListenPiano({
  activeNote,
  expectedNote,
  wrongNote,
  showNoteNames = true,
}: ListenPianoProps) {
  const whites = useMemo(() => getWhiteKeys(), []);
  const blacks = useMemo(() => getBlackKeys(), []);
  const whiteCount = whites.length;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [whiteWidth, setWhiteWidth] = useState<number>(MAX_WHITE_WIDTH);
  const [whiteHeight, setWhiteHeight] = useState<number>(DEFAULT_WHITE_HEIGHT);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      const ideal = Math.floor((available - 8) / whiteCount);
      const next = Math.max(MIN_WHITE_WIDTH, Math.min(MAX_WHITE_WIDTH, ideal));
      setWhiteWidth(next);
      const h = Math.min(280, Math.max(180, Math.round(next * 3.5)));
      setWhiteHeight(h);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [whiteCount]);

  const blackWidthPx = 0.62 * whiteWidth;
  const blackHeight = Math.round(whiteHeight * BLACK_HEIGHT_RATIO);
  const keyboardWidthPx = whiteWidth * whiteCount;

  const renderKey = (note: string, isBlackKeyFlag: boolean) => {
    const isActive = activeNote === note;
    const isExpected = expectedNote === note;
    const isWrong = wrongNote === note;

    let label: string | null = null;
    if (showNoteNames) {
      const { letter, accidental, octave } = parseNote(note);
      label = `${letter}${accidental}${octave}`;
    }

    if (isBlackKeyFlag) {
      // Black keys are absolutely positioned; caller must wrap them.
      return { note, isBlack: true, label, isActive, isExpected, isWrong };
    }
    return { note, isBlack: false, label, isActive, isExpected, isWrong };
  };

  return (
    <div
      ref={stageRef}
      className="piano-stage w-full rounded-2xl border border-slate-700/40 p-3 shadow-2xl sm:p-4"
    >
      <div className="piano-scroll overflow-x-auto overflow-y-hidden">
        <div
          className="relative mx-auto"
          style={{ width: keyboardWidthPx, height: whiteHeight }}
          aria-label="Piano keyboard (display only)"
          role="img"
        >
          {/* White keys */}
          <div className="flex h-full w-full">
            {whites.map((k) => {
              const r = renderKey(k.note, false);
              return (
                <div
                  key={k.note}
                  data-note={k.note}
                  data-variant="white"
                  className={cn(
                    "relative flex h-full select-none items-end justify-center rounded-b-lg border border-slate-300 pb-2 transition-all duration-100",
                    "piano-key-white",
                    r.isActive && "is-pressed !bg-emerald-400",
                    r.isExpected && "is-next",
                    r.isWrong && "animate-wiggle !bg-amber-200",
                  )}
                  style={{ width: whiteWidth }}
                >
                  {r.label ? (
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        r.isActive ? "text-white" : "text-slate-600",
                      )}
                    >
                      {r.label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Black keys */}
          <div className="pointer-events-none absolute inset-0">
            {blacks.map((k) => {
              if (k.precedingWhiteIndex === undefined) return null;
              const leftRatio = blackKeyLeftRatio(k.precedingWhiteIndex, whiteCount);
              const leftPx = leftRatio * keyboardWidthPx;
              const r = renderKey(k.note, true);
              return (
                <div
                  key={k.note}
                  data-note={k.note}
                  data-variant="black"
                  className={cn(
                    "pointer-events-none absolute top-0 flex items-end justify-center rounded-b-md border border-slate-900 pb-1 transition-all duration-100",
                    "piano-key-black",
                    r.isActive && "is-pressed !bg-emerald-500",
                    r.isExpected && "is-next",
                    r.isWrong && "animate-wiggle !bg-amber-400",
                  )}
                  style={{
                    width: blackWidthPx,
                    height: blackHeight,
                    left: leftPx,
                  }}
                >
                  {r.label ? (
                    <span className="text-[10px] font-semibold text-white/80">
                      {r.label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export isBlackKey for callers that want to check note color.
export { isBlackKey };
