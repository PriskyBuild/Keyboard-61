// MIT License — Piano Learning App
// Achievement timestamp persistence — tracks when each achievement was
// first earned. Stored in localStorage so the Achievements page can show
// a "Recently earned" feed.

const STORAGE_KEY = "piano-app:achievement-timestamps:v1";

export interface AchievementRecord {
  /** Achievement ID (matches the id field in the achievements page). */
  id: string;
  /** ISO timestamp of when the achievement was first earned. */
  earnedAt: string;
}

/** Load all earned-achievement timestamps from localStorage. */
export function loadAchievementTimestamps(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const arr = JSON.parse(raw) as AchievementRecord[];
    const out: Record<string, string> = {};
    for (const r of arr) {
      out[r.id] = r.earnedAt;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Check which achievements are newly earned (not yet in storage) and
 * persist their timestamps. Returns the list of newly-earned IDs.
 *
 * @param earnedIds  Set of achievement IDs that are currently earned.
 * @returns Array of IDs that were newly persisted (not previously stored).
 */
export function persistNewAchievements(
  earnedIds: Set<string>,
): string[] {
  if (typeof window === "undefined") return [];
  const existing = loadAchievementTimestamps();
  const newlyEarned: string[] = [];
  const now = new Date().toISOString();

  for (const id of earnedIds) {
    if (!existing[id]) {
      existing[id] = now;
      newlyEarned.push(id);
    }
  }

  if (newlyEarned.length > 0) {
    try {
      const arr: AchievementRecord[] = Object.entries(existing).map(
        ([id, earnedAt]) => ({ id, earnedAt }),
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
      /* noop */
    }
  }

  return newlyEarned;
}

/** Format an ISO timestamp as a relative time string (e.g. "2h ago"). */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
