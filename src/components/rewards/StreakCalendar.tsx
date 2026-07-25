// MIT License — Piano Learning App (Phase 2)
// 7-day streak calendar — visual row of 7 dots (oldest → today) showing
// which days the kid completed a lesson. 1-day grace is reflected as a
// "pulsing" dot on today (still alive even if not yet completed).

"use client";

import { cn } from "@/lib/utils";
import type { StreakInfo } from "@/lib/streaks";

export interface StreakCalendarProps {
  streak: StreakInfo;
  className?: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function StreakCalendar({ streak, className }: StreakCalendarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            7-day streak
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {streak.current}
            </span>
            <span className="text-xs text-muted-foreground">days</span>
            {streak.graceActive ? (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                ⏰ grace day
              </span>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Best
          </div>
          <div className="mt-0.5 text-lg font-bold tabular-nums">
            <span className={streak.best >= 3 ? "streak-fire" : ""}>
              {streak.best} 🔥
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1">
        {streak.calendar.map((day, idx) => {
          const date = new Date(day.date + "T00:00:00");
          const dayLabel = DAY_LABELS[date.getDay()];
          const isToday = idx === streak.calendar.length - 1;
          const isGrace = isToday && streak.graceActive;
          return (
            <div
              key={day.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-all",
                  day.completed
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
                    : isGrace
                      ? "bg-amber-100 text-amber-600 ring-2 ring-amber-400 ring-offset-1 dark:bg-amber-500/20 dark:text-amber-300"
                      : isToday
                        ? "border-2 border-dashed border-amber-300 text-amber-500 dark:border-amber-500/40"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                  isToday && !day.completed && !isGrace && "animate-pulse",
                )}
                title={`${dayLabel} ${date.getDate()} — ${day.completed ? "completed" : isGrace ? "grace day" : "not yet"}`}
              >
                {day.completed ? "✓" : isToday ? "·" : ""}
              </div>
              <span className="text-[9px] font-medium text-muted-foreground">
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {streak.alive
          ? streak.completedToday
            ? "Great job today! Come back tomorrow to keep your streak alive."
            : streak.graceActive
              ? "You missed today — finish one lesson to keep your streak!"
              : "Complete a lesson today to extend your streak!"
          : "Complete a lesson today to start a new streak!"}
      </p>
    </div>
  );
}
