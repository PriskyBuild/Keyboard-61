// MIT License — Piano Learning App (Phase 2)
// AudioWorklet processor that runs YIN pitch detection.
//
// This file MUST be plain JS (not TypeScript) and MUST live in /public/ so
// Next.js serves it at a stable URL (/worklets/yin-processor.js). It runs
// in the AudioWorkletGlobalScope, which has its own global — no `window`,
// no `import` statements.
//
// The YIN algorithm is inlined here (rather than imported) because the
// AudioWorkletGlobalScope cannot import arbitrary modules. The algorithm
// is duplicated in src/lib/mic/yin.ts (TypeScript) for the ScriptProcessor
// fallback. Keep them in sync.

const FRAME_SIZE = 2048;
const THRESHOLD = 0.10;
const MIN_FREQ = 60; // B1 — below this we report "no pitch"
const MAX_FREQ = 2100; // C7 — above this we report "no pitch"

class YinProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(FRAME_SIZE);
    this.frameIndex = 0;
    this.frameCount = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    // Accumulate samples into our 2048-sample buffer.
    let i = 0;
    while (i < channel.length) {
      const remaining = FRAME_SIZE - this.frameIndex;
      const chunk = Math.min(remaining, channel.length - i);
      for (let j = 0; j < chunk; j++) {
        this.buffer[this.frameIndex + j] = channel[i + j];
      }
      this.frameIndex += chunk;
      i += chunk;

      if (this.frameIndex >= FRAME_SIZE) {
        // Buffer is full — run YIN.
        const result = this.detectPitch(this.buffer, sampleRate);
        // Compute RMS for onset detection.
        let sum = 0;
        for (let k = 0; k < this.buffer.length; k++) {
          sum += this.buffer[k] * this.buffer[k];
        }
        const rms = Math.sqrt(sum / this.buffer.length);

        try {
          this.port.postMessage({
            freq: result.freq,
            confidence: result.confidence,
            rms: rms,
            frame: this.frameCount,
          });
        } catch (e) {
          // main thread may have gone away — ignore
        }
        this.frameIndex = 0;
        this.frameCount += 1;
      }
    }
    return true;
  }

  detectPitch(buffer, sampleRate) {
    const yinBufferLength = FRAME_SIZE / 2;
    const yinBuffer = new Float32Array(yinBufferLength);

    // Step 1: difference function
    for (let tau = 0; tau < yinBufferLength; tau++) {
      let sum = 0;
      for (let i = 0; i < yinBufferLength; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    // Step 2: cumulative mean normalized difference
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < yinBufferLength; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
    }

    // Step 3: absolute threshold
    let tauEstimate = -1;
    for (let tau = 2; tau < yinBufferLength; tau++) {
      if (yinBuffer[tau] < THRESHOLD) {
        // Find the local minimum after going below threshold
        while (tau + 1 < yinBufferLength && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    if (tauEstimate === -1) {
      // No pitch found below threshold — return the global minimum if it's
      // not too high, else report no pitch.
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

    // Step 4: parabolic interpolation
    let betterTau;
    const x0 = tauEstimate > 0 ? tauEstimate - 1 : tauEstimate;
    const x2 = tauEstimate + 1 < yinBufferLength ? tauEstimate + 1 : tauEstimate;
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

    // Range check
    if (freq < MIN_FREQ || freq > MAX_FREQ) {
      return { freq: -1, confidence: 0 };
    }

    // Confidence = 1 - minimum yin value (0..1)
    let minVal = Infinity;
    for (let tau = 2; tau < yinBufferLength; tau++) {
      if (yinBuffer[tau] < minVal) minVal = yinBuffer[tau];
    }
    const confidence = Math.max(0, Math.min(1, 1 - minVal));

    return { freq: freq, confidence: confidence };
  }
}

registerProcessor("yin-processor", YinProcessor);
