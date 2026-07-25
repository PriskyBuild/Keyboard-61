// MIT License — Piano Learning App (Phase 2)
// YIN pitch detection algorithm — pure TypeScript implementation.
//
// This is the main-thread version used by the ScriptProcessor fallback (when
// AudioWorklet is unavailable). The worklet file at
// public/worklets/yin-processor.js contains an inlined copy of the same
// algorithm because AudioWorkletGlobalScope cannot import arbitrary modules.
// Keep the two implementations in sync.
//
// Reference: de Cheveigné & Kawahara (2002) "YIN, a fundamental frequency
// estimator for speech and music". JASA 111(4):1917-30.

/** Output of a single YIN pass. */
export interface YinResult {
  /** Detected fundamental frequency in Hz, or -1 if no clear pitch. */
  freq: number;
  /** 0..1 — confidence = 1 - minimum yin buffer value. */
  confidence: number;
}

/** Detection constants — must match the worklet. */
export const YIN_FRAME_SIZE = 2048;
export const YIN_THRESHOLD = 0.1;
export const YIN_MIN_FREQ = 60; // B1
export const YIN_MAX_FREQ = 2100; // C7

/**
 * Run YIN on a buffer of Float32 samples.
 *
 * @param buffer     PCM samples (typically 2048).
 * @param sampleRate e.g. 44100.
 * @returns { freq, confidence }. freq=-1 if no pitch was detected.
 */
export function detectPitchYin(
  buffer: Float32Array,
  sampleRate: number,
): YinResult {
  const bufferSize = buffer.length;
  const yinBufferLength = Math.floor(bufferSize / 2);
  if (yinBufferLength < 4) {
    return { freq: -1, confidence: 0 };
  }
  const yinBuffer = new Float32Array(yinBufferLength);

  // Step 1: difference function d(tau) = sum_i (x[i] - x[i+tau])^2
  for (let tau = 0; tau < yinBufferLength; tau++) {
    let sum = 0;
    for (let i = 0; i < yinBufferLength; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // Step 2: cumulative mean normalized difference
  // d'(tau) = d(tau) * tau / sum_{j=1..tau} d(j)
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBufferLength; tau++) {
    runningSum += yinBuffer[tau];
    if (runningSum === 0) {
      yinBuffer[tau] = 1;
    } else {
      yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum;
    }
  }

  // Step 3: absolute threshold — find first tau where d'(tau) < THRESHOLD,
  // then walk forward to the local minimum.
  let tauEstimate = -1;
  for (let tau = 2; tau < yinBufferLength; tau++) {
    if (yinBuffer[tau] < YIN_THRESHOLD) {
      while (tau + 1 < yinBufferLength && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    // No tau crossed the threshold. Fall back to the global minimum, but
    // only if it's reasonably low (otherwise report "no pitch").
    let minVal = Infinity;
    let minTau = -1;
    for (let tau = 2; tau < yinBufferLength; tau++) {
      if (yinBuffer[tau] < minVal) {
        minVal = yinBuffer[tau];
        minTau = tau;
      }
    }
    if (minTau === -1 || minVal > 0.5) {
      return { freq: -1, confidence: 0 };
    }
    tauEstimate = minTau;
  }

  // Step 4: parabolic interpolation around tauEstimate for sub-sample
  // accuracy. Fit a parabola to (x0,s0), (tau,s1), (x2,s2) and find its
  // minimum.
  const x0 = tauEstimate > 0 ? tauEstimate - 1 : tauEstimate;
  const x2 =
    tauEstimate + 1 < yinBufferLength ? tauEstimate + 1 : tauEstimate;
  let betterTau: number;
  if (x0 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
  } else if (x2 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
  } else {
    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[x2];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom === 0) {
      betterTau = tauEstimate;
    } else {
      betterTau = tauEstimate + (s2 - s0) / denom;
    }
  }

  let freq = sampleRate / betterTau;

  // Range check — pianos don't go below B1 or above C7.
  if (freq < YIN_MIN_FREQ || freq > YIN_MAX_FREQ) {
    return { freq: -1, confidence: 0 };
  }

  // Confidence = 1 - minimum yin value (clamped to [0,1]).
  let minVal = Infinity;
  for (let tau = 2; tau < yinBufferLength; tau++) {
    if (yinBuffer[tau] < minVal) minVal = yinBuffer[tau];
  }
  const confidence = Math.max(0, Math.min(1, 1 - minVal));

  return { freq, confidence };
}

/**
 * Octave-error guard: if the detected frequency is approximately 2× or 0.5×
 * the expected frequency, prefer the candidate nearest the expected pitch.
 *
 * Piano strings have strong harmonics that YIN sometimes locks onto. This
 * helper nudges the detected frequency back to the expected octave when the
 * error is exactly one octave.
 *
 * @param detectedFreq  The frequency reported by YIN.
 * @param expectedFreq  The frequency the matcher expects (or null if no
 *                      expectation — returns detectedFreq unchanged).
 * @returns The "corrected" frequency.
 */
export function applyOctaveGuard(
  detectedFreq: number,
  expectedFreq: number | null,
): number {
  if (expectedFreq === null || detectedFreq < 0) return detectedFreq;
  const ratio = detectedFreq / expectedFreq;
  // If the detected freq is within 3% of 2× the expected, halve it.
  if (Math.abs(ratio - 2) < 0.03) return detectedFreq / 2;
  // If the detected freq is within 3% of 0.5× the expected, double it.
  if (Math.abs(ratio - 0.5) < 0.03) return detectedFreq * 2;
  return detectedFreq;
}
