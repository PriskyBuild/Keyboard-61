// MIT License — Piano Learning App (Phase 2)
// Note matcher — turns raw YIN output {freq, confidence, rms} into a stable
// detected note name, with:
//   - ±50 cents tolerance (a note counts as "the same" if its cents-offset
//     from the expected pitch is within ±50 of equal temperament)
//   - 80ms debounce (note must be stable for ~2 worklet frames before we
//     commit to a detection)
//   - RMS onset detection (we only score a note when its RMS crosses a
//     calibrated threshold — i.e. the user actually pressed a key)
//
// All pure functions — no React, no DOM. Tested via the useLessonEngine hook.

import { midiToNote, noteToFrequency } from "@/lib/notes";
import { applyOctaveGuard } from "@/lib/mic/yin";

/** Minimum YIN confidence to accept a pitch detection. */
export const MIN_CONFIDENCE = 0.85;

/** Tolerance in cents — a note counts as "matching" if it's within ±50 cents. */
export const CENTS_TOLERANCE = 50;

/** Number of consecutive frames a note must be stable before we commit. */
export const STABLE_FRAMES = 2; // ~46ms per frame @ 2048 samples / 44.1kHz ≈ 92ms

/** Cents in an octave. */
const CENTS_PER_OCTAVE = 1200;

/** Result of a single note-matching pass. */
export interface MatchResult {
  /** Detected note name (e.g. "C4") or null if no confident detection. */
  note: string | null;
  /** Cents offset from the nearest equal-temperament pitch (-50..+50). */
  cents: number;
  /** True when the detected note just crossed the RMS onset threshold. */
  onset: boolean;
  /** 0..1 — YIN confidence of the underlying frequency detection. */
  confidence: number;
  /** 0..1 — RMS of the underlying frame. */
  rms: number;
  /** True if the matcher considers this a "silent" frame (low RMS). */
  silent: boolean;
}

/** Persistent state for the matcher (kept across calls). */
export interface MatcherState {
  /** Last accepted note (for debounce). */
  lastNote: string | null;
  /** How many consecutive frames the candidate has been stable. */
  stableCount: number;
  /** The candidate note currently being debounced. */
  candidate: string | null;
  /** Previous frame's RMS (for onset detection). */
  prevRms: number;
  /** True if we already fired an onset for the current note (avoid re-firing). */
  onsetFiredForCurrent: boolean;
}

export function createMatcherState(): MatcherState {
  return {
    lastNote: null,
    stableCount: 0,
    candidate: null,
    prevRms: 0,
    onsetFiredForCurrent: false,
  };
}

/**
 * Convert a frequency in Hz to a MIDI note number (float, for cents calc).
 *
 * Uses the formula: midi = 69 + 12 * log2(freq / 440).
 */
function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Convert a frequency to the nearest note name + cents offset.
 *
 * @returns { note, cents, midi } where cents is in [-50, +50].
 */
export function freqToNote(
  freq: number,
): { note: string; cents: number; midi: number } {
  const midiFloat = freqToMidi(freq);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const note = midiToNote(midi);
  return { note, cents, midi };
}

/**
 * Compare a detected note to an expected note. Returns true if the pitch
 * classes match (e.g. "C4" matches "C5" — the parent-dashboard's
 * octave-forgiveness toggle can disable this).
 *
 * If `octaveForgiveness` is false, the octave must also match.
 */
export function notesMatch(
  detected: string,
  expected: string,
  octaveForgiveness: boolean,
): boolean {
  if (!detected || !expected) return false;
  if (octaveForgiveness) {
    // Compare pitch class only (strip the octave digit).
    const stripOctave = (n: string) => n.replace(/\d+$/, "");
    return stripOctave(detected) === stripOctave(expected);
  }
  return detected === expected;
}

/**
 * Compute the cents offset between a detected frequency and an expected
 * note. Positive = sharp, negative = flat.
 */

/**
 * Run one matching pass.
 *
 * @param input        Raw {freq, confidence, rms} from the worklet.
 * @param state        Mutable matcher state (kept across calls).
 * @param noiseFloor   RMS below which we consider the frame silent.
 * @param expectedNote Optional expected note (for octave-guard correction).
 *                     Pass null for free-listening mode.
 */
export function matchNote(
  input: { freq: number; confidence: number; rms: number },
  state: MatcherState,
  noiseFloor: number,
  expectedNote: string | null,
): MatchResult {
  const { freq, confidence, rms } = input;

  // Silence: RMS below noise floor — no pitch.
  if (rms < noiseFloor) {
    const wasLoud = state.prevRms >= noiseFloor;
    state.prevRms = rms;
    state.stableCount = 0;
    state.candidate = null;
    state.onsetFiredForCurrent = false;
    return {
      note: null,
      cents: 0,
      onset: false,
      confidence,
      rms,
      silent: true,
    };
  }

  // Onset detection: RMS just crossed the noise floor going upward.
  const onset = !state.onsetFiredForCurrent && state.prevRms < noiseFloor;
  if (onset) {
    state.onsetFiredForCurrent = true;
  }
  state.prevRms = rms;

  // Reject low-confidence detections.
  if (freq <= 0 || confidence < MIN_CONFIDENCE) {
    return {
      note: null,
      cents: 0,
      onset,
      confidence,
      rms,
      silent: false,
    };
  }

  // Apply octave guard if we have an expected note.
  const guardedFreq =
    expectedNote !== null
      ? applyOctaveGuard(freq, noteToFrequency(expectedNote))
      : freq;

  const { note, cents } = freqToNote(guardedFreq);

  // Debounce: increment stable count if the candidate matches.
  if (state.candidate === note) {
    state.stableCount += 1;
  } else {
    state.candidate = note;
    state.stableCount = 1;
    state.onsetFiredForCurrent = false;
  }

  if (state.stableCount >= STABLE_FRAMES) {
    state.lastNote = note;
    return {
      note,
      cents,
      onset,
      confidence,
      rms,
      silent: false,
    };
  }

  // Not yet stable — return the last committed note (or null).
  return {
    note: state.lastNote,
    cents: 0,
    onset: false,
    confidence,
    rms,
    silent: false,
  };
}

/**
 * Convenience helper: is a MatchResult a "valid note ready for scoring"?
 * True when we have a confident, non-silent, stable detection.
 */
