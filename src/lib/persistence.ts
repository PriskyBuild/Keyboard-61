// MIT License — Piano Learning App
// Lightweight localStorage persistence. Survives page refreshes.
//
// Schema versioned so future migrations are cheap. All access guarded by
// `typeof window !== "undefined"` so the module is SSR-safe.

const STORAGE_KEY = "piano-app:v1";
const STORAGE_KEY_STATS = "piano-app:stats:v1";

/** Persisted user preferences (mirror of the Zustand store's prefs slice). */
export interface PersistedPrefs {
  showNoteNames: boolean;
  showKeyHints: boolean;
  keyboardOctave: number;
  sustain: boolean;
  volume: number;
  reverb: number;
  tempo: number;
  mode: "free" | "learn";
  lastSongId: string | null;
  /** Per-song high scores: { [songId]: { points, accuracy, bestStreak, at } } */
  highScores: Record<string, HighScore>;
  /** Theme preference: "light" | "dark" | "system" */
  theme: "light" | "dark" | "system";
}

export interface HighScore {
  points: number;
  accuracy: number;
  bestStreak: number;
  hits: number;
  total: number;
  /** ISO timestamp of when the high score was set. */
  at: string;
}

export const DEFAULT_PREFS: PersistedPrefs = {
  showNoteNames: false,
  showKeyHints: false,
  keyboardOctave: 4,
  sustain: false,
  volume: 0.6,
  reverb: 0.18,
  tempo: 1,
  mode: "free",
  lastSongId: null,
  highScores: {},
  theme: "system",
};

/** Persisted session-wide stats. */
export interface PersistedStats {
  /** Total notes the user has correctly played (across all sessions). */
  totalNotesPlayed: number;
  /** Total songs completed (any accuracy). */
  songsCompleted: number;
  /** Total seconds spent in Learning Mode (best-effort, based on play time). */
  secondsPlayed: number;
  /** Number of times Free Play was used. */
  freePlaySessions: number;
  /** First-seen ISO timestamp. */
  firstSeenAt: string;
  /** Last-seen ISO timestamp. */
  lastSeenAt: string;
}

function makeDefaultStats(now: string): PersistedStats {
  return {
    totalNotesPlayed: 0,
    songsCompleted: 0,
    secondsPlayed: 0,
    freePlaySessions: 0,
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

// ---------------------------------------------------------------------------
// Prefs
// ---------------------------------------------------------------------------

export function loadPrefs(): PersistedPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
    // Merge with defaults so missing keys (e.g. after a deploy that adds a
    // new pref) don't break.
    return { ...DEFAULT_PREFS, ...parsed, highScores: parsed.highScores ?? {} };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: PersistedPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* localStorage might be full or disabled — ignore */
  }
}

/** Update a single high score for a song. Returns the new high score (which
 *  may be unchanged if the new score isn't higher). */
export function recordHighScore(
  songId: string,
  score: { points: number; accuracy: number; bestStreak: number; hits: number; total: number },
): HighScore | null {
  if (typeof window === "undefined") return null;
  const prefs = loadPrefs();
  const existing = prefs.highScores[songId];
  const isNewBest = !existing || score.points > existing.points;
  if (!isNewBest) return existing;
  const next: HighScore = {
    points: score.points,
    accuracy: score.accuracy,
    bestStreak: score.bestStreak,
    hits: score.hits,
    total: score.total,
    at: new Date().toISOString(),
  };
  prefs.highScores[songId] = next;
  savePrefs(prefs);
  return next;
}

/** Get the high score for a song, or null if none. */
export function getHighScore(songId: string): HighScore | null {
  return loadPrefs().highScores[songId] ?? null;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function loadStats(): PersistedStats {
  if (typeof window === "undefined") return makeDefaultStats(new Date().toISOString());
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_STATS);
    if (!raw) return makeDefaultStats(new Date().toISOString());
    const parsed = JSON.parse(raw) as Partial<PersistedStats>;
    const now = new Date().toISOString();
    return { ...makeDefaultStats(now), ...parsed, lastSeenAt: now };
  } catch {
    return makeDefaultStats(new Date().toISOString());
  }
}

export function saveStats(stats: PersistedStats): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/** Atomically bump one stat field by a delta. Returns the new stats snapshot. */
export function bumpStat(
  field: keyof Omit<PersistedStats, "firstSeenAt" | "lastSeenAt">,
  delta: number,
): PersistedStats {
  const stats = loadStats();
  (stats[field] as number) = Math.max(0, (stats[field] as number) + delta);
  stats.lastSeenAt = new Date().toISOString();
  saveStats(stats);
  return stats;
}

/** Clear all stored prefs + stats. Useful for a "Reset" button. */
export function clearAll(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY_STATS);
  } catch {
    /* ignore */
  }
}
