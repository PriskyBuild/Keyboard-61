// MIT License — Piano Learning App (Phase 2)
// Streak calendar helpers — 7-day visual streak with a 1-day grace period so
// kids don't feel punished for missing one day.

/** Today's date as YYYY-MM-DD (local time). */
export function todayDateStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Date N days ago as YYYY-MM-DD (local time). */
export function daysAgoStr(days: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return todayDateStr(d);
}

export interface StreakInfo {
  /** Current streak length in days. 0 if no streak. */
  current: number;
  /** Best streak length ever. */
  best: number;
  /** True if the streak is "alive" — either completed today, OR yesterday
   *  (1-day grace — kid can miss today without losing the streak). */
  alive: boolean;
  /** True if completed today already. */
  completedToday: boolean;
  /** 7-day calendar: array of 7 entries (oldest first → today last),
   *  each {date, completed} for the visual calendar. */
  calendar: Array<{ date: string; completed: boolean }>;
  /** True if the 1-day grace is in effect right now (completed yesterday
   *  but not yet today). */
  graceActive: boolean;
}

/**
 * Compute the streak info for a profile given its set of completed-day
 * strings (YYYY-MM-DD).
 *
 * Rules:
 *   - A day is "completed" if the kid finished any lesson that day.
 *   - The streak counts consecutive completed days, with a 1-day grace:
 *     if yesterday was completed but today wasn't (yet), the streak is
 *     still alive — kid has until end of today to extend it.
 *   - "alive" = streak is current OR grace is in effect.
 */
export function computeStreak(
  streakDays: string[],
  now: Date = new Date(),
): StreakInfo {
  const set = new Set(streakDays);
  const today = todayDateStr(now);
  const yesterday = daysAgoStr(1, now);

  // Build 7-day calendar (oldest → today).
  const calendar: Array<{ date: string; completed: boolean }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgoStr(i, now);
    calendar.push({ date: d, completed: set.has(d) });
  }

  const completedToday = set.has(today);
  const completedYesterday = set.has(yesterday);

  // Walk backwards from today counting consecutive completed days.
  // If today isn't completed but yesterday was, start from yesterday (grace).
  let cursor: string;
  if (completedToday) {
    cursor = today;
  } else if (completedYesterday) {
    cursor = yesterday;
  } else {
    return {
      current: 0,
      best: computeBestStreak(streakDays),
      alive: false,
      completedToday,
      calendar,
      graceActive: false,
    };
  }

  let current = 0;
  // Walk back day-by-day while completed.
  let offset = completedToday ? 0 : 1;
  while (set.has(daysAgoStr(offset, now))) {
    current += 1;
    offset += 1;
  }

  return {
    current,
    best: Math.max(computeBestStreak(streakDays), current),
    alive: true,
    completedToday,
    calendar,
    graceActive: !completedToday && completedYesterday,
  };
}

/** Compute the longest streak ever achieved. */
function computeBestStreak(streakDays: string[]): number {
  if (streakDays.length === 0) return 0;
  const sorted = [...streakDays].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/** Mark today as completed in the streak-days array (idempotent). */
export function markTodayComplete(
  streakDays: string[],
  now: Date = new Date(),
): string[] {
  const today = todayDateStr(now);
  if (streakDays.includes(today)) return streakDays;
  return [...streakDays, today];
}
