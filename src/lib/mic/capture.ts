// MIT License — Piano Learning App (Phase 2)
// Microphone capture with DSP filters OFF — required for accurate pitch
// detection. echoCancellation / noiseSuppression / autoGainControl would
// mangle the waveform and break YIN.
//
// All access is wrapped in try/catch + secure-context checks so the UI can
// gracefully degrade to "mic unavailable" instead of crashing.
//
// NOTE: This module is intentionally NOT imported during SSR. It's only
// loaded by client hooks (useMicListener) via dynamic import.

/** Constraints passed to getUserMedia. Hard-coded — do not soften. */
export const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
  // Browsers may ignore sampleRate, but we ask anyway.
  sampleRate: 44100,
};

/** Reasons mic capture can fail, surfaced to the UI as kid-friendly copy. */
export type MicFailureReason =
  | "unsupported"
  | "permission-denied"
  | "no-device"
  | "non-secure-context"
  | "unknown";

export interface MicFailure {
  reason: MicFailureReason;
  message: string;
  original?: unknown;
}

export interface MicCaptureHandle {
  /** The MediaStream returned by getUserMedia. */
  stream: MediaStream;
  /** The AudioContext created for processing this stream. */
  audioContext: AudioContext;
  /** The MediaStreamSourceNode — connect this to your analyser/worklet. */
  sourceNode: MediaStreamAudioSourceNode;
  /** Stop the stream + close the AudioContext. Idempotent. */
  stop: () => void;
}

/** True if getUserMedia is available and we're in a secure context. */
export function isMicSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

/** Map a caught error to a kid-friendly failure reason + message. */
export function classifyMicError(err: unknown): MicFailure {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      return {
        reason: "permission-denied",
        message:
          "We need your microphone to listen to your piano. Tap the lock icon in your browser's address bar to allow it.",
        original: err,
      };
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return {
        reason: "no-device",
        message:
          "No microphone was found. Try plugging one in or using a device with a built-in mic.",
        original: err,
      };
    }
    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return {
        reason: "no-device",
        message:
          "Your microphone is being used by another app. Close other video-call apps and try again.",
        original: err,
      };
    }
  }
  if (
    typeof window !== "undefined" &&
    !window.isSecureContext &&
    typeof navigator !== "undefined" &&
    !navigator.mediaDevices
  ) {
    return {
      reason: "non-secure-context",
      message:
        "The microphone only works over HTTPS. This app uses HTTPS on Vercel — open the deployed URL.",
    };
  }
  return {
    reason: "unknown",
    message: "We couldn't start the microphone. Please try again.",
    original: err,
  };
}

/**
 * Request microphone access + create a dedicated AudioContext.
 *
 * Returns a handle whose `sourceNode` should be connected to the worklet
 * (or analyser) by the caller. The AudioContext is separate from Tone.js's
 * context — this is intentional (see PHASE2_PLAN.md D1) so mic input never
 * leaks into Tone's audio graph.
 *
 * Throws MicFailure on any error — caller should `classifyMicError` it.
 */
export async function startMicCapture(): Promise<MicCaptureHandle> {
  if (!isMicSupported()) {
    throw {
      reason: "unsupported",
      message:
        "This browser doesn't support microphone access. Try Chrome, Edge, Firefox, or Safari.",
    } satisfies MicFailure;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: MIC_CONSTRAINTS,
      video: false,
    });
  } catch (err) {
    throw classifyMicError(err);
  }

  // Create a dedicated AudioContext. We don't share Tone's context because
  // we don't want mic signal flowing into the destination (feedback howl).
  const AudioContextCtor: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  const audioContext = new AudioContextCtor({
    latencyHint: "interactive",
    sampleRate: 44100,
  });

  // Some browsers start the context in "suspended" state until a user
  // gesture. Resume it now (we're inside an async user-gesture chain).
  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      /* swallow — we'll surface a low-confidence signal instead */
    }
  }

  const sourceNode = audioContext.createMediaStreamSource(stream);

  return {
    stream,
    audioContext,
    sourceNode,
    stop: () => {
      try {
        sourceNode.disconnect();
      } catch {
        /* already disconnected */
      }
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* noop */
      }
      try {
        // close() can throw if the context is already closed.
        void audioContext.close();
      } catch {
        /* noop */
      }
    },
  };
}

/**
 * Stop all tracks on every MediaStream we know about. Defensive — call on
 * tab blur / visibilitychange to guarantee the mic indicator goes away.
 */
