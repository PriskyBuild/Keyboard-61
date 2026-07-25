// MIT License — Piano Learning App
// Daily Challenge card — shows today's featured song with bonus coins.
// Rendered on the home page (Free Play mode) above the piano.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Check,
  Clock,
  ArrowRight,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDailyChallenge,
  completeDailyChallenge,
  timeUntilNextChallenge,
  type DailyChallenge,
} from "@/lib/daily-challenge";
import { findSongById } from "@/lib/songs";
import { usePianoStore } from "@/lib/store";

export function DailyChallengeCard() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const setMode = usePianoStore((s) => s.setMode);
  const setCurrentSong = usePianoStore((s) => s.setCurrentSong);

  useEffect(() => {
    // Schedule the challenge load via setTimeout so the setState happens
    // asynchronously (not during the effect body). This avoids the
    // react-hooks/set-state-in-effect lint.
    const loadId = window.setTimeout(() => setChallenge(getDailyChallenge()), 0);
    const updateTimer = () => setTimeLeft(timeUntilNextChallenge());
    updateTimer();
    const id = window.setInterval(updateTimer, 60_000);
    return () => {
      window.clearTimeout(loadId);
      window.clearInterval(id);
    };
  }, []);

  // Refresh challenge state when the tab regains focus (in case the user
  // completed the challenge elsewhere).
  useEffect(() => {
    const onFocus = () => setChallenge(getDailyChallenge());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!challenge) return null;
  const song = findSongById(challenge.songId);
  if (!song) return null;

  const startChallenge = () => {
    setMode("learn");
    setCurrentSong(song);
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all",
        challenge.completed
          ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900"
          : "border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:border-purple-500/30 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-amber-500/10 animate-daily-pulse",
      )}
    >
      {/* Decorative shimmer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-purple-300/20 blur-2xl" />
        <div className="absolute -left-2 -bottom-4 h-16 w-16 rounded-full bg-amber-300/20 blur-xl" />
      </div>

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-md",
            challenge.completed
              ? "bg-gradient-to-br from-emerald-400 to-teal-500"
              : "bg-gradient-to-br from-purple-500 to-pink-500",
          )}
        >
          {challenge.completed ? (
            <Check className="h-7 w-7" />
          ) : (
            <Gift className="h-7 w-7" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                challenge.completed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
              )}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {challenge.label}
            </span>
            {!challenge.completed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                🪙 +{challenge.bonusCoins} bonus
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 truncate text-base font-bold">{song.title}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {song.artist} · {song.difficulty} · {song.bpm} BPM
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0 text-right">
          {challenge.completed ? (
            <div className="text-right">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Done!
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                Next in {timeLeft}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <Button
                type="button"
                size="sm"
                onClick={startChallenge}
                className="gap-1.5"
              >
                Play
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {timeLeft} left
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
