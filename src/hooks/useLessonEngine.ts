// MIT License — Piano Learning App (Phase 2)
// Lesson engine — drives the listen-mode flow for a single lesson:
//   intro animation → warm-up → guided play → mini-recital → sticker.
//
// The engine subscribes to useMicListener's detectedNote and advances the
// lesson state when the kid plays the expected note correctly. It also fires
// audio cues (correct arpeggio, wrong chime) and tracks the score.
//
// For P2-C4 this hook supports a simple "free listen" mode (no lesson
// loaded — just light up whatever note the kid plays). The full lesson
// progression (12 lessons, finger hints, recital) is added in P2-C5 via
// src/lib/curriculum.ts.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMicListener } from "@/hooks/useMicListener";
import { usePianoStore } from "@/lib/store";
import { notesMatch } from "@/lib/mic/note-matcher";
import {
  playCorrectCue,
  playWrongCue,
  playFanfareCue,
} from "@/lib/audio-cues";
import type { KidFallingNote } from "@/components/listen/FallingNotesKid";

export type LessonPhase = "intro" | "warmup" | "guided" | "recital" | "complete";

export interface LessonNote {
  note: string;
  /** Finger 1-5 (RH) or null. */
  finger?: number | null;
  /** Hand: "L" | "R" | null. */
  hand?: "L" | "R" | null;
  /** Beats (quarter note = 1). */
  duration: number;
  /** Start beat. */
  start: number;
}

export interface LessonDefinition {
  id: string;
  title: string;
  bpm: number;
  notes: LessonNote[];
}

export interface LessonEngineState {
  /** Current phase of the lesson. */
  phase: LessonPhase;
  /** Index of the currently-expected note in the lesson's notes array. */
  currentIndex: number;
  /** Currently-expected note name (for the ListenPiano highlight). */
  expectedNote: string | null;
  /** Currently-expected finger (for the HandPositionDiagram). */
  expectedFinger: number | null;
  /** Currently-expected hand. */
  expectedHand: "L" | "R" | null;
  /** Visualizer notes (already tempo-scaled to seconds). */
  visualizer: KidFallingNote[];
  /** True when the song is currently auto-playing (visualizer advancing). */
  isPlaying: boolean;
  /** 0..1 progress through the lesson. */
  progress: number;
  /** Number of correct hits so far. */
  hits: number;
  /** Total notes (correct + missed). */
  total: number;
  /** True when the lesson is complete (>= 70% accuracy). */
  complete: boolean;
  /** Final accuracy (0-100). */
  accuracy: number;
  /** Last feedback event ("correct" | "wrong" | null). */
  feedback: "correct" | "wrong" | null;
  /** Trigger key for re-firing feedback animations. */
  feedbackKey: number;
  /** Mascot message based on the current state. */
  mascotMessage: string | null;
}

export interface UseLessonEngine extends LessonEngineState {
  /** Start the lesson (intro → warmup → guided → recital → complete). */
  start: () => void;
  /** Stop + reset the lesson to its initial state. */
  reset: () => void;
  /** The mic listener (so the page can render mic status, etc.). */
  mic: ReturnType<typeof useMicListener>;
}

const PASS_ACCURACY = 0.7;
const AUTO_ADVANCE_MS = 400; // after a correct press, wait this long then advance

export function useLessonEngine(
  lesson: LessonDefinition | null,
): UseLessonEngine {
  const mic = useMicListener();
  const setNextNote = usePianoStore((s) => s.setNextNote);
  const flashWrong = usePianoStore((s) => s.flashWrong);

  const [phase, setPhase] = useState<LessonPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hits, setHits] = useState(0);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);

  // Refs to avoid stale closures in the mic subscription.
  const currentIndexRef = useRef(0);
  const phaseRef = useRef<LessonPhase>("intro");
  const hitsRef = useRef(0);
  const advanceTimerRef = useRef<number | null>(null);

  // Keep refs in sync.
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    hitsRef.current = hits;
  }, [hits]);

  // Compute the visualizer notes from the lesson.
  const visualizer = useMemo<KidFallingNote[]>(() => {
    if (!lesson) return [];
    const beatsPerSecond = lesson.bpm / 60;
    return lesson.notes.map((n, i) => {
      // Reuse the column-lookup pattern from the song player.
      // For simplicity here we compute xRatio inline.
      const xRatio = noteToColumnRatio(n.note);
      const widthRatio = xRatio === null ? 0.02 : 0.022;
      return {
        id: `${lesson.id}-${i}`,
        note: n.note,
        startSec: n.start / beatsPerSecond,
        durationSec: n.duration / beatsPerSecond,
        xRatio: xRatio ?? 0,
        widthRatio,
        isBlack: n.note.includes("#"),
        finger: n.finger ?? null,
        hand: n.hand ?? null,
      };
    });
  }, [lesson]);

  const expectedNote = useMemo(() => {
    if (!lesson) return null;
    if (phase === "intro" || phase === "complete") return null;
    return lesson.notes[currentIndex]?.note ?? null;
  }, [lesson, currentIndex, phase]);

  const expectedFinger = useMemo(() => {
    if (!lesson) return null;
    return lesson.notes[currentIndex]?.finger ?? null;
  }, [lesson, currentIndex, phase]);

  const expectedHand = useMemo(() => {
    if (!lesson) return null;
    return lesson.notes[currentIndex]?.hand ?? null;
  }, [lesson, currentIndex, phase]);

  const total = lesson?.notes.length ?? 0;
  const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;

  // Drive the mic's expectedNote (for octave-guard correction).
  useEffect(() => {
    mic.setExpectedNote(expectedNote);
  }, [expectedNote, mic]);

  // Watch mic.detectedNote for scoring. We keep the latest mic state in a
  // ref updated via its own effect (not during render) so the scoring poll
  // effect doesn't need to depend on every mic sample.
  const micStateRef = useRef({
    detectedNote: mic.detectedNote,
    onset: mic.onset,
    silent: mic.silent,
  });
  useEffect(() => {
    micStateRef.current = {
      detectedNote: mic.detectedNote,
      onset: mic.onset,
      silent: mic.silent,
    };
  }, [mic.detectedNote, mic.onset, mic.silent]);

  // This effect re-runs only when the lesson OR phase OR complete changes
  // (not on every mic sample). Inside, we poll the mic state via a
  // setTimeout loop to check for new onsets.
  useEffect(() => {
    if (!lesson) return;
    if (phase !== "guided" && phase !== "recital") return;
    if (complete) return;

    let cancelled = false;
    let lastTriggeredOnset: boolean = false;

    const checkMic = () => {
      if (cancelled) return;
      const ms = micStateRef.current;
      // Only score on a fresh onset (rising edge).
      if (ms.onset && ms.onset !== lastTriggeredOnset && !ms.silent && ms.detectedNote) {
        lastTriggeredOnset = ms.onset;
        const expected = lesson.notes[currentIndexRef.current];
        if (expected) {
          if (notesMatch(ms.detectedNote, expected.note, true)) {
            // Correct!
            setFeedback("correct");
            setFeedbackKey((k) => k + 1);
            setHits((h) => h + 1);
            void playCorrectCue();
            setNextNote(null);
            // Auto-advance after a short delay.
            if (advanceTimerRef.current !== null) {
              window.clearTimeout(advanceTimerRef.current);
            }
            advanceTimerRef.current = window.setTimeout(() => {
              const nextIdx = currentIndexRef.current + 1;
              if (nextIdx >= lesson.notes.length) {
                setPhase("complete");
                setComplete(true);
                void playFanfareCue();
              } else {
                setCurrentIndex(nextIdx);
                setProgress(nextIdx / lesson.notes.length);
                setNextNote(lesson.notes[nextIdx]?.note ?? null);
              }
            }, AUTO_ADVANCE_MS);
          } else {
            // Wrong — never punitive
            setFeedback("wrong");
            setFeedbackKey((k) => k + 1);
            void playWrongCue();
            flashWrong(ms.detectedNote);
          }
        }
      } else if (!ms.onset) {
        lastTriggeredOnset = false;
      }
      // Poll every 50ms — cheaper than re-running the effect on every mic state change.
      pollTimerRef.current = window.setTimeout(checkMic, 50);
    };

    let pollTimerRef = { current: null as number | null };
    pollTimerRef.current = window.setTimeout(checkMic, 50);

    return () => {
      cancelled = true;
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [lesson, phase, complete, setNextNote, flashWrong]);

  // Auto-clear feedback after animation.
  useEffect(() => {
    if (feedback === null) return;
    const id = window.setTimeout(() => setFeedback(null), 1200);
    return () => window.clearTimeout(id);
  }, [feedback, feedbackKey]);

  // Start the lesson.
  const start = useCallback(() => {
    if (!lesson) return;
    setPhase("guided"); // skip intro/warmup for the P2-C4 smoke test
    setCurrentIndex(0);
    setHits(0);
    setComplete(false);
    setProgress(0);
    setIsPlaying(true);
    setNextNote(lesson.notes[0]?.note ?? null);
    void mic.start();
  }, [lesson, mic, setNextNote]);

  const reset = useCallback(() => {
    setPhase("intro");
    setCurrentIndex(0);
    setHits(0);
    setComplete(false);
    setProgress(0);
    setIsPlaying(false);
    setFeedback(null);
    setNextNote(null);
    mic.stop();
  }, [mic, setNextNote]);

  // Mascot message based on state.
  const mascotMessage = useMemo(() => {
    if (phase === "intro") return "Hi! I'm Bruno the bear. Let's play!";
    if (phase === "guided") {
      if (!mic.listening) return "Tap 'Start' so I can hear your piano!";
      if (feedback === "correct") return "Yes! That's it! 🎵";
      if (feedback === "wrong") return "Almost! Try again — you've got this!";
      if (!expectedNote) return "Ready?";
      return `Play ${expectedNote}!`;
    }
    if (phase === "complete") return "You did it! 🎉";
    return null;
  }, [phase, mic.listening, feedback, expectedNote]);

  return {
    phase,
    currentIndex,
    expectedNote,
    expectedFinger,
    expectedHand,
    visualizer,
    isPlaying,
    progress,
    hits,
    total,
    complete,
    accuracy,
    feedback,
    feedbackKey,
    mascotMessage,
    mic,
    start,
    reset,
  };
}

// ---------------------------------------------------------------------------
// Helper: compute the xRatio for a note on the 61-key keyboard.
// Duplicated (simplified) from useSongPlayer's COLUMN_LOOKUP — we'll
// consolidate in P2-C5 when the curriculum arrives.
// ---------------------------------------------------------------------------

import { getBlackKeys, getWhiteKeys } from "@/lib/notes";

const COLUMN_LOOKUP_KID = (function buildLookup() {
  const whites = getWhiteKeys();
  const blacks = getBlackKeys();
  const whiteCount = whites.length;
  const whiteWidth = 1 / whiteCount;
  const blackWidth = whiteWidth * 0.62;
  const lookup: Record<string, number> = {};
  for (let i = 0; i < whites.length; i++) {
    lookup[whites[i].note] = i * whiteWidth;
  }
  for (const b of blacks) {
    if (b.precedingWhiteIndex === undefined) continue;
    const boundary = (b.precedingWhiteIndex + 1) * whiteWidth;
    lookup[b.note] = boundary - blackWidth / 2;
  }
  return lookup;
})();

function noteToColumnRatio(note: string): number | null {
  return COLUMN_LOOKUP_KID[note] ?? null;
}
