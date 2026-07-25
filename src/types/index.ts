// MIT License — Piano Learning App
// Shared TypeScript types used across the app.

/** Pitch class letters, no accidentals. */
export type WhiteNoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** Accidental that can follow a letter (empty string = natural). */
export type Accidental = "" | "#";

/** A parsed note identifier like "C4" or "F#5". */
export interface NoteName {
  letter: WhiteNoteLetter;
  accidental: Accidental;
  octave: number;
}

/** Physical key descriptor on the 61-key keyboard. */
export interface KeyDescriptor {
  /** Full note name, e.g. "C4", "F#5". */
  note: string;
  /** True for black keys (sharps). */
  isBlack: boolean;
  /** Octave number (e.g. 4 for "C4"). */
  octave: number;
  /** Letter only (no accidental). */
  letter: WhiteNoteLetter;
  /** Optional accidental. */
  accidental: Accidental;
  /** Index of this key in the full 61-key sequence (0..60). */
  index: number;
  /** Index of the white key preceding a black key (used for absolute positioning). */
  precedingWhiteIndex?: number;
}

/** A single note event inside a song. */
export interface SongNote {
  /** Note name, e.g. "C4". Use "REST" for a rest. */
  note: string;
  /** Duration in beats (1 = quarter note). */
  duration: number;
  /** Start time in beats from song start. */
  start: number;
}

/** Difficulty label for song cards. */
export type Difficulty = "Beginner" | "Easy" | "Intermediate";

/** A learnable song. */
export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  /** Optional short description. */
  description?: string;
  notes: SongNote[];
}

/** App-level mode. */
export type Mode = "free" | "learn";

/** Falling-notes visualizer event derived from a song note. */
export interface VisualizerNote {
  id: string;
  note: string;
  /** Start time in seconds (already tempo-scaled). */
  startSec: number;
  /** Duration in seconds (already tempo-scaled). */
  durationSec: number;
  /** X position (0..1) of the column this note falls into. */
  xRatio: number;
  /** Width (0..1) of the column. */
  widthRatio: number;
  isBlack: boolean;
}

/** Score state for Learning Mode. */
export interface Score {
  /** Total points. */
  points: number;
  /** Number of correctly-hit notes. */
  hits: number;
  /** Number of expected notes (correct + missed). */
  total: number;
  /** Current streak. */
  streak: number;
  /** Best streak so far. */
  bestStreak: number;
}

/** Audio engine state exposed to React. */
export interface AudioEngineState {
  ready: boolean;
  /** True when Sampler loaded; false when using PolySynth fallback. */
  usingFallback: boolean;
  error: string | null;
}
