// MIT License — Piano Learning App
// Global UI state via Zustand. Audio engine state stays in React hooks because
// it owns Tone.js resources; this store only mirrors user-facing preferences
// and cross-component interaction state.
//
// Persists to localStorage on every preference change. High scores and stats
// are also persisted and surfaced for the UI.

"use client";

import { create } from "zustand";
import type { Mode, Score, Song } from "@/types";
import {
  DEFAULT_PREFS,
  bumpStat,
  loadPrefs,
  loadStats,
  recordHighScore,
  savePrefs,
  saveStats,
  type HighScore,
  type PersistedStats,
} from "@/lib/persistence";

export interface PianoStore {
  // ---- Mode ----
  mode: Mode;
  setMode: (mode: Mode) => void;

  // ---- Free Play toggles ----
  showNoteNames: boolean;
  toggleNoteNames: () => void;
  setShowNoteNames: (v: boolean) => void;

  showKeyHints: boolean;
  toggleKeyHints: () => void;
  setShowKeyHints: (v: boolean) => void;

  // ---- Octave shift for computer-keyboard mapping ----
  keyboardOctave: number;
  setKeyboardOctave: (oct: number) => void;
  shiftOctave: (delta: number) => void;

  // ---- Sustain pedal ----
  sustain: boolean;
  setSustain: (v: boolean) => void;
  toggleSustain: () => void;

  // ---- Master volume (0..1) + reverb wet (0..1) ----
  volume: number;
  setVolume: (v: number) => void;
  reverb: number;
  setReverb: (v: number) => void;

  // ---- Theme ----
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;

  // ---- Learning mode ----
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  tempo: number; // 0.5..1.5
  setTempo: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  /** Practice mode — disables score penalty + enables loop. */
  practiceMode: boolean;
  setPracticeMode: (v: boolean) => void;
  /** Loop the whole song when it ends (only effective in practice mode). */
  loopSong: boolean;
  setLoopSong: (v: boolean) => void;
  /** A-B loop: start beat (0 = song start). null = no A marker. */
  loopStartBeat: number | null;
  setLoopStartBeat: (b: number | null) => void;
  /** A-B loop: end beat (null = song end). null = no B marker. */
  loopEndBeat: number | null;
  setLoopEndBeat: (b: number | null) => void;
  score: Score;
  setScore: (patch: Partial<Score>) => void;
  resetScore: (total?: number) => void;
  /** Currently-active "next note" the user must press (learning mode). */
  nextNote: string | null;
  setNextNote: (note: string | null) => void;
  /** Set of currently-pressed note names (for visual feedback). */
  activeNotes: Set<string>;
  pressNote: (note: string) => void;
  releaseNoteState: (note: string) => void;
  /** Key currently flashing red (wrong press). */
  wrongNote: string | null;
  flashWrong: (note: string) => void;

  // ---- Persistence: high scores + stats ----
  highScores: Record<string, HighScore>;
  /** Commit the current score as a high-score attempt for the given song.
   *  Returns the new high score (or null if no song). */
  commitHighScore: (songId: string) => HighScore | null;
  stats: PersistedStats;
  /** Increment a stat field by a delta (e.g. notesPlayed += 1). */
  bumpStatField: (
    field: keyof Omit<PersistedStats, "firstSeenAt" | "lastSeenAt">,
    delta: number,
  ) => void;
  refreshStats: () => void;
  /** Reset all prefs + stats (with confirmation handled by the caller). */
  resetAll: () => void;
  /** True once we've hydrated from localStorage. Components can wait on
   *  this before reading persistent state to avoid hydration mismatches. */
  hydrated: boolean;
}

const initialScore: Score = {
  points: 0,
  hits: 0,
  total: 0,
  streak: 0,
  bestStreak: 0,
};

// ---------------------------------------------------------------------------
// Initial state — hydrated from localStorage if available.
// ---------------------------------------------------------------------------

function getInitialPrefs() {
  // SSR-safe: returns defaults on the server.
  const prefs = typeof window !== "undefined" ? loadPrefs() : DEFAULT_PREFS;
  return prefs;
}

function getInitialStats() {
  if (typeof window === "undefined") {
    return {
      totalNotesPlayed: 0,
      songsCompleted: 0,
      secondsPlayed: 0,
      freePlaySessions: 0,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    } satisfies PersistedStats;
  }
  return loadStats();
}

const initialPrefs = getInitialPrefs();
const initialStats = getInitialStats();

/** Persist the prefs slice of the store to localStorage. Called after every
 *  pref-mutating setter. No-op on the server. */
function persistPrefs(state: PianoStore): void {
  if (typeof window === "undefined") return;
  savePrefs({
    showNoteNames: state.showNoteNames,
    showKeyHints: state.showKeyHints,
    keyboardOctave: state.keyboardOctave,
    sustain: state.sustain,
    volume: state.volume,
    reverb: state.reverb,
    tempo: state.tempo,
    mode: state.mode,
    lastSongId: state.currentSong?.id ?? null,
    highScores: state.highScores,
    theme: state.theme,
  });
}

export const usePianoStore = create<PianoStore>((set, get) => ({
  // Hydrated initial values
  mode: initialPrefs.mode,
  showNoteNames: initialPrefs.showNoteNames,
  showKeyHints: initialPrefs.showKeyHints,
  keyboardOctave: initialPrefs.keyboardOctave,
  sustain: initialPrefs.sustain,
  volume: initialPrefs.volume,
  reverb: initialPrefs.reverb,
  tempo: initialPrefs.tempo,
  theme: initialPrefs.theme,
  highScores: initialPrefs.highScores,
  stats: initialStats,
  hydrated: typeof window !== "undefined",

  setMode: (mode) => {
    set({ mode });
    persistPrefs(get());
  },

  toggleNoteNames: () => {
    set((s) => ({ showNoteNames: !s.showNoteNames }));
    persistPrefs(get());
  },
  setShowNoteNames: (v) => {
    set({ showNoteNames: v });
    persistPrefs(get());
  },

  toggleKeyHints: () => {
    set((s) => ({ showKeyHints: !s.showKeyHints }));
    persistPrefs(get());
  },
  setShowKeyHints: (v) => {
    set({ showKeyHints: v });
    persistPrefs(get());
  },

  setKeyboardOctave: (oct) => {
    set({ keyboardOctave: Math.max(2, Math.min(6, oct)) });
    persistPrefs(get());
  },
  shiftOctave: (delta) => {
    set((s) => ({
      keyboardOctave: Math.max(2, Math.min(6, s.keyboardOctave + delta)),
    }));
    persistPrefs(get());
  },

  setSustain: (v) => {
    set({ sustain: v });
    persistPrefs(get());
  },
  toggleSustain: () => {
    set((s) => ({ sustain: !s.sustain }));
    persistPrefs(get());
  },

  setVolume: (v) => {
    set({ volume: Math.max(0, Math.min(1, v)) });
    persistPrefs(get());
  },
  setReverb: (v) => {
    set({ reverb: Math.max(0, Math.min(1, v)) });
    persistPrefs(get());
  },

  setTheme: (t) => {
    set({ theme: t });
    persistPrefs(get());
  },

  currentSong: null,
  setCurrentSong: (song) => {
    set({ currentSong: song });
    persistPrefs(get());
  },
  setTempo: (t) => {
    set({ tempo: Math.max(0.5, Math.min(1.5, t)) });
    persistPrefs(get());
  },
  isPlaying: false,
  setIsPlaying: (v) => set({ isPlaying: v }),

  practiceMode: false,
  setPracticeMode: (v) => set({ practiceMode: v }),
  loopSong: false,
  setLoopSong: (v) => set({ loopSong: v }),
  loopStartBeat: null,
  setLoopStartBeat: (b) => set({ loopStartBeat: b }),
  loopEndBeat: null,
  setLoopEndBeat: (b) => set({ loopEndBeat: b }),

  score: { ...initialScore },
  setScore: (patch) =>
    set((s) => ({
      score: { ...s.score, ...patch },
    })),
  resetScore: (total = 0) =>
    set(() => ({
      score: { ...initialScore, total },
    })),

  nextNote: null,
  setNextNote: (note) => set({ nextNote: note }),

  activeNotes: new Set<string>(),
  pressNote: (note) =>
    set((s) => {
      const next = new Set(s.activeNotes);
      next.add(note);
      return { activeNotes: next };
    }),
  releaseNoteState: (note) =>
    set((s) => {
      const next = new Set(s.activeNotes);
      next.delete(note);
      return { activeNotes: next };
    }),

  wrongNote: null,
  flashWrong: (note) => {
    set({ wrongNote: note });
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (get().wrongNote === note) set({ wrongNote: null });
      }, 420);
    }
  },

  commitHighScore: (songId) => {
    const score = get().score;
    const accuracy =
      score.total > 0 ? Math.round((score.hits / score.total) * 100) : 0;
    const next = recordHighScore(songId, {
      points: score.points,
      accuracy,
      bestStreak: score.bestStreak,
      hits: score.hits,
      total: score.total,
    });
    if (next) {
      set((s) => ({
        highScores: { ...s.highScores, [songId]: next },
      }));
      persistPrefs(get());
    }
    return next;
  },

  bumpStatField: (field, delta) => {
    const next = bumpStat(field, delta);
    set({ stats: next });
  },
  refreshStats: () => {
    set({ stats: loadStats() });
  },

  resetAll: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("piano-app:v1");
      window.localStorage.removeItem("piano-app:stats:v1");
    }
    const freshPrefs = loadPrefs();
    const freshStats = loadStats();
    set({
      mode: freshPrefs.mode,
      showNoteNames: freshPrefs.showNoteNames,
      showKeyHints: freshPrefs.showKeyHints,
      keyboardOctave: freshPrefs.keyboardOctave,
      sustain: freshPrefs.sustain,
      volume: freshPrefs.volume,
      reverb: freshPrefs.reverb,
      tempo: freshPrefs.tempo,
      theme: freshPrefs.theme,
      highScores: {},
      stats: freshStats,
      currentSong: null,
      score: { ...initialScore },
      nextNote: null,
    });
  },
}));

// Expose the store on window for runtime debugging in dev.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as unknown as { __pianoStore?: typeof usePianoStore };
  w.__pianoStore = usePianoStore;
}

// Save stats once on mount to refresh lastSeenAt.
if (typeof window !== "undefined") {
  saveStats(loadStats());
}
