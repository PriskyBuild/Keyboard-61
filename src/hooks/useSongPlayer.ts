// MIT License — Piano Learning App
// Song player hook for Learning Mode.
//
// Responsibilities:
//   - Schedule song notes via Tone.Transport.
//   - On each note's start time, set `nextNote` in the store so the UI
//     highlights the correct key.
//   - Listen for the user pressing keys (via the press callback) and decide
//     correct / wrong / miss.
//   - Emit visualizer events (a snapshot of upcoming notes) so the
//     Visualizer component can paint falling notes.
//   - Tempo multiplier rescales BOTH audio scheduling and the visualizer.
//
// Scoring rules:
//   - Correct press within ±HIT_WINDOW_MS of the scheduled start: +100,
//     streak++, hits++, total++.
//   - Wrong press: red flash, streak=0, total++ (counted as miss).
//   - Missed (note passed without a press): streak=0, total++ (counted as miss).
//
// The hook returns a small API: start, stop, pause, restart, seekTo, plus
// the press callback to wire into the Piano component.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePianoStore } from "@/lib/store";
import type { Score, Song, VisualizerNote } from "@/types";
import { beatsToSeconds, songLengthBeats } from "@/lib/songs";
import { getBlackKeys, getWhiteKeys, parseNote } from "@/lib/notes";

/** How forgiving the hit window is, in milliseconds. */
const HIT_WINDOW_MS = 280;

const SCORE_PER_HIT = 100;

interface ScheduledEvent {
  /** Tone.Transport schedule id. */
  id: number;
}

export interface UseSongPlayer {
  /** Snapshot of upcoming notes for the visualizer. */
  visualizer: VisualizerNote[];
  /** True while the song is currently playing (not paused). */
  isPlaying: boolean;
  /** 0..1 progress through the song. */
  progress: number;
  /** Set to true when the song has finished. */
  complete: boolean;
  /** Pass-through to the Piano component. Called when the user presses a key. */
  onNotePress: (note: string) => void;
  onNoteRelease: (note: string) => void;
  /** Controls. */
  start: () => Promise<void>;
  pause: () => Promise<void>;
  restart: () => Promise<void>;
  stop: () => Promise<void>;
}

// Build a lookup of { note -> xRatio, widthRatio, isBlack } for the entire
// 61-key keyboard so the visualizer can place each falling note above its
// column without re-computing per frame. Hoisted to module level so it's
// computed once at module load and never read from a ref during render.
function buildColumnLookup(): Record<
  string,
  { xRatio: number; widthRatio: number; isBlack: boolean }
> {
  const whites = getWhiteKeys();
  const blacks = getBlackKeys();
  const whiteCount = whites.length;
  const whiteWidth = 1 / whiteCount;
  const blackWidth = whiteWidth * 0.62;
  const lookup: Record<
    string,
    { xRatio: number; widthRatio: number; isBlack: boolean }
  > = {};

  for (const w of whites) {
    const idx = whites.indexOf(w);
    lookup[w.note] = {
      xRatio: idx * whiteWidth,
      widthRatio: whiteWidth,
      isBlack: false,
    };
  }

  for (const b of blacks) {
    if (b.precedingWhiteIndex === undefined) continue;
    const boundary = (b.precedingWhiteIndex + 1) * whiteWidth;
    const left = boundary - blackWidth / 2;
    lookup[b.note] = {
      xRatio: left,
      widthRatio: blackWidth,
      isBlack: true,
    };
  }

  return lookup;
}

const COLUMN_LOOKUP = buildColumnLookup();

export function useSongPlayer(song: Song | null): UseSongPlayer {
  const audio = useAudioEngine();
  const tempo = usePianoStore((s) => s.tempo);
  const setScore = usePianoStore((s) => s.setScore);
  const resetScore = usePianoStore((s) => s.resetScore);
  const setNextNote = usePianoStore((s) => s.setNextNote);
  const flashWrong = usePianoStore((s) => s.flashWrong);
  const setIsPlaying = usePianoStore((s) => s.setIsPlaying);
  const pressNote = usePianoStore((s) => s.pressNote);
  const releaseNoteState = usePianoStore((s) => s.releaseNoteState);

  const [isPlaying, setLocalIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  // Track the song we last initialised for; reset state when it changes.
  // (Adjust-state-during-render pattern from the React docs.)
  const [loadedSongId, setLoadedSongId] = useState<string | null>(null);
  if (song && song.id !== loadedSongId) {
    setLoadedSongId(song.id);
    setComplete(false);
    setProgress(0);
  }

  // Mutable refs for cross-closure access without re-binding listeners.
  const scheduledIdsRef = useRef<ScheduledEvent[]>([]);
  const noteQueueRef = useRef<
    { note: string; startSec: number; durationSec: number; index: number }[]
  >([]);
  const currentIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  // Always-current tempo for closures that shouldn't re-bind when tempo changes.
  const tempoRef = useRef(tempo);
  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  const totalDurationSec = useMemo(() => {
    if (!song) return 0;
    return beatsToSeconds(songLengthBeats(song), song.bpm);
  }, [song]);

  // Build the visualizer snapshot purely from `song` + `tempo` (no effect needed).
  const visualizer = useMemo<VisualizerNote[]>(() => {
    if (!song) return [];
    const lookup = COLUMN_LOOKUP;
    const t = tempo;
    return song.notes.map((n, i) => {
      const col = lookup[n.note] ?? {
        xRatio: 0,
        widthRatio: 0.02,
        isBlack: false,
      };
      return {
        id: `${song.id}-${i}`,
        note: n.note,
        startSec: beatsToSeconds(n.start, song.bpm) / t,
        durationSec: beatsToSeconds(n.duration, song.bpm) / t,
        xRatio: col.xRatio,
        widthRatio: col.widthRatio,
        isBlack: col.isBlack,
      };
    });
  }, [song, tempo]);

  // Clear all scheduled Tone.Transport events.
  const clearSchedule = useCallback(async () => {
    try {
      const transport = await audio.getTransport();
      transport.cancel();
      transport.stop();
    } catch {
      /* audio not ready yet */
    }
    scheduledIdsRef.current = [];
  }, [audio]);

  // Stop everything, reset state.
  const stop = useCallback(async () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    await clearSchedule();
    setLocalIsPlaying(false);
    setIsPlaying(false);
    setProgress(0);
    setComplete(false);
    setNextNote(null);
    currentIndexRef.current = 0;
  }, [clearSchedule, setIsPlaying, setNextNote]);

  // Start playback (or resume from pause).
  const start = useCallback(async () => {
    if (!song) return;
    try {
      await audio.ensureReady();
      await clearSchedule();

      const transport = await audio.getTransport();
      // Apply tempo multiplier to the Transport's BPM so audio + visual stay
      // in lock-step.
      transport.bpm.value = song.bpm * tempoRef.current;
      transport.seconds = 0;

      // Rebuild queue for scoring.
      noteQueueRef.current = song.notes.map((n, i) => ({
        note: n.note,
        startSec: beatsToSeconds(n.start, song.bpm) / tempoRef.current,
        durationSec: beatsToSeconds(n.duration, song.bpm) / tempoRef.current,
        index: i,
      }));
      currentIndexRef.current = 0;
      resetScore(noteQueueRef.current.length);

      // Schedule each note: trigger audio attack+release + set nextNote hint.
      for (const ev of noteQueueRef.current) {
        const id = transport.scheduleOnce((time) => {
          // Audio — pass the sample-accurate time so playback is tight.
          try {
            void audio.playNote(ev.note, 0.7, ev.durationSec, time);
          } catch {
            /* ignore */
          }
        }, ev.startSec);
        scheduledIdsRef.current.push({ id });
      }

      transport.start();
      setLocalIsPlaying(true);
      setIsPlaying(true);
      setComplete(false);

      // Prime the next-note hint immediately.
      const first = noteQueueRef.current[0];
      if (first) setNextNote(first.note);

      // RAF loop to advance progress, set nextNote, and detect missed notes.
      const loop = async () => {
        try {
          const t2 = await audio.getTransport();
          const now = t2.seconds;
          setProgress(Math.min(1, now / (totalDurationSec / tempoRef.current)));

          // Advance current index past due notes; count missed ones.
          let missed = 0;
          while (
            currentIndexRef.current < noteQueueRef.current.length &&
            now >
              noteQueueRef.current[currentIndexRef.current].startSec +
                HIT_WINDOW_MS / 1000
          ) {
            // The user missed this note (no press within the window).
            missed += 1;
            currentIndexRef.current += 1;
          }
          if (missed > 0) {
            // Apply miss penalty in a batch — total stays the same (it's the
            // expected-count denominator), hits unchanged, streak resets.
            setScore({ streak: 0 });
          }
          // Set the next-note hint.
          const next = noteQueueRef.current[currentIndexRef.current];
          setNextNote(next ? next.note : null);

          // Song complete?
          if (now >= totalDurationSec / tempoRef.current + 0.5) {
            await stop();
            setComplete(true);
            setNextNote(null);
            return;
          }
        } catch {
          /* transport not ready yet — try again next frame */
        }
        rafRef.current = requestAnimationFrame(() => {
          void loop();
        });
      };
      rafRef.current = requestAnimationFrame(() => {
        void loop();
      });
    } catch {
      // Audio engine failed to start — silently bail. The user can press
      // Play again; if the engine is truly broken, the audio status badge
      // will surface an error.
    }
  }, [
    audio,
    clearSchedule,
    song,
    setIsPlaying,
    setNextNote,
    setScore,
    resetScore,
    stop,
    totalDurationSec,
  ]);

  const pause = useCallback(async () => {
    try {
      const transport = await audio.getTransport();
      transport.pause();
    } catch {
      /* noop */
    }
    setLocalIsPlaying(false);
    setIsPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [audio, setIsPlaying]);

  const restart = useCallback(async () => {
    await stop();
    await start();
  }, [start, stop]);

  // The press handler the Piano will call. Decides correct / wrong.
  const onNotePress = useCallback(
    (note: string) => {
      pressNote(note);
      const queue = noteQueueRef.current;
      const idx = currentIndexRef.current;
      const expected = queue[idx];
      if (!expected) return;

      // Normalize the expected note to a comparable form.
      const expectedParsed = parseNote(expected.note);
      const gotParsed = parseNote(note);
      const same = expectedParsed.letter === gotParsed.letter
        && expectedParsed.accidental === gotParsed.accidental
        && expectedParsed.octave === gotParsed.octave;

      const s = usePianoStore.getState().score;
      if (same) {
        // Hit!
        const newStreak = s.streak + 1;
        setScore({
          points: s.points + SCORE_PER_HIT + Math.min(50, newStreak * 2),
          hits: s.hits + 1,
          streak: newStreak,
          bestStreak: Math.max(s.bestStreak, newStreak),
        });
        currentIndexRef.current += 1;
        const next = queue[currentIndexRef.current];
        setNextNote(next ? next.note : null);
      } else {
        // Wrong press.
        flashWrong(note);
        setScore({ streak: 0 });
      }
    },
    [pressNote, setScore, flashWrong, setNextNote],
  );

  const onNoteRelease = useCallback(
    (note: string) => {
      releaseNoteState(note);
    },
    [releaseNoteState],
  );

  // Reset score when song changes. (Adjust-state-during-render pattern above
  // already resets `complete`/`progress`; we also need to clear the score
  // in the Zustand store. This effect is OK because resetScore updates an
  // external store, not React state.)
  //
  // The cleanup uses a ref to the latest `stop` function so this effect only
  // re-runs when `song` changes — not on every render when `stop`'s identity
  // might change. Otherwise, every setProgress() during playback would
  // unmount-and-remount this effect and call stop() — killing playback.
  const stopRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useEffect(() => {
    if (song) {
      resetScore(song.notes.length);
    }
    return () => {
      void stopRef.current();
    };
  }, [song, resetScore]);

  // Apply tempo changes to the running Transport without restarting.
  useEffect(() => {
    if (!isPlaying || !song) return;
    void (async () => {
      try {
        const transport = await audio.getTransport();
        transport.bpm.value = song.bpm * tempo;
      } catch {
        /* noop */
      }
    })();
  }, [audio, isPlaying, song, tempo]);

  return {
    visualizer,
    isPlaying,
    progress,
    complete,
    onNotePress,
    onNoteRelease,
    start,
    pause,
    restart,
    stop,
  };
}

// Helper export so consumers can read the score without importing the store
// separately.
export function readScore(): Score {
  return usePianoStore.getState().score;
}
