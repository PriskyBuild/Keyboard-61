// MIT License — Piano Learning App (Phase 2)
// Celebration screen — confetti + mascot dance + sticker reveal. Shown when
// a lesson is completed (>= 70% accuracy).
//
// Uses canvas-confetti for the confetti burst.

"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/listen/Mascot";
import { Button } from "@/components/ui/button";
import { playFanfareCue } from "@/lib/audio-cues";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";

export interface CelebrationScreenProps {
  /** The lesson title that was completed. */
  lessonTitle: string;
  /** Sticker emoji/id to reveal (e.g. "🌟" or a sticker id). */
  stickerEmoji?: string;
  /** Sticker name (e.g. "First Note"). */
  stickerName?: string;
  /** Coins earned this round. */
  coinsEarned?: number;
  /** Final accuracy (0-100). */
  accuracy?: number;
  /** Called when the user clicks "Continue". */
  onContinue?: () => void;
  /** Called when the user clicks "Replay". */
  onReplay?: () => void;
}

export function CelebrationScreen({
  lessonTitle,
  stickerEmoji,
  stickerName,
  coinsEarned = 0,
  accuracy = 100,
  onContinue,
  onReplay,
}: CelebrationScreenProps) {
  const confettiFiredRef = useRef(false);
  const [stickerRevealed, setStickerRevealed] = useState(false);

  // Fire confetti + fanfare once on mount.
  useEffect(() => {
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;

    void playFanfareCue();

    // Lazy-load canvas-confetti (it's a browser-only lib).
    import("canvas-confetti")
      .then((mod) => {
        const confetti = mod.default;
        // Burst from the center, then from the sides.
        const burst = (
          x: number,
          angle: number,
          colors: string[],
        ) => {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { x, y: 0.6 },
            angle,
            colors,
            scalar: 1.1,
            ticks: 250,
          });
        };
        const palette = [
          "#f59e0b",
          "#10b981",
          "#3b82f6",
          "#fb7185",
          "#a855f7",
          "#fde047",
        ];
        burst(0.5, 90, palette);
        window.setTimeout(() => burst(0.2, 60, palette), 200);
        window.setTimeout(() => burst(0.8, 120, palette), 400);
        window.setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 100,
            origin: { y: 0.5 },
            colors: palette,
          });
        }, 700);
      })
      .catch(() => {
        /* canvas-confetti failed to load — non-critical */
      });

    // Reveal the sticker after a short delay for dramatic effect.
    const id = window.setTimeout(() => setStickerRevealed(true), 800);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Trophy className="h-4 w-4" />
          Lesson complete!
        </div>
        <h2 className="text-3xl font-bold sm:text-4xl">{lessonTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {accuracy >= 95
            ? "Amazing! You nailed it!"
            : accuracy >= 80
              ? "Great job — you sounded wonderful!"
              : "Well done — keep practising!"}
        </p>
      </div>

      <Mascot state="happy" size={140} message="Yay! You did it! 🎉" />

      {/* Sticker reveal */}
      {stickerEmoji ? (
        <div className="flex flex-col items-center gap-2">
          <div
            className={`grid h-32 w-32 place-items-center rounded-3xl bg-gradient-to-br from-amber-200 to-orange-200 text-7xl shadow-xl ring-4 ring-amber-300 transition-all duration-500 dark:from-amber-500/30 dark:to-orange-500/30 dark:ring-amber-500/40 ${
              stickerRevealed
                ? "scale-100 opacity-100"
                : "scale-50 opacity-0"
            }`}
          >
            {stickerEmoji}
          </div>
          {stickerName ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              New sticker: {stickerName}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Coins earned */}
      {coinsEarned > 0 ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-bold text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300">
          🪙 +{coinsEarned} coins
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex gap-3">
        {onReplay ? (
          <Button variant="outline" size="lg" onClick={onReplay}>
            Replay
          </Button>
        ) : null}
        {onContinue ? (
          <Button size="lg" onClick={onContinue} className="gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
