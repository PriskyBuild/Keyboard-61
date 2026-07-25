// MIT License — Piano Learning App
// Score + accuracy + streak display, plus song-complete screen.

"use client";

import { Trophy, Target, Flame, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePianoStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export interface ScoreboardProps {
  /** Show the song-complete overlay (with replay / next). */
  complete?: boolean;
  /** Called when the user clicks replay. */
  onReplay?: () => void;
  /** Called when the user clicks next song. */
  onNext?: () => void;
  /** Disable the "next" button (e.g. last song). */
  nextDisabled?: boolean;
}

export function Scoreboard({
  complete,
  onReplay,
  onNext,
  nextDisabled,
}: ScoreboardProps) {
  const score = usePianoStore((s) => s.score);

  const accuracy =
    score.total > 0 ? Math.round((score.hits / score.total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={<Trophy className="h-4 w-4" />}
          label="Score"
          value={score.points.toLocaleString()}
          tone="amber"
        />
        <Stat
          icon={<Target className="h-4 w-4" />}
          label="Accuracy"
          value={`${accuracy}%`}
          tone={accuracy >= 80 ? "emerald" : accuracy >= 50 ? "amber" : "rose"}
          sub={`${score.hits}/${score.total}`}
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${score.streak}`}
          tone={score.streak >= 5 ? "rose" : "slate"}
          sub={`best ${score.bestStreak}`}
        />
      </div>

      {complete ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur dark:bg-slate-950/95">
          <Trophy className="h-10 w-10 text-amber-500" />
          <p className="text-lg font-semibold">Song complete!</p>
          <p className="text-sm text-muted-foreground">
            {score.points.toLocaleString()} points · {accuracy}% accuracy · best
            streak {score.bestStreak}
          </p>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="default" onClick={onReplay}>
              <RotateCcw className="h-4 w-4" /> Replay
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onNext}
              disabled={nextDisabled}
            >
              <SkipForward className="h-4 w-4" /> Next song
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "amber" | "emerald" | "rose" | "slate";
}) {
  const toneClasses: Record<typeof tone, string> = {
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    slate: "text-slate-700 dark:text-slate-300",
  };
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide",
          toneClasses[tone],
        )}
      >
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub ? (
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}
