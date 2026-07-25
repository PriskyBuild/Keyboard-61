// MIT License — Piano Learning App
// Daily Challenge — picks a deterministic "song of the day" based on the
// current date. Completing it awards bonus coins. Changes every 24h.
//
// The selection is deterministic (seeded by YYYY-MM-DD) so all users on
// the same day see the same challenge. This creates a shared experience
// and lets us show "X people completed today's challenge" later.

import { SONGS } from "@/lib/songs";

/** Today's date as YYYY-MM-DD (local time). */
export function todayDateStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Simple deterministic hash from a string → non-negative integer. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface DailyChallenge {
  /** The song chosen for today. */
  songId: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Bonus coins for completing today's challenge. */
  bonusCoins: number;
  /** Friendly label for the challenge. */
  label: string;
  /** True if the user has already completed today's challenge. */
  completed: boolean;
}

/** Pick today's daily challenge. Deterministic per date. */
export function getDailyChallenge(): DailyChallenge {
  const date = todayDateStr();
  const hash = hashString(date);
  const song = SONGS[hash % SONGS.length];
  const bonusCoins = 10 + (hash % 20); // 10..29

  // Check if the user has already completed today's challenge.
  let completed = false;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("piano-app:daily-challenge");
      if (raw) {
        const data = JSON.parse(raw) as { date: string; completed: boolean };
        completed = data.date === date && data.completed;
      }
    } catch {
      /* noop */
    }
  }

  const labels = [
    "Today's Pick",
    "Daily Warmup",
    "Challenge of the Day",
    "Featured Song",
    "Daily Special",
  ];
  const label = labels[hash % labels.length];

  return {
    songId: song.id,
    date,
    bonusCoins,
    label,
    completed,
  };
}

/** Mark today's challenge as completed (persists to localStorage). */
export function completeDailyChallenge(): void {
  if (typeof window === "undefined") return;
  const date = todayDateStr();
  try {
    window.localStorage.setItem(
      "piano-app:daily-challenge",
      JSON.stringify({ date, completed: true }),
    );
  } catch {
    /* noop */
  }
}

/** Time until the next challenge (midnight local time) as a human string. */
export function timeUntilNextChallenge(now: Date = new Date()): string {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
