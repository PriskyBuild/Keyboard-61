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
  DEFAULT_NOISE_FLOOR,
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
  // We use a ref for the latest mic state + a polling timer (50ms) instead
  // of a useEffect on mic.freq — because mic.freq changes ~20×/sec which
  // would cause cascading re-renders. The poller reads the latest state
  // Keep a ref of the latest mic state so the polling timer can read it
  // without causing re-renders. Updated via useEffect (not during render).
  const micStateRef = useRef({ freq: -1, confidence: 0, rms: 0, frame: -1 });
  useEffect(() => {
    micStateRef.current = { freq: mic.freq, confidence: mic.confidence, rms: mic.rms, frame: mic.frame };
  }, [mic.freq, mic.confidence, mic.rms, mic.frame]);

  useEffect(() => {
    if (step !== "capturing") return;
    // Wait a moment for the mic to actually start producing data.
    const startDelay = window.setTimeout(() => {
      const pollId = window.setInterval(() => {
        const ms = micStateRef.current;
        if (ms.freq <= 0 || ms.confidence <= 0) return;
        if (!mic.listening) return;

        // Only process if we have a NEW frame (avoid re-processing the
        // same frame multiple times).
        const lastFrame = samplesRef.current.length > 0
          ? (samplesRef.current as unknown as Array<{ frame?: number }>)
          : [];

        const accepted = acceptCalibrationSample(samplesRef.current, {
          freq: ms.freq,
          confidence: ms.confidence,
          rms: ms.rms,
          frame: ms.frame,
        });
        if (accepted) {
          setSampleCount(samplesRef.current.length);
          if (samplesRef.current.length >= CALIBRATION_SAMPLES) {
            const r = finalizeCalibration(samplesRef.current);
            setResult(r);
            setStep(r.ok ? "done" : "failed");
            mic.stop();
            window.clearInterval(pollId);
          }
        }
      }, 80); // Poll every 80ms — enough time for a new worklet frame.
      // Store the interval ID for cleanup.
      (window as unknown as { __calibrationPollId?: number }).__calibrationPollId = pollId;
    }, 500); // Wait 500ms for the mic to warm up.

    return () => {
      window.clearTimeout(startDelay);
      const pollId = (window as unknown as { __calibrationPollId?: number }).__calibrationPollId;
      if (pollId) window.clearInterval(pollId);
    };
  }, [step, mic]);

  // Timeout — if no samples collected after 30 seconds, show a helpful
  // message instead of hanging forever on "Play middle C".
  useEffect(() => {
    if (step !== "capturing") return;
    const timeoutId = window.setTimeout(() => {
      if (samplesRef.current.length < CALIBRATION_SAMPLES) {
        setResult({
          noiseFloor: DEFAULT_NOISE_FLOOR,
          ambientRms: 0,
          averageFreq: 0,
          confidence: 0,
          ok: false,
          suggestion:
            "We didn't hear a clear note after 30 seconds. Try moving your device closer to the piano, turning up the volume, or check that your microphone isn't muted in your browser settings.",
        });
        setStep("failed");
        mic.stop();
      }
    }, 30_000);
    return () => window.clearTimeout(timeoutId);
  }, [step, mic]);

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

            {/* Live debug readout — shows the user the mic IS hearing something */}
            {mic.listening ? (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px] font-mono dark:border-slate-700 dark:bg-slate-800">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Freq:</span>
                  <span className={mic.freq > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                    {mic.freq > 0 ? `${mic.freq.toFixed(1)} Hz` : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className={mic.confidence > 0.5 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                    {(mic.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Volume:</span>
                  <span className={mic.rms > 0.005 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                    {(mic.rms * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
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
