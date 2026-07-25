// MIT License — Piano Learning App (Phase 2)
// Bridge between React and the AudioWorklet that runs YIN pitch detection.
//
// The worklet file lives at /public/worklets/yin-processor.js (served by
// Next.js at /worklets/yin-processor.js). We dynamically import it via
// `audioContext.audioWorklet.addModule('/worklets/yin-processor.js')`.
//
// If AudioWorklet is unavailable (Safari < 14.1, old browsers), we fall back
// to a ScriptProcessorNode with a console warning. ScriptProcessorNode runs
// on the main thread (jankier) but produces the same Float32 frame shape.

import type { MicCaptureHandle } from "@/lib/mic/capture";

/** Shape of messages posted from the worklet to the main thread. */
export interface PitchMessage {
  /** Detected fundamental frequency in Hz, or -1 if no clear pitch. */
  freq: number;
  /** 0..1 — YIN confidence (1 - minimum difference value). */
  confidence: number;
  /** 0..1 — RMS of the current frame (used for onset detection). */
  rms: number;
  /** Frame index (monotonic, for debugging). */
  frame: number;
}

export type PitchListener = (msg: PitchMessage) => void;

export interface WorkletBridge {
  /** Start listening for pitch messages. Returns an unsubscribe fn. */
  subscribe: (listener: PitchListener) => () => void;
  /** Disconnect the worklet node + remove all listeners. Idempotent. */
  disconnect: () => void;
  /** True if we're using the ScriptProcessor fallback. */
  usingFallback: boolean;
}

const WORKLET_URL = "/worklets/yin-processor.js";
const FRAME_SIZE = 2048;

/**
 * Wire up a YIN AudioWorklet to a mic capture handle.
 *
 * Returns a bridge with subscribe/disconnect. The caller owns the
 * MicCaptureHandle and is responsible for calling its `stop()` — this
 * module only connects/disconnects the worklet node.
 */
export async function attachPitchWorklet(
  handle: MicCaptureHandle,
): Promise<WorkletBridge> {
  const { audioContext, sourceNode } = handle;
  const listeners = new Set<PitchListener>();
  let usingFallback = false;
  let workletNode: AudioWorkletNode | null = null;
  let scriptNode: ScriptProcessorNode | null = null;
  let frameBuffer = new Float32Array(FRAME_SIZE);
  let frameIndex = 0;
  let frameCount = 0;

  const dispatch = (msg: PitchMessage) => {
    for (const l of listeners) {
      try {
        l(msg);
      } catch {
        /* listener threw — ignore, keep others alive */
      }
    }
  };

  // Try AudioWorklet first.
  let workletOk = false;
  try {
    if (
      typeof audioContext.audioWorklet === "object" &&
      typeof audioContext.audioWorklet.addModule === "function"
    ) {
      await audioContext.audioWorklet.addModule(WORKLET_URL);
      workletNode = new AudioWorkletNode(audioContext, "yin-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });
      workletNode.port.onmessage = (
        e: MessageEvent<PitchMessage>,
      ) => {
        dispatch(e.data);
      };
      sourceNode.connect(workletNode);
      workletOk = true;
    }
  } catch {
    /* fall through to ScriptProcessor */
  }

  if (!workletOk) {
    // Fallback: ScriptProcessorNode. Runs YIN on the main thread (jankier).
    if (typeof console !== "undefined") {
      console.warn(
        "[mic] AudioWorklet unavailable — falling back to ScriptProcessorNode. " +
          "Pitch detection will run on the main thread and may be janky.",
      );
    }
    usingFallback = true;
    // Buffer samples ourselves (ScriptProcessor gives us chunks, not 2048).
    scriptNode = audioContext.createScriptProcessor(1024, 1, 0);
    scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      const remaining = FRAME_SIZE - frameIndex;
      if (input.length >= remaining) {
        // Fill the rest of the buffer, run YIN, dispatch.
        frameBuffer.set(input.subarray(0, remaining), frameIndex);
        // Run YIN via the worklet's inlined algorithm. We import the pure
        // implementation from yin.ts (main-thread version) to avoid
        // duplicating the algorithm in three places.
        void runYinAndDispatch(frameBuffer.slice(), frameCount, dispatch);
        frameIndex = 0;
        frameCount += 1;
        // Carry any leftover samples into the next buffer.
        const leftover = input.length - remaining;
        if (leftover > 0) {
          frameBuffer.set(input.subarray(remaining, input.length), 0);
          frameIndex = leftover;
        } else {
          frameBuffer = new Float32Array(FRAME_SIZE);
        }
      } else {
        frameBuffer.set(input, frameIndex);
        frameIndex += input.length;
      }
    };
    sourceNode.connect(scriptNode);
    // ScriptProcessorNode requires a destination connection to fire onaudioprocess
    // in some browsers. Connect to a zero-gain node to avoid audible feedback.
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    scriptNode.connect(silentGain);
    silentGain.connect(audioContext.destination);
  }

  return {
    subscribe: (listener: PitchListener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    disconnect: () => {
      try {
        if (workletNode) {
          workletNode.port.onmessage = null;
          sourceNode.disconnect(workletNode);
          workletNode.disconnect();
        }
      } catch {
        /* noop */
      }
      try {
        if (scriptNode) {
          scriptNode.onaudioprocess = null;
          sourceNode.disconnect(scriptNode);
          scriptNode.disconnect();
        }
      } catch {
        /* noop */
      }
      listeners.clear();
    },
    usingFallback,
  };
}

/**
 * Helper used by the ScriptProcessor fallback. Lazily imports the pure YIN
 * implementation (which is also bundled into the worklet file) so the
 * main-thread fallback produces the same shape of messages.
 */
async function runYinAndDispatch(
  samples: Float32Array,
  frameCount: number,
  dispatch: (msg: PitchMessage) => void,
): Promise<void> {
  try {
    const { detectPitchYin } = await import("@/lib/mic/yin");
    const result = detectPitchYin(samples, 44100);
    dispatch({
      freq: result.freq,
      confidence: result.confidence,
      rms: computeRms(samples),
      frame: frameCount,
    });
  } catch {
    /* yin module failed to load — silently drop this frame */
  }
}

function computeRms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}
