// MIT License — Piano Learning App (Phase 2)
// /listen route — kid-friendly Microphone Listening Mode.
//
// Reads the ?lesson=ID query param to load a curriculum lesson (P2-C5).
// Falls back to a built-in demo lesson if no param is given (so the page
// is useful on its own).
//
// Layout:
//   1. Header with mic status + Start/Stop button + persistent listening badge
//   2. Mascot (Bruno the bear) with speech bubble
//   3. Falling-notes visualizer (kid mode)
//   4. Reference-only 61-key ListenPiano
//   5. Hand-position diagram
//   6. Progress + score row
//   7. Privacy footer
//
// On first visit (no calibration done), shows CalibrationFlow first.

"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLessonEngine } from "@/hooks/useLessonEngine";
import { Mascot, type MascotState } from "@/components/listen/Mascot";
import { ListenPiano } from "@/components/listen/ListenPiano";
import { FallingNotesKid } from "@/components/listen/FallingNotesKid";
import { FeedbackOverlay } from "@/components/listen/FeedbackOverlay";
import { HandPositionDiagram } from "@/components/listen/HandPositionDiagram";
import { CelebrationScreen } from "@/components/listen/CelebrationScreen";
import { MicPermissionModal } from "@/components/onboarding/MicPermissionModal";
import {
  CalibrationFlow,
  isCalibrationDone,
  markCalibrationDone,
} from "@/components/onboarding/CalibrationFlow";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, AlertTriangle, Play, RotateCcw, Ear } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRICULUM, findLessonById, type CurriculumLesson } from "@/lib/curriculum";
import type { LessonDefinition } from "@/hooks/useLessonEngine";

// Demo lesson used when no ?lesson= param is given.
const DEMO_LESSON: CurriculumLesson = {
  number: 0, // 0 = not in the official curriculum
  id: "demo-warmup",
  title: "C Scale Warmup",
  focus: "Right-hand thumb walking up and down",
  bpm: 60,
  estMinutes: 3,
  stickerEmoji: "🌟",
  stickerName: "Warmup Star",
  coins: 5,
  intro: "wave",
  notes: [
    { note: "C4", finger: 1, hand: "R", duration: 1, start: 0 },
    { note: "D4", finger: 2, hand: "R", duration: 1, start: 1 },
    { note: "E4", finger: 3, hand: "R", duration: 1, start: 2 },
    { note: "F4", finger: 4, hand: "R", duration: 1, start: 3 },
    { note: "G4", finger: 5, hand: "R", duration: 1, start: 4 },
    { note: "F4", finger: 4, hand: "R", duration: 1, start: 5 },
    { note: "E4", finger: 3, hand: "R", duration: 1, start: 6 },
    { note: "D4", finger: 2, hand: "R", duration: 1, start: 7 },
    { note: "C4", finger: 1, hand: "R", duration: 2, start: 8 },
  ],
};

export default function ListenPage() {
  // useSearchParams() must be wrapped in a Suspense boundary in Next.js 16
  // when statically prerendered. We split the route into a thin outer shell
  // (no useSearchParams) + an inner consumer that lives inside <Suspense>.
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading…</div>
        </main>
      }
    >
      <ListenPageInner />
    </Suspense>
  );
}

function ListenPageInner() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");
  const curriculum: CurriculumLesson = useMemo(() => {
    if (lessonId) {
      const found = findLessonById(lessonId);
      if (found) return found;
    }
    return DEMO_LESSON;
  }, [lessonId]);
  const lessonDef: LessonDefinition = useMemo(
    () => ({
      id: curriculum.id,
      title: curriculum.title,
      bpm: curriculum.bpm,
      notes: curriculum.notes,
    }),
    [curriculum],
  );

  const engine = useLessonEngine(lessonDef, curriculum);
  const [showPermission, setShowPermission] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationDone, setCalibrationDone] = useState(
    typeof window !== "undefined" && isCalibrationDone(),
  );

  // Map engine phase → mascot state.
  const mascotState: MascotState = engine.complete
    ? "happy"
    : engine.feedback === "correct"
      ? "happy"
      : engine.feedback === "wrong"
        ? "encourage"
        : engine.mic.listening
          ? "listening"
          : "idle";

  // Active note = the note the kid just played (lights up green on the piano).
  const activeNote = engine.feedback === "correct" ? engine.expectedNote : null;

  // Show calibration flow on first visit (only if mic is supported).
  if (!calibrationDone && engine.mic.supported && !engine.mic.listening) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-4">
        <CalibrationFlow
          onComplete={() => {
            markCalibrationDone();
            setCalibrationDone(true);
          }}
          onSkip={() => {
            markCalibrationDone();
            setCalibrationDone(true);
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Ear className="h-7 w-7 text-amber-500" />
            {curriculum.title}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {curriculum.focus}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {engine.mic.listening ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              🎤 Listening
            </span>
          ) : null}
          {!engine.complete ? (
            <Button
              type="button"
              size="lg"
              onClick={() => {
                if (engine.mic.listening) {
                  engine.reset();
                } else {
                  setShowPermission(true);
                }
              }}
              disabled={!engine.mic.supported && !engine.mic.listening}
              className="h-12 gap-2 px-6 text-base"
            >
              {engine.mic.listening ? (
                <>
                  <MicOff className="h-5 w-5" /> Stop
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" /> Start
                </>
              )}
            </Button>
          ) : null}
        </div>
      </header>

      {/* Mic error */}
      {engine.mic.error ? (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold capitalize">
              {engine.mic.error.reason.replace("-", " ")}
            </div>
            <div className="text-sm">{engine.mic.error.message}</div>
          </div>
        </div>
      ) : null}

      {/* Mascot */}
      <div className="flex justify-center py-2">
        <Mascot state={mascotState} size={140} message={engine.mascotMessage} />
      </div>

      {/* Falling-notes visualizer */}
      <FallingNotesKid notes={engine.visualizer} isPlaying={engine.isPlaying} />

      {/* Reference piano */}
      <ListenPiano
        activeNote={activeNote}
        expectedNote={engine.expectedNote}
        wrongNote={
          engine.mic.detectedNote && engine.feedback === "wrong"
            ? engine.mic.detectedNote
            : null
        }
      />

      {/* Hand position diagram */}
      <HandPositionDiagram hand={engine.expectedHand} finger={engine.expectedFinger} />

      {/* Progress + score row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ProgressCard
          label="Note"
          value={`${engine.currentIndex + 1} / ${engine.total}`}
        />
        <ProgressCard label="Hits" value={`${engine.hits}`} tone="emerald" />
        <ProgressCard
          label="Accuracy"
          value={`${engine.accuracy}%`}
          tone={
            engine.accuracy >= 80
              ? "emerald"
              : engine.accuracy >= 50
                ? "amber"
                : "slate"
          }
        />
        <ProgressCard
          label="Progress"
          value={`${Math.round(engine.progress * 100)}%`}
        />
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={Math.round(engine.progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 transition-[width] duration-300"
          style={{ width: `${Math.round(engine.progress * 100)}%` }}
        />
      </div>

      {/* Privacy footer */}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        🔒 Audio is processed in-memory only — nothing is recorded or uploaded.
        The mic stops automatically when you switch tabs.
      </p>

      {/* Permission modal */}
      <MicPermissionModal
        open={showPermission}
        onOpenChange={setShowPermission}
        onAllow={() => {
          setShowPermission(false);
          void engine.start();
        }}
      />

      {/* Feedback overlay */}
      <FeedbackOverlay
        feedback={engine.feedback}
        triggerKey={engine.feedbackKey}
        message={
          engine.feedback === "correct"
            ? "Perfect!"
            : engine.feedback === "wrong"
              ? "Try again — you've got this!"
              : null
        }
      />

      {/* Celebration screen on complete (uses engine.rewards if available) */}
      {engine.complete ? (
        <CelebrationScreen
          lessonTitle={curriculum.title}
          stickerEmoji={engine.rewards?.stickerEmoji ?? curriculum.stickerEmoji}
          stickerName={engine.rewards?.stickerName ?? curriculum.stickerName}
          coinsEarned={engine.rewards?.coinsEarned ?? 0}
          accuracy={engine.accuracy}
          onContinue={() => engine.reset()}
          onReplay={() => {
            engine.reset();
            void engine.start();
          }}
        />
      ) : null}
    </main>
  );
}

function ProgressCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "emerald" | "amber" | "slate";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    slate: "text-slate-500 dark:text-slate-400",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-xl font-bold tabular-nums", toneClasses[tone])}>
        {value}
      </div>
    </div>
  );
}
