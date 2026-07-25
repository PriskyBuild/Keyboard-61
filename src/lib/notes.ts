// MIT License — Piano Learning App
// Note math + C2..C7 keyboard generator. Pure functions, no Tone.js import
// (Tone is only needed at runtime on the client; this module is SSR-safe).

import type {
  KeyDescriptor,
  NoteName,
  WhiteNoteLetter,
  Accidental,
} from "@/types";

/** Lowest and highest notes on the 61-key keyboard (inclusive). */
export const LOWEST_NOTE = "C2";
export const HIGHEST_NOTE = "C7";

/** Letters in ascending order within an octave. */
export const WHITE_LETTERS: readonly WhiteNoteLetter[] = [
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
] as const;

/**
 * Pitches per octave in MIDI numbering:
 *   C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, G#=8, A=9, A#=10, B=11
 */
const LETTER_TO_SEMITONE: Record<WhiteNoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Parse a note name like "C4", "F#5", "Db3" (flats normalised to sharps). */
export function parseNote(name: string): NoteName {
  const trimmed = name.trim();
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid note name: ${name}`);
  }
  const letter = match[1].toUpperCase() as WhiteNoteLetter;
  // Normalise flats to sharps for our internal representation.
  const rawAccidental = match[2];
  const accidental: Accidental = rawAccidental === "#" || rawAccidental === "b" ? "#" : "";
  const octave = Number.parseInt(match[3], 10);
  return { letter, accidental, octave };
}

/** Stringify a NoteName back to "C4" / "F#5" form. */

/** True if this note name denotes a black key (sharp / flat). */
export function isBlackKey(name: string): boolean {
  const { letter, accidental } = parseNote(name);
  if (accidental === "#") return true;
  // E and B have no sharp in the natural scale.
  if (letter === "E" || letter === "B") return false;
  return false;
}

/** Convert a note name to a MIDI note number (C-1 = 0). */
export function noteToMidi(name: string): number {
  const { letter, accidental, octave } = parseNote(name);
  const semitone = LETTER_TO_SEMITONE[letter] + (accidental === "#" ? 1 : 0);
  return (octave + 1) * 12 + semitone;
}

/** Convert a MIDI number back to a note name (sharps). */
export function midiToNote(midi: number): string {
  const NAMES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ] as const;
  const octave = Math.floor(midi / 12) - 1;
  const pc = ((midi % 12) + 12) % 12;
  return `${NAMES[pc]}${octave}`;
}

/**
 * Frequency in Hz for a note name (equal temperament, A4 = 440 Hz).
 * Formula: f = 440 * 2^((midi - 69) / 12).
 */
export function noteToFrequency(name: string): number {
  const midi = noteToMidi(name);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Enumerate every key from `LOWEST_NOTE` (C2) to `HIGHEST_NOTE` (C7)
 * inclusive. Returns exactly 61 KeyDescriptors.
 *
 * White keys: 5 octaves * 7 + 1 = 36
 * Black keys: 5 octaves * 5 = 25   (no black after the terminal C7)
 */
export function generateKeyboard(): KeyDescriptor[] {
  const keys: KeyDescriptor[] = [];
  const startMidi = noteToMidi(LOWEST_NOTE);
  const endMidi = noteToMidi(HIGHEST_NOTE);

  // Track running white-key index so black keys can reference the preceding white.
  let whiteIndex = -1;

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const name = midiToNote(midi);
    const { letter, accidental, octave } = parseNote(name);
    const isBlack = accidental === "#";

    if (!isBlack) {
      whiteIndex += 1;
    }

    keys.push({
      note: name,
      isBlack,
      octave,
      letter,
      accidental,
      index: keys.length,
      precedingWhiteIndex: isBlack ? whiteIndex : undefined,
    });
  }

  // Sanity-check our math: the user's spec demands exactly 61 keys
  // (36 white + 25 black) for C2..C7 inclusive.
  const whiteCount = keys.filter((k) => !k.isBlack).length;
  const blackCount = keys.filter((k) => k.isBlack).length;
  if (keys.length !== 61 || whiteCount !== 36 || blackCount !== 25) {
    throw new Error(
      `Keyboard invariant violated: got ${keys.length} keys ` +
        `(${whiteCount} white, ${blackCount} black) for range ${LOWEST_NOTE}..${HIGHEST_NOTE}.`,
    );
  }

  return keys;
}

/** Cached 61-key table (cheap to compute but called often). */
let CACHED_KEYBOARD: KeyDescriptor[] | null = null;

/** Return the cached 61-key descriptor table. */
export function getKeyboard(): KeyDescriptor[] {
  if (!CACHED_KEYBOARD) {
    CACHED_KEYBOARD = generateKeyboard();
  }
  return CACHED_KEYBOARD;
}

/** Look up a single key by note name (e.g. "F#4"). Returns null if out of range. */

/** White-key descriptors only. */
export function getWhiteKeys(): KeyDescriptor[] {
  return getKeyboard().filter((k) => !k.isBlack);
}

/** Black-key descriptors only. */
export function getBlackKeys(): KeyDescriptor[] {
  return getKeyboard().filter((k) => k.isBlack);
}

/**
 * Compute the absolute horizontal position (as a fraction of the
 * keyboard width) for a black key, given its preceding white-key index
 * and the total white-key count.
 *
 * Each white key occupies `1 / whiteCount` of the width. A black key sits
 * straddling the boundary between two white keys, centred on that boundary.
 */
export function blackKeyLeftRatio(
  precedingWhiteIndex: number,
  whiteCount: number,
): number {
  const boundary = (precedingWhiteIndex + 1) / whiteCount;
  return boundary - blackKeyWidthRatio(whiteCount) / 2;
}

/** Black-key width as a fraction of the keyboard width. ~62% of a white key. */
export function blackKeyWidthRatio(whiteCount: number): number {
  return (1 / whiteCount) * 0.62;
}

/** Clamp an octave into the keyboard's playable range. */

/** Build a lookup of { note -> { xRatio, widthRatio, isBlack } } for the
 *  entire 61-key keyboard. Used by both useSongPlayer + useLessonEngine
 *  to place falling notes above the correct piano column. */
export interface ColumnInfo {
  xRatio: number;
  widthRatio: number;
  isBlack: boolean;
}

export function buildColumnLookup(): Record<string, ColumnInfo> {
  const whites = getWhiteKeys();
  const blacks = getBlackKeys();
  const whiteCount = whites.length;
  const whiteWidth = 1 / whiteCount;
  const blackWidth = whiteWidth * 0.62;
  const lookup: Record<string, ColumnInfo> = {};

  for (let i = 0; i < whites.length; i++) {
    lookup[whites[i].note] = {
      xRatio: i * whiteWidth,
      widthRatio: whiteWidth,
      isBlack: false,
    };
  }

  for (const b of blacks) {
    if (b.precedingWhiteIndex === undefined) continue;
    const boundary = (b.precedingWhiteIndex + 1) * whiteWidth;
    lookup[b.note] = {
      xRatio: boundary - blackWidth / 2,
      widthRatio: blackWidth,
      isBlack: true,
    };
  }

  return lookup;
}
