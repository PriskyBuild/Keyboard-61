// MIT License — Piano Learning App
// Quick Stats bar — compact horizontal strip showing lifetime totals.
// Shown on the home page (Free Play mode) below the Daily Challenge.

"use client";

import { useEffect, useState } from "react";
import { loadStats } from "@/lib/persistence";
import type { PersistedStats } from "@/lib/persistence";
import { Music, Trophy, Clock, Flame } from "lucide-react";

export function QuickStatsBar() {
  const [stats, setStats] = useState<PersistedStats | null>(() =>
    typeof window !== "undefined" ? loadStats() : null,
  );

  useEffect(() => {
    const onFocus = () => setStats(loadStats());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!stats) return null;

  const minutesPlayed = Math.round(stats.secondsPlayed / 60);

  const items = [
    {
      icon: <Music className="h-4 w-4" />,
      label: "Notes",
      value: stats.totalNotesPlayed.toLocaleString(),
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: <Trophy className="h-4 w-4" />,
      label: "Songs",
      value: `${stats.songsCompleted}`,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Minutes",
      value: `${minutesPlayed}`,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <Flame className="h-4 w-4" />,
      label: "Sessions",
      value: `${stats.freePlaySessions}`,
      color: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="glass-card flex items-center gap-2.5 rounded-xl p-2.5"
        >
          <span className={item.color}>{item.icon}</span>
          <div className="min-w-0">
            <div className="text-lg font-bold leading-tight tabular-nums">
              {item.value}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
