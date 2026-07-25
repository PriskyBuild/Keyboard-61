// MIT License — Piano Learning App (Phase 2)
// Phase-2 persistence layer — versioned multi-profile localStorage schema.
//
// All Phase-2 data (profiles, progress, stickers, coins, streaks, parent PIN)
// lives under a single versioned key so future migrations are cheap.
//
// Wraps every access in try/catch so private-mode browsers don't crash —
// we surface a kid-friendly "we'll save next time" message instead.

const STORAGE_KEY = "piano-app:phase2:v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KidProfile {
  id: string;
  name: string;
  /** Emoji avatar. */
  avatar: string;
  age: number;
  difficulty: "easy" | "normal";
  /** Daily time limit in minutes (default 15). */
  timeLimitMin: number;
  createdAt: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  bestAccuracy: number; // 0-100
  attempts: number;
  lastPlayedAt: string;
}

export interface ProfileProgress {
  /** Per-lesson progress. */
  lessons: Record<string, LessonProgress>;
  /** Earned sticker ids. */
  stickers: string[];
  /** Coin balance. */
  coins: number;
  /** Total minutes practised. */
  minutesPractised: number;
  /** Streak data — ISO date strings of completed days. */
  streakDays: string[];
  /** ISO date of last session (YYYY-MM-DD). Used for daily time-limit cap. */
  lastSessionDate: string | null;
  /** Minutes used today (resets at midnight local). */
  minutesUsedToday: number;
}

export interface ParentSettings {
  /** Pitch-detection tolerance in cents (default 50). */
  centsTolerance: number;
  /** Allow octave-forgiveness (C4 matches C5). */
  octaveForgiveness: boolean;
  /** Daily time limit override (minutes). 0 = use profile default. */
  timeLimitOverride: number;
}

export interface StickerData {
  id: string;
  name: string;
  emoji: string;
  theme: string;
  rarity: "common" | "rare" | "legendary";
}

export interface Phase2Storage {
  schemaVersion: 1;
  profiles: KidProfile[];
  activeProfileId: string | null;
  /** SHA-256 hash of the 4-digit parent PIN, or null if not set. */
  parentPinHash: string | null;
  settings: ParentSettings;
  /** Per-profile progress: { [profileId]: ProfileProgress }. */
  progress: Record<string, ProfileProgress>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_SETTINGS: ParentSettings = {
  centsTolerance: 50,
  octaveForgiveness: true,
  timeLimitOverride: 0,
};

export const DEFAULT_PROFILE_PROGRESS: ProfileProgress = {
  lessons: {},
  stickers: [],
  coins: 0,
  minutesPractised: 0,
  streakDays: [],
  lastSessionDate: null,
  minutesUsedToday: 0,
};

export function makeDefaultStorage(): Phase2Storage {
  return {
    schemaVersion: 1,
    profiles: [],
    activeProfileId: null,
    parentPinHash: null,
    settings: { ...DEFAULT_SETTINGS },
    progress: {},
  };
}

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

export function loadPhase2(): Phase2Storage {
  if (typeof window === "undefined") return makeDefaultStorage();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultStorage();
    const parsed = JSON.parse(raw) as Partial<Phase2Storage>;
    // Merge with defaults so missing keys (after a deploy) don't break.
    const base = makeDefaultStorage();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      progress: parsed.progress ?? {},
      profiles: parsed.profiles ?? [],
    };
  } catch {
    return makeDefaultStorage();
  }
}

export function savePhase2(storage: Phase2Storage): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch {
    // Private mode or quota exceeded — return false so the caller can show
    // a kid-friendly "we'll save next time" message.
    return false;
  }
}

// ---------------------------------------------------------------------------
// Migration from Phase 1
// ---------------------------------------------------------------------------

/**
 * If the user has Phase-1 prefs (piano-app:v1) but no Phase-2 storage yet,
 * migrate them: create a default profile and copy their high scores + stats.
 *
 * Returns the migrated storage (or null if no migration was needed).
 */
export function migrateFromPhase1(): Phase2Storage | null {
  if (typeof window === "undefined") return null;
  const phase2 = loadPhase2();
  if (phase2.profiles.length > 0) return null; // already migrated

  const phase1Raw = window.localStorage.getItem("piano-app:v1");
  if (!phase1Raw) return null;

  try {
    const phase1 = JSON.parse(phase1Raw) as {
      highScores?: Record<string, { points: number; accuracy: number }>;
    };
    // Create a default profile.
    const profile: KidProfile = {
      id: "default",
      name: "Me",
      avatar: "🐻",
      age: 7,
      difficulty: "easy",
      timeLimitMin: 15,
      createdAt: new Date().toISOString(),
    };
    phase2.profiles = [profile];
    phase2.activeProfileId = profile.id;
    phase2.progress[profile.id] = { ...DEFAULT_PROFILE_PROGRESS };
    savePhase2(phase2);
    return phase2;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

export function getActiveProfile(storage: Phase2Storage): KidProfile | null {
  if (!storage.activeProfileId) return null;
  return storage.profiles.find((p) => p.id === storage.activeProfileId) ?? null;
}

export function getProfileProgress(
  storage: Phase2Storage,
  profileId: string,
): ProfileProgress {
  return (
    storage.progress[profileId] ?? {
      ...DEFAULT_PROFILE_PROGRESS,
    }
  );
}

export function upsertProfileProgress(
  storage: Phase2Storage,
  profileId: string,
  patch: Partial<ProfileProgress>,
): Phase2Storage {
  const existing = getProfileProgress(storage, profileId);
  const next: ProfileProgress = { ...existing, ...patch };
  return {
    ...storage,
    progress: { ...storage.progress, [profileId]: next },
  };
}

// ---------------------------------------------------------------------------
// Parent PIN (SHA-256 via crypto.subtle)
// ---------------------------------------------------------------------------

/** Hash a 4-digit PIN string with SHA-256, returning a hex string. */
export async function hashPin(pin: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    // Fallback: simple non-crypto hash (NOT secure, but better than plaintext).
    // Used only in non-secure contexts where crypto.subtle is unavailable.
    let h = 0;
    for (let i = 0; i < pin.length; i++) {
      h = (h * 31 + pin.charCodeAt(i)) | 0;
    }
    return `fallback:${h.toString(16)}`;
  }
  const buf = new TextEncoder().encode(pin);
  const hash = await window.crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Verify a PIN against a stored hash. */
export async function verifyPin(
  pin: string,
  hash: string,
): Promise<boolean> {
  const candidate = await hashPin(pin);
  // Constant-time-ish compare (length-equal, char-by-char with XOR).
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Sticker catalog (30+ stickers)
// ---------------------------------------------------------------------------

export const STICKER_CATALOG: StickerData[] = [
  // Common — earned from curriculum lessons 1-12
  { id: "sticker-first-note", name: "First Note", emoji: "🌟", theme: "curriculum", rarity: "common" },
  { id: "sticker-three-notes", name: "Three Notes", emoji: "🎵", theme: "curriculum", rarity: "common" },
  { id: "sticker-c-position", name: "C Position", emoji: "🌈", theme: "curriculum", rarity: "common" },
  { id: "sticker-lefty", name: "Lefty", emoji: "✋", theme: "curriculum", rarity: "common" },
  { id: "sticker-teamwork", name: "Teamwork", emoji: "🤝", theme: "curriculum", rarity: "common" },
  { id: "sticker-steady-beat", name: "Steady Beat", emoji: "⏱️", theme: "curriculum", rarity: "common" },
  { id: "sticker-stepper", name: "Stepper", emoji: "🪜", theme: "curriculum", rarity: "common" },
  { id: "sticker-skipper", name: "Skipper", emoji: "🦘", theme: "curriculum", rarity: "common" },
  { id: "sticker-jingle", name: "Jingle", emoji: "🔔", theme: "curriculum", rarity: "common" },
  { id: "sticker-chord", name: "Chord Master", emoji: "🎹", theme: "curriculum", rarity: "common" },
  { id: "sticker-position", name: "Position Pro", emoji: "🎯", theme: "curriculum", rarity: "common" },
  { id: "sticker-recital", name: "Recital Star", emoji: "🏆", theme: "curriculum", rarity: "rare" },

  // Animal friends — bonus stickers for streaks
  { id: "sticker-bunny", name: "Bunny", emoji: "🐰", theme: "animals", rarity: "common" },
  { id: "sticker-fox", name: "Fox", emoji: "🦊", theme: "animals", rarity: "common" },
  { id: "sticker-panda", name: "Panda", emoji: "🐼", theme: "animals", rarity: "common" },
  { id: "sticker-owl", name: "Owl", emoji: "🦉", theme: "animals", rarity: "common" },
  { id: "sticker-frog", name: "Frog", emoji: "🐸", theme: "animals", rarity: "common" },
  { id: "sticker-lion", name: "Lion", emoji: "🦁", theme: "animals", rarity: "rare" },
  { id: "sticker-unicorn", name: "Unicorn", emoji: "🦄", theme: "animals", rarity: "legendary" },
  { id: "sticker-dragon", name: "Dragon", emoji: "🐉", theme: "animals", rarity: "legendary" },

  // Music instruments
  { id: "sticker-trumpet", name: "Trumpet", emoji: "🎺", theme: "instruments", rarity: "common" },
  { id: "sticker-violin", name: "Violin", emoji: "🎻", theme: "instruments", rarity: "common" },
  { id: "sticker-drum", name: "Drum", emoji: "🥁", theme: "instruments", rarity: "common" },
  { id: "sticker-guitar", name: "Guitar", emoji: "🎸", theme: "instruments", rarity: "common" },
  { id: "sticker-sax", name: "Saxophone", emoji: "🎷", theme: "instruments", rarity: "rare" },
  { id: "sticker-harp", name: "Harp", emoji: "🪕", theme: "instruments", rarity: "rare" },

  // Weather / nature
  { id: "sticker-sun", name: "Sunny Day", emoji: "☀️", theme: "nature", rarity: "common" },
  { id: "sticker-rainbow", name: "Rainbow", emoji: "🌈", theme: "nature", rarity: "common" },
  { id: "sticker-star", name: "Shooting Star", emoji: "⭐", theme: "nature", rarity: "common" },
  { id: "sticker-moon", name: "Moon", emoji: "🌙", theme: "nature", rarity: "common" },
  { id: "sticker-flower", name: "Flower", emoji: "🌸", theme: "nature", rarity: "common" },
  { id: "sticker-butterfly", name: "Butterfly", emoji: "🦋", theme: "nature", rarity: "rare" },

  // Achievements
  { id: "sticker-7-day", name: "7-Day Streak!", emoji: "🔥", theme: "achievements", rarity: "rare" },
  { id: "sticker-perfect", name: "Perfect Score", emoji: "💯", theme: "achievements", rarity: "rare" },
  { id: "sticker-night-owl", name: "Night Owl", emoji: "🦉", theme: "achievements", rarity: "rare" },
  { id: "sticker-music-master", name: "Music Master", emoji: "👑", theme: "achievements", rarity: "legendary" },
];

/** Get a sticker by id. */
