// MIT License — Piano Learning App
// Stats drawer — lifetime totals + per-song high scores.

"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Music,
  Trophy,
  Clock,
  Hash,
  Trash2,
} from "lucide-react";
import { usePianoStore } from "@/lib/store";
import { SONGS } from "@/lib/songs";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function StatsButton() {
  const stats = usePianoStore((s) => s.stats);
  const highScores = usePianoStore((s) => s.highScores);
  const resetAll = usePianoStore((s) => s.resetAll);

  const songsCompleted = SONGS.filter((s) => highScores[s.id]).length;
  const totalSongs = SONGS.length;
  const bestOverall = SONGS.reduce(
    (best, s) => {
      const hs = highScores[s.id];
      if (!hs) return best;
      if (hs.points > (best?.points ?? 0)) return { ...hs, songId: s.id, title: s.title };
      return best;
    },
    null as null | { points: number; accuracy: number; bestStreak: number; hits: number; total: number; songId: string; title: string },
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs"
          aria-label="Open stats panel"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Stats</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            Your stats
          </SheetTitle>
          <SheetDescription>
            Lifetime totals are saved in your browser — they persist across
            refreshes.
          </SheetDescription>
        </SheetHeader>

        {/* Lifetime totals */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard
            icon={<Hash className="h-4 w-4" />}
            label="Notes played"
            value={stats.totalNotesPlayed.toLocaleString()}
            tone="amber"
          />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Songs completed"
            value={`${stats.songsCompleted}`}
            sub={`${songsCompleted}/${totalSongs} with high score`}
            tone="emerald"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Time played"
            value={formatDuration(stats.secondsPlayed)}
            tone="slate"
          />
          <StatCard
            icon={<Music className="h-4 w-4" />}
            label="Free Play sessions"
            value={`${stats.freePlaySessions}`}
            tone="slate"
          />
        </div>

        {/* Best song */}
        {bestOverall ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <Trophy className="h-3.5 w-3.5" />
              Best score
            </div>
            <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-100">
              {bestOverall.points.toLocaleString()}
            </div>
            <div className="text-sm text-amber-800/80 dark:text-amber-200/70">
              {bestOverall.title}
            </div>
            <div className="mt-1 flex gap-3 text-xs text-amber-700/80 dark:text-amber-300/80">
              <span>{bestOverall.accuracy}% accuracy</span>
              <span>streak {bestOverall.bestStreak}</span>
            </div>
          </div>
        ) : null}

        {/* Per-song high scores */}
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            High scores by song
          </h3>
          <ScrollArea className="h-72 pr-3">
            <div className="flex flex-col gap-2">
              {SONGS.map((song) => {
                const hs = highScores[song.id];
                return (
                  <div
                    key={song.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70",
                      !hs && "opacity-50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {song.title}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {song.artist} · {song.difficulty}
                      </div>
                    </div>
                    {hs ? (
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                          {hs.points.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {hs.accuracy}% · streak {hs.bestStreak}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Reset */}
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm(
                  "Reset all stats and high scores? This cannot be undone.",
                )
              ) {
                resetAll();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset all stats
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatCard({
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
    <div className="rounded-xl border border-slate-200/60 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide",
          toneClasses[tone],
        )}
      >
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      {sub ? (
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}
