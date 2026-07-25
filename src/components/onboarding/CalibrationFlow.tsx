// MIT License — Piano Learning App (Phase 2)
// First-run calibration flow. The mascot asks the kid to "play middle C
// three times" so we can measure the room's ambient noise floor and pick
// a sensible RMS threshold for onset detection.
//
// The flow:
//   1. Mascot explains what's about to happen.
//   2. Kid clicks "Start calibration" → mic starts.
//   3. For each of 3 samples, the kid plays middle C; we capture the {freq,
//      confidence, rms} and add it to the samples array.
//   4. After 3 samples, we finalize → compute noiseFloor = 2× ambient RMS.
//   5. If confidence < 0.7, we show a kid-friendly suggestion (move closer,
//      close windows, etc.) and let them retry.
//   6. On success, the calibration result is passed back to the caller.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptCalibrationSample,
  CALIBRATION_SAMPLES,
  CALIBRATION_MIN_CONFIDENCE,
  finalizeCalibration,
  type CalibrationResult,
} from "@/lib/mic/calibration";
import { useMicListener } from "@/hooks/useMicListener";
import { Mascot } from "@/components/listen/Mascot";
import { Button } from "@/components/ui/button";
import { Mic, RefreshCw, Check, AlertTriangle } from "lucide-react";

export interface CalibrationFlowProps {
  /** Called when calibration succeeds. */
  onComplete: (result: CalibrationResult) => void;
  /** Called when the user wants to skip calibration. */
  onSkip?: () => void;
}

type Step = "intro" | "capturing" | "done" | "failed";

export function CalibrationFlow({ onComplete, onSkip }: CalibrationFlowProps) {
  const mic = useMicListener();
  const [step, setStep] = useState<Step>("intro");
  const [sampleCount, setSampleCount] = useState(0);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const samplesRef = useRef<
    Array<{ freq: number; confidence: number; rms: number }>
  >([]);

  // When capturing, watch mic messages and accept calibration samples.
  useEffect(() => {
    if (step !== "capturing") return;
    if (!mic.listening) return;
    if (mic.freq <= 0 || mic.confidence <= 0) return;

    const accepted = acceptCalibrationSample(samplesRef.current, {
      freq: mic.freq,
      confidence: mic.confidence,
      rms: mic.rms,
      frame: mic.frame,
    });
    if (accepted) {
      setSampleCount(samplesRef.current.length);
      if (samplesRef.current.length >= CALIBRATION_SAMPLES) {
        const r = finalizeCalibration(samplesRef.current);
        setResult(r);
        setStep(r.ok ? "done" : "failed");
        mic.stop();
      }
    }
  }, [mic.freq, mic.confidence, mic.rms, mic.frame, mic.listening, step, mic]);

  const start = useCallback(async () => {
    samplesRef.current = [];
    setSampleCount(0);
    setResult(null);
    setStep("capturing");
    await mic.start();
  }, [mic]);

  const retry = useCallback(async () => {
    samplesRef.current = [];
    setSampleCount(0);
    setResult(null);
    setStep("capturing");
    await mic.start();
  }, [mic]);

  const finish = useCallback(() => {
    if (result) {
      // Persist the noise floor via the mic hook so the lesson engine uses it.
      mic.setNoiseFloor(result.noiseFloor);
      onComplete(result);
    }
  }, [result, mic, onComplete]);

  // Cleanup mic on unmount.
  useEffect(() => {
    return () => {
      try {
        mic.stop();
      } catch {
        /* noop */
      }
    };
  }, [mic]);

  // ---- Render by step ----

  if (step === "intro") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 p-6 text-center">
        <Mascot state="idle" size={120} />
        <div>
          <h2 className="text-xl font-bold">Let&apos;s set up your microphone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bruno will ask you to play <strong>middle C</strong> three times.
            This helps him hear your piano clearly.
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          🎹 Middle C is the white key just to the left of the two black keys
          in the middle of your piano.
        </div>
        <div className="flex gap-2">
          {onSkip ? (
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          ) : null}
          <Button onClick={start} size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Start calibration
          </Button>
        </div>
      </div>
    );
  }

  if (step === "capturing") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 p-6 text-center">
        <Mascot
          state={mic.listening ? "listening" : "idle"}
          size={120}
          message={
            mic.listening
              ? `Play middle C! (${sampleCount}/${CALIBRATION_SAMPLES})`
              : "Tap start so I can hear you…"
          }
        />
        {!mic.listening ? (
          <Button onClick={() => void start()} size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Allow microphone
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Progress dots */}
            <div className="flex gap-2">
              {Array.from({ length: CALIBRATION_SAMPLES }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full transition-all ${
                    i < sampleCount
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-medium">
              {sampleCount < CALIBRATION_SAMPLES
                ? `Play middle C again (${sampleCount + 1}/${CALIBRATION_SAMPLES})`
                : "Finalizing…"}
            </p>
            {mic.error ? (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3 w-3" />
                {mic.error.message}
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  if (step === "failed" && result) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 p-6 text-center">
        <Mascot state="encourage" size={120} message="Let's try again!" />
        <div>
          <h2 className="text-xl font-bold">Almost there!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We heard you, but the sound wasn&apos;t clear enough.
          </p>
        </div>
        {result.suggestion ? (
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            💡 {result.suggestion}
          </div>
        ) : null}
        <div className="flex gap-2">
          {onSkip ? (
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          ) : null}
          <Button onClick={() => void retry()} size="lg" className="gap-2">
            <RefreshCw className="h-5 w-5" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // step === "done"
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 p-6 text-center">
      <Mascot state="happy" size={120} message="Perfect! I can hear you!" />
      <div>
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold">
          <Check className="h-5 w-5 text-emerald-500" />
          All set!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bruno can now hear your piano clearly. Time to start your first
          lesson!
        </p>
      </div>
      {/* Stats summary (debug-friendly but still kid-readable) */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Avg pitch
          </div>
          <div className="font-mono font-semibold">
            {result?.averageFreq.toFixed(0) ?? "—"} Hz
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Confidence
          </div>
          <div className="font-mono font-semibold">
            {((result?.confidence ?? 0) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Noise floor
          </div>
          <div className="font-mono font-semibold">
            {result?.noiseFloor.toFixed(3) ?? "—"}
          </div>
        </div>
      </div>
      <Button onClick={finish} size="lg">
        Start playing
      </Button>
    </div>
  );
}

/** Convenience: has the active profile completed calibration? */
export function isCalibrationDone(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("piano-app:calibrated") === "1";
}

/** Mark calibration as done. */
export function markCalibrationDone(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("piano-app:calibrated", "1");
  } catch {
    /* noop */
  }
}
