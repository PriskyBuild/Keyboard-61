// MIT License — Piano Learning App (Phase 2)
// /listen route — kid-friendly Microphone Listening Mode.
//
// This is a minimal smoke-test page for P2-C1/C2: it shows the mic capture
// state + the latest detected frequency. The full kid-friendly UI is added
// in P2-C4 (ListenPiano, Mascot, FeedbackOverlay, etc.).

"use client";

import { useState } from "react";
import { useMicListener } from "@/hooks/useMicListener";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, AlertTriangle, Activity } from "lucide-react";

export default function ListenPage() {
  const mic = useMicListener();
  const [lastFreq, setLastFreq] = useState<number>(-1);

  // Track the most recent non-silent frequency for display.
  if (mic.freq > 0 && mic.confidence > 0.5) {
    if (mic.freq !== lastFreq) setLastFreq(mic.freq);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Listen Mode</h1>
          <p className="text-sm text-muted-foreground">
            Sit at your real piano and play along — we&apos;ll listen and
            cheer you on!
          </p>
        </div>
      </header>

      {/* Mic status card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <span
            className={`grid h-14 w-14 place-items-center rounded-full ${
              mic.listening
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {mic.listening ? (
              <Mic className="h-7 w-7" />
            ) : (
              <MicOff className="h-7 w-7" />
            )}
          </span>
          <div className="flex-1">
            <div className="text-lg font-semibold">
              {mic.listening ? "🎤 Listening..." : "Microphone off"}
            </div>
            <div className="text-xs text-muted-foreground">
              {mic.usingFallback
                ? "Using main-thread fallback (browser lacks AudioWorklet)"
                : "AudioWorklet active"}
              {mic.supported ? "" : " · mic not supported in this browser"}
            </div>
          </div>
          <Button
            type="button"
            onClick={() => (mic.listening ? mic.stop() : void mic.start())}
            disabled={!mic.supported && !mic.listening}
            className="h-11 px-6 text-base"
          >
            {mic.listening ? "Stop" : "Start listening"}
          </Button>
        </div>

        {mic.error ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">
                {mic.error.reason.replace("-", " ")}
              </div>
              <div className="text-xs">{mic.error.message}</div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Live readout — for P2-C1/C2/C3 smoke testing */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Activity className="h-4 w-4" />
          Live pitch readout (debug)
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Readout label="Frequency" value={mic.freq > 0 ? `${mic.freq.toFixed(1)} Hz` : "—"} />
          <Readout label="Confidence" value={`${(mic.confidence * 100).toFixed(0)}%`} />
          <Readout label="RMS" value={mic.rms.toFixed(4)} />
          <Readout label="Frame" value={`${mic.frame}`} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Readout
            label="Detected note"
            value={mic.detectedNote ?? "—"}
            tone={mic.detectedNote ? "emerald" : "slate"}
          />
          <Readout
            label="Cents"
            value={mic.detectedNote ? `${mic.detectedCents > 0 ? "+" : ""}${mic.detectedCents}` : "—"}
          />
          <Readout
            label="Onset"
            value={mic.onset ? "✓ yes" : "—"}
            tone={mic.onset ? "emerald" : "slate"}
          />
          <Readout
            label="Silent"
            value={mic.silent ? "✓ silent" : "—"}
            tone={mic.silent ? "amber" : "slate"}
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Last clear pitch:{" "}
          <span className="font-mono font-semibold text-foreground">
            {lastFreq > 0 ? `${lastFreq.toFixed(1)} Hz` : "—"}
          </span>
          {lastFreq > 0 ? (
            <span className="ml-2 text-xs">
              (middle C ≈ 261.6 Hz · A4 = 440 Hz)
            </span>
          ) : null}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        🔒 Audio is processed in-memory only — nothing is recorded or uploaded.
        The mic stops automatically when you switch tabs.
      </p>
    </main>
  );
}

function Readout({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "emerald" | "amber" | "slate";
}) {
  const toneClasses: Record<string, string> = {
    default: "",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    slate: "text-slate-500 dark:text-slate-400",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${toneClasses[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}
