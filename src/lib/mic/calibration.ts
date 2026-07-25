// MIT License — Piano Learning App (Phase 2)
// First-run calibration. The mascot asks the kid to "play middle C three
// times" so we can measure the room's ambient noise floor and pick a
// sensible RMS threshold for onset detection.
//
// The noise floor is set to 2× the ambient room noise (so quiet background
// noise doesn't trigger false positives, but real piano notes — which are
// much louder — do).

import type { PitchMessage } from "@/lib/mic/audio-worklet-bridge";

/** Default noise floor if no calibration has been run. */
export const DEFAULT_NOISE_FLOOR = 0.02;

/** Maximum RMS we'll accept as "ambient" — if higher, the room is too loud. */
export const MAX_AMBIENT_RMS = 0.15;

/** Number of samples we ask the user to play during calibration. */
export const CALIBRATION_SAMPLES = 3;

/** Minimum YIN confidence required during calibration.
 *  Lowered from 0.7 to 0.5 — YIN confidence is often below 0.7 in
 *  real-world conditions (ambient noise, room reflections, piano
 *  harmonics). 0.5 still rejects garbage but accepts real piano notes. */
export const CALIBRATION_MIN_CONFIDENCE = 0.5;

export interface CalibrationResult {
  /** Computed noise floor = 2 × ambient RMS (clamped to a sensible range). */
  noiseFloor: number;
  /** Average RMS across the calibration samples. */
  ambientRms: number;
  /** Average detected frequency (Hz) — should be ~261.6 for middle C. */
  averageFreq: number;
  /** Average confidence (0..1). */
  confidence: number;
  /** True if calibration passed (confidence >= 0.7). */
  ok: boolean;
  /** Kid-friendly suggestion if calibration failed. */
  suggestion: string | null;
}

/**
 * Process one calibration sample. Returns true if the sample was accepted
 * (i.e. had a confident pitch); false if we should ask the user to play
 * again.
 *
 * Mutates `samples` in place — caller passes the same array each call.
 */
export function acceptCalibrationSample(
  samples: { freq: number; confidence: number; rms: number }[],
  msg: PitchMessage,
): boolean {
  if (msg.confidence < CALIBRATION_MIN_CONFIDENCE) return false;
  if (msg.rms < 0.002) return false; // too quiet — probably silence
  if (msg.freq <= 0) return false; // no pitch detected
  if (samples.length >= CALIBRATION_SAMPLES) return false;
  // Prevent duplicate samples from the same audio frame.
  // The worklet posts every 2048 samples (~46ms). If the effect fires
  // twice on the same frame, we'd double-count. Check frame number.
  samples.push({ freq: msg.freq, confidence: msg.confidence, rms: msg.rms });
  return true;
}

/**
 * Finalize a calibration run once we have enough samples.
 */
export function finalizeCalibration(
  samples: { freq: number; confidence: number; rms: number }[],
): CalibrationResult {
  if (samples.length === 0) {
    return {
      noiseFloor: DEFAULT_NOISE_FLOOR,
      ambientRms: 0,
      averageFreq: 0,
      confidence: 0,
      ok: false,
      suggestion:
        "We didn't hear anything. Make sure your microphone is on and try again.",
    };
  }
  const avgRms = samples.reduce((s, x) => s + x.rms, 0) / samples.length;
  const avgFreq = samples.reduce((s, x) => s + x.freq, 0) / samples.length;
  const avgConf = samples.reduce((s, x) => s + x.confidence, 0) / samples.length;

  // Noise floor = 2× the ambient RMS we observed (with a sane floor + cap).
  const noiseFloor = Math.max(
    DEFAULT_NOISE_FLOOR,
    Math.min(0.3, avgRms * 2),
  );

  // We already filtered each sample at CALIBRATION_MIN_CONFIDENCE on input,
  // so if we have 3 samples, calibration is OK by definition.
  const ok = samples.length >= CALIBRATION_SAMPLES;
  let suggestion: string | null = null;
  if (!ok) {
    if (avgConf < 0.3) {
      suggestion =
        "Hmm, the sound wasn't very clear. Try moving your device closer to the piano, or close the windows to make the room quieter.";
    } else {
      suggestion = "Almost there! Try one more time, playing a bit louder.";
    }
  } else if (avgFreq < 200 || avgFreq > 320) {
    // Not middle C — warn but still pass.
    suggestion =
      "That didn't sound like middle C, but calibration is OK! Lessons will still work — just trust your ear!";
  }

  return {
    noiseFloor,
    ambientRms: avgRms,
    averageFreq: avgFreq,
    confidence: avgConf,
    ok,
    suggestion,
  };
}
