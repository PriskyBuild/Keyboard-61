// MIT License — Piano Learning App
// Computer-keyboard -> piano note mapping.
//
// Layout (one octave mapped to a physical row):
//   white: a s d f g h j   ->  C D E F G A B
//   black: w e _ t y u     ->  C# D# - F# G# A#
//   z / x                  ->  shift mapped octave down / up
//
// The mapped octave can be shifted by Z/X; we clamp to [2..6] so the
// mapped octave's 7 notes (C..B) always stay within C2..B6, i.e. inside
// the keyboard's playable range. C7 is reachable only via mouse / touch.

import type { WhiteNoteLetter } from "@/types";

export interface KeyMapping {
  /** Lowercase physical key, e.g. "a". */
  phys: string;
  /** Resulting note name, e.g. "C4". */
  note: string;
  /** True if it maps to a black key. */
  isBlack: boolean;
}

const WHITE_PHYS = ["a", "s", "d", "f", "g", "h", "j"] as const;
const WHITE_LETTERS: readonly WhiteNoteLetter[] = [
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
] as const;

// Indices into WHITE_PHYS that have a black key above them (between this
// white and the next). C# is between C-D, D# between D-E (no E#), F# between
// F-G, G# between G-A, A# between A-B (no B#).
const BLACK_PHYS = [
  { phys: "w", letterIdx: 0, accidental: "#" }, // C#
  { phys: "e", letterIdx: 1, accidental: "#" }, // D#
  { phys: "t", letterIdx: 3, accidental: "#" }, // F#
  { phys: "y", letterIdx: 4, accidental: "#" }, // G#
  { phys: "u", letterIdx: 5, accidental: "#" }, // A#
] as const;

export const OCTAVE_DOWN_KEY = "z";
export const OCTAVE_UP_KEY = "x";

/** Maximum mapped octave so the top of the mapped row (B) stays ≤ B6. */
export const MAX_MAPPED_OCTAVE = 6;
/** Minimum mapped octave so the bottom of the mapped row (C) stays ≥ C2. */
export const MIN_MAPPED_OCTAVE = 2;
export const DEFAULT_MAPPED_OCTAVE = 4;

/** Build the physical-key -> note map for the given octave. */
export function keyboardMap(octave: number): KeyMapping[] {
  const safe = Math.max(
    MIN_MAPPED_OCTAVE,
    Math.min(MAX_MAPPED_OCTAVE, octave),
  );

  const mappings: KeyMapping[] = [];

  for (let i = 0; i < WHITE_PHYS.length; i++) {
    const phys = WHITE_PHYS[i];
    const letter = WHITE_LETTERS[i];
    mappings.push({
      phys,
      note: `${letter}${safe}`,
      isBlack: false,
    });
  }

  for (const b of BLACK_PHYS) {
    const letter = WHITE_LETTERS[b.letterIdx];
    mappings.push({
      phys: b.phys,
      note: `${letter}${b.accidental}${safe}`,
      isBlack: true,
    });
  }

  return mappings;
}

/** Build a { [physKey]: note } lookup object. */
export function keyboardMapLookup(octave: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of keyboardMap(octave)) {
    out[m.phys] = m.note;
  }
  return out;
}

/** Reverse lookup: { [note]: physKey } — used to label keys with their hint. */
export function noteToPhysKey(octave: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of keyboardMap(octave)) {
    out[m.note] = m.phys.toUpperCase();
  }
  return out;
}

/** True if the given (lowercase) physical key is one of the mapping keys. */
export function isMappingKey(phys: string): boolean {
  const all = [...WHITE_PHYS, ...BLACK_PHYS.map((b) => b.phys)];
  return all.includes(phys as (typeof all)[number]);
}
