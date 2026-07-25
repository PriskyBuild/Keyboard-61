// MIT License — Piano Learning App
// Shared presentational key. WhiteKey and BlackKey are thin wrappers that
// pass the right `variant`.

"use client";

import { memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { KeyDescriptor } from "@/types";

export interface KeyProps {
  descriptor: KeyDescriptor;
  /** Visual state. */
  pressed: boolean;
  /** Highlighted as the next note in Learning Mode. */
  isNext: boolean;
  /** Briefly flashing red (wrong press in Learning Mode). */
  isWrong: boolean;
  /** Note-name label to render (or null to hide). */
  noteLabel: string | null;
  /** Physical-key hint (e.g. "A") to render, or null. */
  hintLabel: string | null;
  /** Pointer / touch down handler. */
  onNotePress: (note: string) => void;
  /** Pointer / touch up handler. */
  onNoteRelease: (note: string) => void;
  /** Style variant — passed by WhiteKey / BlackKey. */
  variant: "white" | "black";
  /** Absolute CSS width for this key (used by Piano to size keys). */
  width?: number | string;
  /** Absolute CSS height for this key. */
  height?: number | string;
  /** Inline style for absolute-positioned black keys. */
  style?: React.CSSProperties;
  /** Optional className passthrough. */
  className?: string;
}

function KeyBaseImpl({
  descriptor,
  pressed,
  isNext,
  isWrong,
  noteLabel,
  hintLabel,
  onNotePress,
  onNoteRelease,
  variant,
  width,
  height,
  style,
  className,
}: KeyProps) {
  const { note } = descriptor;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // Prevent the browser from stealing focus and triggering scrolling.
      e.preventDefault();
      // Capture the pointer so we get the up event even if the cursor leaves.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* some browsers throw if already captured */
      }
      onNotePress(note);
    },
    [note, onNotePress],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      onNoteRelease(note);
    },
    [note, onNoteRelease],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // If the button is still being pressed when the pointer leaves, treat as release.
      if (e.buttons > 0) {
        onNoteRelease(note);
      }
    },
    [note, onNoteRelease],
  );

  const isBlack = variant === "black";

  return (
    <button
      type="button"
      aria-label={`${note} ${isBlack ? "black key" : "white key"}`}
      aria-pressed={pressed}
      data-note={note}
      data-variant={variant}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      style={{ width, height, ...style }}
      className={cn(
        "relative select-none touch-none outline-none transition-[transform,background,box-shadow] duration-75 ease-out",
        "focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
        isBlack ? "piano-key-black" : "piano-key-white",
        "rounded-b-md",
        pressed && (isBlack ? "is-pressed" : "is-pressed"),
        isNext && "is-next",
        isWrong && "piano-key-wrong",
        className,
      )}
    >
      {/* Label layer */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-1.5 flex flex-col items-center gap-0.5 text-[10px] font-medium leading-none",
          isBlack ? "text-white/70" : "text-slate-500",
        )}
      >
        {hintLabel ? (
          <span
            className={cn(
              "rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              isBlack
                ? "bg-amber-400/20 text-amber-200"
                : "bg-amber-500/15 text-amber-700",
            )}
          >
            {hintLabel}
          </span>
        ) : null}
        {noteLabel ? (
          <span className={cn("text-[10px] font-semibold")}>{noteLabel}</span>
        ) : null}
      </span>
    </button>
  );
}

export const KeyBase = memo(KeyBaseImpl);
