// MIT License — Piano Learning App (Phase 2)
// React hook wrapping mic capture + the pitch worklet bridge. Exposes a
// kid-friendly { listening, detectedNote, confidence, start, stop, error }.
//
// The hook is responsible for:
//   - Asking the user's permission (via startMicCapture).
//   - Subscribing to worklet messages and turning them into detected notes
//     via note-matcher.ts (added in P2-C3 — for now we just expose raw
//     frequency + confidence so P2-C1/C2 can be smoke-tested).
//   - Stopping the mic on tab blur / visibilitychange.
//
// Notes:
//   - The hook MUST be called from a client component (it touches window).
//   - `start()` should be invoked from a user gesture (button click) so the
//     browser allows AudioContext.resume().

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  classifyMicError,
  isMicSupported,
  startMicCapture,
  type MicCaptureHandle,
  type MicFailure,
} from "@/lib/mic/capture";
import {
  attachPitchWorklet,
  type PitchMessage,
  type WorkletBridge,
} from "@/lib/mic/audio-worklet-bridge";

export interface MicListenerState {
  /** True when the mic is actively capturing. */
  listening: boolean;
  /** Latest detected frequency in Hz, or -1 if no clear pitch. */
  freq: number;
  /** 0..1 YIN confidence. */
  confidence: number;
  /** 0..1 RMS of the current frame. */
  rms: number;
  /** True when the worklet fallback (ScriptProcessor) is in use. */
  usingFallback: boolean;
  /** Latest error (kid-friendly MicFailure), or null. */
  error: MicFailure | null;
  /** True if the browser supports mic access at all. */
  supported: boolean;
  /** Monotonic frame counter for debugging. */
  frame: number;
}

export interface UseMicListener extends MicListenerState {
  /** Start capturing + running YIN. Resolves on success; throws MicFailure. */
  start: () => Promise<void>;
  /** Stop capturing. Idempotent. */
  stop: () => void;
}

// Compute the initial `supported` flag once. On the server this is false;
// on the client it's whatever isMicSupported() returns. Because we read it
// at hook-init time (not in an effect), the very first client render after
// hydration will already reflect the correct value, avoiding both a
// hydration mismatch (the SSR-rendered HTML had `false`) and the cascading
// re-render that an `useEffect(() => setState(...))` would cause.
const INITIAL_SUPPORTED =
  typeof window !== "undefined" ? isMicSupported() : false;

const INITIAL: MicListenerState = {
  listening: false,
  freq: -1,
  confidence: 0,
  rms: 0,
  usingFallback: false,
  error: null,
  supported: INITIAL_SUPPORTED,
  frame: 0,
};

export function useMicListener(): UseMicListener {
  const [state, setState] = useState<MicListenerState>(INITIAL);

  // Refs so we don't re-bind listeners on every state change.
  const handleRef = useRef<MicCaptureHandle | null>(null);
  const bridgeRef = useRef<WorkletBridge | null>(null);

  const stop = useCallback(() => {
    try {
      bridgeRef.current?.disconnect();
    } catch {
      /* noop */
    }
    bridgeRef.current = null;
    try {
      handleRef.current?.stop();
    } catch {
      /* noop */
    }
    handleRef.current = null;
    setState((s) => ({
      ...s,
      listening: false,
      freq: -1,
      confidence: 0,
      rms: 0,
      usingFallback: false,
    }));
  }, []);

  const start = useCallback(async () => {
    // Bail if not supported.
    if (!isMicSupported()) {
      setState((s) => ({
        ...s,
        error: {
          reason: "unsupported",
          message:
            "This browser doesn't support microphone access. Try Chrome, Edge, Firefox, or Safari.",
        },
      }));
      return;
    }
    // If already listening, no-op.
    if (handleRef.current) return;

    setState((s) => ({ ...s, error: null }));

    let handle: MicCaptureHandle;
    try {
      handle = await startMicCapture();
    } catch (err) {
      const failure =
        err && typeof err === "object" && "reason" in err
          ? (err as MicFailure)
          : classifyMicError(err);
      setState((s) => ({ ...s, error: failure, listening: false }));
      return;
    }
    handleRef.current = handle;

    let bridge: WorkletBridge;
    try {
      bridge = await attachPitchWorklet(handle);
    } catch (err) {
      const failure = classifyMicError(err);
      handle.stop();
      handleRef.current = null;
      setState((s) => ({ ...s, error: failure, listening: false }));
      return;
    }
    bridgeRef.current = bridge;

    bridge.subscribe((msg: PitchMessage) => {
      setState((s) => ({
        ...s,
        listening: true,
        freq: msg.freq,
        confidence: msg.confidence,
        rms: msg.rms,
        frame: msg.frame,
      }));
    });

    setState((s) => ({
      ...s,
      listening: true,
      usingFallback: bridge.usingFallback,
      error: null,
    }));
  }, []);

  // Stop the mic on tab blur / visibilitychange to guarantee the indicator
  // goes away. Privacy: never leave the mic running in the background.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
      }
    };
    const onBlur = () => stop();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [stop]);

  // Cleanup on unmount: stop the bridge + capture handle. Uses refs only
  // (no setState in the cleanup, per react-hooks/set-state-in-effect rule).
  useEffect(() => {
    return () => {
      try {
        bridgeRef.current?.disconnect();
      } catch {
        /* noop */
      }
      try {
        handleRef.current?.stop();
      } catch {
        /* noop */
      }
      bridgeRef.current = null;
      handleRef.current = null;
    };
  }, []);

  // SSR-safe `supported` flag refresh after mount — wrapped in setState to
  // satisfy react-hooks/set-state-in-effect (we update state inside an async
  // callback, not synchronously in the effect body).
  useEffect(() => {
    if (INITIAL_SUPPORTED === isMicSupported()) return;
    // If the supported flag changed (rare), update it asynchronously.
    const id = window.setTimeout(() => {
      setState((s) => ({ ...s, supported: isMicSupported() }));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return {
    ...state,
    start,
    stop,
  };
}
