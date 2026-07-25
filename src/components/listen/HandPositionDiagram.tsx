// MIT License — Piano Learning App (Phase 2)
// Hand-position diagram — shows which finger to use for each note. Static
// SVG of two hands (LH on left, RH on right) with numbered fingers. The
// active finger is highlighted.
//
// Finger numbers follow standard piano pedagogy:
//   Thumb = 1, Index = 2, Middle = 3, Ring = 4, Pinky = 5
//   (same for both hands)

"use client";

import { cn } from "@/lib/utils";

export interface HandPositionDiagramProps {
  /** Active hand: "L", "R", or null. */
  hand?: "L" | "R" | null;
  /** Active finger 1-5, or null. */
  finger?: number | null;
  className?: string;
}

const FINGER_LABELS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];

export function HandPositionDiagram({
  hand = null,
  finger = null,
  className,
}: HandPositionDiagramProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      aria-label={`Hand position: ${hand ? (hand === "L" ? "left" : "right") + " hand" : "no hand"}, finger ${finger ?? "none"}`}
      role="img"
    >
      <Hand label="Left" hand="L" activeHand={hand} activeFinger={finger} />
      <div className="text-xs font-semibold text-muted-foreground">|</div>
      <Hand label="Right" hand="R" activeHand={hand} activeFinger={finger} />
    </div>
  );
}

function Hand({
  label,
  hand,
  activeHand,
  activeFinger,
}: {
  label: string;
  hand: "L" | "R";
  activeHand: "L" | "R" | null;
  activeFinger: number | null;
}) {
  const isActive = activeHand === hand;
  // Fingers laid out left-to-right. For the right hand, finger 1 (thumb) is
  // on the left; for the left hand, finger 1 is on the right (mirrored).
  const fingers =
    hand === "R" ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 transition-opacity",
        !isActive && activeHand !== null && "opacity-40",
      )}
    >
      <span className="text-xs font-semibold text-muted-foreground">
        {label} hand
      </span>
      <div className="flex gap-1">
        {fingers.map((f) => {
          const isFingerActive = isActive && activeFinger === f;
          return (
            <div
              key={f}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all",
                isFingerActive
                  ? "scale-110 bg-amber-100 dark:bg-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800",
              )}
            >
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition-colors",
                  isFingerActive
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
                    : "bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                )}
              >
                {f}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {FINGER_LABELS[f - 1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
