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
import { buildColumnLookup } from "@/lib/notes";
import type { CurriculumLesson } from "@/lib/curriculum";

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
  /** Rewards earned this run (set when phase becomes "complete"). */
  rewards: LessonRewards | null;
}

export interface LessonRewards {
  stickerId: string | null;
  stickerEmoji: string | null;
  stickerName: string | null;
  coinsEarned: number;
  reasons: string[];
}

const PASS_ACCURACY = 0.7;
const AUTO_ADVANCE_MS = 400; // after a correct press, wait this long then advance

export function useLessonEngine(
  lesson: LessonDefinition | null,
  /** Optional curriculum metadata (stickerEmoji, coins, etc.). When provided,
   *  the engine computes + exposes rewards on completion. */
  curriculum?: CurriculumLesson | null,
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
  const [rewards, setRewards] = useState<LessonRewards | null>(null);

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
      const xRatio = buildColumnLookup()[n.note]?.xRatio ?? 0;
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
                // Compute rewards if curriculum metadata is available.
                if (curriculum) {
                  const finalHits = hitsRef.current;
                  const finalTotal = lesson.notes.length;
                  const finalAccuracy =
                    finalTotal > 0
                      ? Math.round((finalHits / finalTotal) * 100)
                      : 0;
                  // Persist progress + awards to localStorage.
                  void finalHits; // tracked via finalAccuracy
                  const r = persistLessonCompletion(
                    curriculum,
                    finalAccuracy,
                  );
                  setRewards(r);
                }
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
    setRewards(null);
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
    setRewards(null);
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
    rewards,
    start,
    reset,
  };
}

// ---------------------------------------------------------------------------
// Persist lesson completion to localStorage. Awards sticker + coins + streak.
// Returns the rewards summary for the celebration screen.
// ---------------------------------------------------------------------------

import {
  getActiveProfile,
  getProfileProgress,
  loadPhase2,
  savePhase2,
  upsertProfileProgress,
} from "@/lib/storage";
import { computeLessonRewards } from "@/lib/rewards";
import { markTodayComplete, computeStreak } from "@/lib/streaks";

function persistLessonCompletion(
  curriculum: CurriculumLesson,
  accuracy: number,
): LessonRewards {
  if (typeof window === "undefined") {
    return {
      stickerId: null,
      stickerEmoji: null,
      stickerName: null,
      coinsEarned: 0,
      reasons: [],
    };
  }
  const storage = loadPhase2();
  const profile = getActiveProfile(storage);
  if (!profile) {
    return {
      stickerId: null,
      stickerEmoji: null,
      stickerName: null,
      coinsEarned: 0,
      reasons: [],
    };
  }
  const progress = getProfileProgress(storage, profile.id);

  // Build a sticker id for this lesson (curriculum lessons get
  // sticker-first-note-style ids derived from the lesson number).
  const lessonStickerId = `sticker-lesson-${curriculum.number}`;
  const alreadyOwned = new Set(progress.stickers);

  // Mark today as a streak day BEFORE computing the streak so the current
  // count is correct.
  const newStreakDays = markTodayComplete(progress.streakDays);
  const streakInfo = computeStreak(newStreakDays);

  const rewards = computeLessonRewards(
    lessonStickerId,
    alreadyOwned,
    curriculum.coins,
    accuracy,
    streakInfo.current,
  );

  // Update progress: mark lesson completed, bump coins, add sticker if new,
  // update streakDays, bump minutes (estimate from lesson length).
  const existingLesson = progress.lessons[curriculum.id];
  const updatedLesson = {
    lessonId: curriculum.id,
    completed: true,
    bestAccuracy: Math.max(
      existingLesson?.bestAccuracy ?? 0,
      accuracy,
    ),
    attempts: (existingLesson?.attempts ?? 0) + 1,
    lastPlayedAt: new Date().toISOString(),
  };

  // Add sticker if new.
  const newStickers = rewards.stickerIsNew && rewards.stickerId
    ? [...progress.stickers, rewards.stickerId]
    : progress.stickers;

  const next = upsertProfileProgress(storage, profile.id, {
    lessons: { ...progress.lessons, [curriculum.id]: updatedLesson },
    coins: progress.coins + rewards.coinsEarned,
    stickers: newStickers,
    streakDays: newStreakDays,
    minutesPractised: progress.minutesPractised + curriculum.estMinutes,
    lastSessionDate: new Date().toISOString(),
  });
  savePhase2(next);

  // Resolve the sticker emoji/name for the celebration screen.
  let stickerEmoji: string | null = null;
  let stickerName: string | null = null;
  if (rewards.stickerId) {
    // Curriculum lessons map directly to their sticker emoji.
    stickerEmoji = curriculum.stickerEmoji;
    stickerName = curriculum.stickerName;
    // Override for non-curriculum stickers (perfect score, 7-day streak).
    if (rewards.stickerId === "sticker-perfect") {
      stickerEmoji = "💯";
      stickerName = "Perfect Score";
    } else if (rewards.stickerId === "sticker-7-day") {
      stickerEmoji = "🔥";
      stickerName = "7-Day Streak!";
    }
  }

  return {
    stickerId: rewards.stickerId,
    stickerEmoji,
    stickerName,
    coinsEarned: rewards.coinsEarned,
    reasons: rewards.reasons,
  };
}

// ---------------------------------------------------------------------------
// Helper: compute the xRatio for a note on the 61-key keyboard.
// Duplicated (simplified) from useSongPlayer's COLUMN_LOOKUP — we'll
// consolidate in P2-C5 when the curriculum arrives.
// ---------------------------------------------------------------------------



