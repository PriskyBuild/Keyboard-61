// MIT License — Piano Learning App
// Global UI state via Zustand. Audio engine state stays in React hooks because
// it owns Tone.js resources; this store only mirrors user-facing preferences
// and cross-component interaction state.

"use client";

import { create } from "zustand";
import type { Mode, Score, Song } from "@/types";

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

  // ---- Learning mode ----
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  tempo: number; // 0.5..1.5
  setTempo: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
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
}

const initialScore: Score = {
  points: 0,
  hits: 0,
  total: 0,
  streak: 0,
  bestStreak: 0,
};

export const usePianoStore = create<PianoStore>((set, get) => ({
  mode: "free",
  setMode: (mode) => set({ mode }),

  showNoteNames: false,
  toggleNoteNames: () => set((s) => ({ showNoteNames: !s.showNoteNames })),
  setShowNoteNames: (v) => set({ showNoteNames: v }),

  showKeyHints: false,
  toggleKeyHints: () => set((s) => ({ showKeyHints: !s.showKeyHints })),
  setShowKeyHints: (v) => set({ showKeyHints: v }),

  keyboardOctave: 4,
  setKeyboardOctave: (oct) => set({ keyboardOctave: oct }),
  shiftOctave: (delta) =>
    set((s) => {
      const next = Math.max(2, Math.min(6, s.keyboardOctave + delta));
      return { keyboardOctave: next };
    }),

  sustain: false,
  setSustain: (v) => set({ sustain: v }),
  toggleSustain: () => set((s) => ({ sustain: !s.sustain })),

  volume: 0.6,
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  reverb: 0.18,
  setReverb: (v) => set({ reverb: Math.max(0, Math.min(1, v)) }),

  currentSong: null,
  setCurrentSong: (song) => set({ currentSong: song }),
  tempo: 1,
  setTempo: (t) => set({ tempo: Math.max(0.5, Math.min(1.5, t)) }),
  isPlaying: false,
  setIsPlaying: (v) => set({ isPlaying: v }),

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
    // Auto-clear after the flash animation duration.
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        // Only clear if it's still THIS note (avoid clobbering a newer flash).
        if (get().wrongNote === note) set({ wrongNote: null });
      }, 420);
    }
  },
}));

// Expose the store on window for runtime debugging in dev.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as unknown as { __pianoStore?: typeof usePianoStore };
  w.__pianoStore = usePianoStore;
}
