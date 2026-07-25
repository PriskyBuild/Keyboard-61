// MIT License — Piano Learning App
// React hook wrapping the Tone.js singleton. Loads Tone lazily on the client.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AudioEngineState } from "@/types";

// We hold the dynamically-imported module in a ref so we only import it once.
type AudioModule = typeof import("@/lib/audio");

let audioModulePromise: Promise<AudioModule> | null = null;

function loadAudioModule(): Promise<AudioModule> {
  if (audioModulePromise) return audioModulePromise;
  audioModulePromise = import("@/lib/audio");
  return audioModulePromise;
}

export interface UseAudioEngine {
  state: AudioEngineState;
  /** Must be called from a user gesture (pointerdown / keydown). */
  ensureReady: () => Promise<AudioModule>;
  playNote: (
    note: string,
    velocity?: number,
    duration?: number,
    time?: number,
  ) => Promise<void>;
  releaseNote: (note: string) => Promise<void>;
  releaseAll: () => Promise<void>;
  setSustain: (on: boolean) => Promise<void>;
  setVolumeDb: (db: number) => Promise<void>;
  setReverbWet: (wet: number) => Promise<void>;
  getTransport: () => Promise<ReturnType<AudioModule["getTransport"]>>;
  nowSeconds: () => Promise<number>;
}

const INITIAL_STATE: AudioEngineState = {
  ready: false,
  usingFallback: false,
  error: null,
};

export function useAudioEngine(): UseAudioEngine {
  const [state, setState] = useState<AudioEngineState>(INITIAL_STATE);
  const moduleRef = useRef<AudioModule | null>(null);

  useEffect(() => {
    let mounted = true;
    loadAudioModule()
      .then((mod) => {
        if (!mounted) return;
        moduleRef.current = mod;
        // If the engine was already initialised (e.g. by a previous mount),
        // surface its state immediately.
        const next = mod.getAudioState();
        setState({ ...next, error: null });
        // Subscribe to future state changes (e.g. when the Sampler swap
        // completes in the background).
        const unsub = mod.onAudioStateChange((next) => {
          if (!mounted) return;
          setState({ ...next, error: null });
        });
        return () => {
          unsub();
        };
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ ready: false, usingFallback: false, error: message });
      });
    return () => {
      mounted = false;
    };
  }, []);

  const ensureReady = useCallback(async () => {
    const mod = await loadAudioModule();
    moduleRef.current = mod;
    try {
      await mod.initAudio();
      const next = mod.getAudioState();
      setState({ ...next, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ ready: false, usingFallback: false, error: message });
    }
    return mod;
  }, []);

  const playNote = useCallback(
    async (
      note: string,
      velocity = 0.8,
      duration?: number,
      time?: number,
    ) => {
      const mod = await loadAudioModule();
      mod.playNote(note, velocity, duration, time);
    },
    [],
  );

  const releaseNote = useCallback(async (note: string) => {
    const mod = await loadAudioModule();
    mod.releaseNote(note);
  }, []);

  const releaseAll = useCallback(async () => {
    const mod = await loadAudioModule();
    mod.releaseAllNotes();
  }, []);

  const setSustain = useCallback(async (on: boolean) => {
    const mod = await loadAudioModule();
    mod.setSustain(on);
  }, []);

  const setVolumeDb = useCallback(async (db: number) => {
    const mod = await loadAudioModule();
    mod.setVolumeDb(db);
  }, []);

  const setReverbWet = useCallback(async (wet: number) => {
    const mod = await loadAudioModule();
    mod.setReverbWet(wet);
  }, []);

  const getTransport = useCallback(async () => {
    const mod = await loadAudioModule();
    return mod.getTransport();
  }, []);

  const nowSeconds = useCallback(async () => {
    const mod = await loadAudioModule();
    return mod.nowSeconds();
  }, []);

  return useMemo(
    () => ({
      state,
      ensureReady,
      playNote,
      releaseNote,
      releaseAll,
      setSustain,
      setVolumeDb,
      setReverbWet,
      getTransport,
      nowSeconds,
    }),
    // `state` is the only piece that changes — every callback is stable
    // (useCallback with empty deps). Memoising keeps the returned object's
    // identity stable across re-renders when only `state` changes, which
    // matters for downstream hooks that depend on this object (e.g.
    // useSongPlayer's stop() callback, whose identity must be stable
    // for cleanup effects not to fire spuriously).
    [
      state,
      ensureReady,
      playNote,
      releaseNote,
      releaseAll,
      setSustain,
      setVolumeDb,
      setReverbWet,
      getTransport,
      nowSeconds,
    ],
  );
}
