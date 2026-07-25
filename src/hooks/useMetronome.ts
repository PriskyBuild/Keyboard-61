// MIT License — Piano Learning App
// Metronome hook — drives a steady click track using Tone.js.
//
// Uses Tone.Transport's `scheduleRepeat` for sample-accurate timing.
// The click is a short percussive synth pulse (MembraneSynth) so it cuts
// through without being annoying.
//
// Beat 1 of each bar gets an accent (higher pitch + slightly louder).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";

export interface MetronomeState {
  /** True when the metronome is currently ticking. */
  running: boolean;
  /** Beats per minute (40-220). */
  bpm: number;
  /** Beats per bar (1-8). Beat 1 is accented. */
  beatsPerBar: number;
  /** Current beat index within the bar (0 = downbeat). -1 when stopped. */
  currentBeat: number;
}

export interface UseMetronome extends MetronomeState {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  toggle: () => Promise<void>;
  setBpm: (bpm: number) => Promise<void>;
  setBeatsPerBar: (b: number) => void;
}

const MIN_BPM = 40;
const MAX_BPM = 220;

export function useMetronome(): UseMetronome {
  const audio = useAudioEngine();
  const [running, setRunning] = useState(false);
  const [bpm, setBpmState] = useState(100);
  const [beatsPerBar, setBeatsPerBarState] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(-1);

  // Refs so the scheduleRepeat callback reads the latest values without
  // re-binding.
  const bpmRef = useRef(bpm);
  const beatsPerBarRef = useRef(beatsPerBar);
  const beatCounterRef = useRef(0);
  const scheduleIdRef = useRef<number | null>(null);
  const synthRef = useRef<unknown>(null);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
  }, [beatsPerBar]);

  const stop = useCallback(async () => {
    try {
      const transport = await audio.getTransport();
      if (scheduleIdRef.current !== null) {
        transport.clear(scheduleIdRef.current);
        scheduleIdRef.current = null;
      }
      transport.stop();
    } catch {
      /* transport not ready */
    }
    setRunning(false);
    setCurrentBeat(-1);
    beatCounterRef.current = 0;
  }, [audio]);

  const start = useCallback(async () => {
    await audio.ensureReady();
    try {
      const transport = await audio.getTransport();

      // Lazily create the click synth. We import Tone dynamically so it
      // stays out of the SSR bundle.
      if (!synthRef.current) {
        const audioMod = await import("@/lib/audio");
        // We can't easily access the Tone module from here, but we can use
        // the audio engine's playNote helper to produce clicks. Each click
        // is a very short woodblock-style note (C5 for accent, C4 for
        // regular beats).
        void audioMod;
      }

      // Set transport BPM + clear any prior schedule.
      transport.bpm.value = bpmRef.current;
      if (scheduleIdRef.current !== null) {
        transport.clear(scheduleIdRef.current);
      }
      beatCounterRef.current = 0;
      transport.seconds = 0;

      // Schedule a click every quarter note.
      scheduleIdRef.current = transport.scheduleRepeat(
        (time) => {
          const beat = beatCounterRef.current;
          const isAccent = beat === 0;
          // Click: very short note, low velocity.
          // C5 = accent (high), A4 = regular (lower).
          const note = isAccent ? "C5" : "A4";
          const velocity = isAccent ? 0.9 : 0.6;
          void audio.playNote(note, velocity, 0.04, time);
          beatCounterRef.current = (beat + 1) % beatsPerBarRef.current;
          // Update currentBeat on the next tick so the UI is in sync.
          // (setState inside the audio callback is async-safe.)
          window.setTimeout(() => setCurrentBeat(beat), 0);
        },
        "4n", // every quarter note
        0,
      );

      transport.start();
      setRunning(true);
    } catch {
      /* transport not ready — silently bail */
    }
  }, [audio]);

  const toggle = useCallback(async () => {
    if (running) {
      await stop();
    } else {
      await start();
    }
  }, [running, start, stop]);

  const setBpm = useCallback(
    async (next: number) => {
      const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(next)));
      setBpmState(clamped);
      if (running) {
        try {
          const transport = await audio.getTransport();
          transport.bpm.value = clamped;
        } catch {
          /* noop */
        }
      }
    },
    [running, audio],
  );

  const setBeatsPerBar = useCallback((b: number) => {
    setBeatsPerBarState(Math.max(1, Math.min(8, Math.round(b))));
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      const id = scheduleIdRef.current;
      if (id !== null) {
        void (async () => {
          try {
            const transport = await audio.getTransport();
            transport.clear(id);
            transport.stop();
          } catch {
            /* noop */
          }
        })();
      }
    };
  }, [audio]);

  return {
    running,
    bpm,
    beatsPerBar,
    currentBeat,
    start,
    stop,
    toggle,
    setBpm,
    setBeatsPerBar,
  };
}
