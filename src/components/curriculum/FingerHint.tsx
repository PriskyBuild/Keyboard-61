// MIT License — Piano Learning App (Phase 2)
// Single finger-hint indicator — a colored circle with the finger number.

"use client";

import { cn } from "@/lib/utils";

export interface FingerHintProps {
  /** Finger 1-5 (1=thumb, 5=pinky). */
  finger: number;
  /** Hand: "L" or "R". Affects color. */
  hand?: "L" | "R" | null;
  /** Size in px (default 32). */
  size?: number;
  /** Active (highlighted) state. */
  active?: boolean;
  className?: string;
}

const FINGER_NAMES = ["Thumb", "Index", "Middle", "Ring", "Pinky"];

export function FingerHint({
  finger,
  hand = null,
  size = 32,
  active = false,
  className,
}: FingerHintProps) {
  const isLeft = hand === "L";
  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-full font-bold transition-all",
        active
          ? isLeft
            ? "bg-blue-500 text-white shadow-md ring-2 ring-blue-300"
            : "bg-amber-500 text-white shadow-md ring-2 ring-amber-300"
          : isLeft
            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={`${hand === "L" ? "Left" : hand === "R" ? "Right" : ""} hand — finger ${finger} (${FINGER_NAMES[finger - 1]})`}
      aria-label={`${hand === "L" ? "Left" : hand === "R" ? "Right" : ""} hand finger ${finger}`}
    >
      {finger}
    </div>
  );
}
