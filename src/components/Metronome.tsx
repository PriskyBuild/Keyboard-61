// MIT License — Piano Learning App
// Metronome UI — a compact, attractive panel with a visual beat indicator
// (pulsing dots for each beat in the bar), BPM slider, time-signature
// selector, and a play/pause button.

"use client";

import { useMetronome } from "@/hooks/useMetronome";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Play, Pause, Gauge } from "lucide-react";

export interface MetronomeProps {
  className?: string;
}

const TIME_SIGS = [2, 3, 4, 5, 6, 7, 8] as const;

export function Metronome({ className }: MetronomeProps) {
  const met = useMetronome();

  return (
    <section
      aria-label="Metronome"
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-amber-500" />
          Metronome
        </div>
        <Button
          type="button"
          size="sm"
          variant={met.running ? "default" : "outline"}
          onClick={() => void met.toggle()}
          aria-pressed={met.running}
          className="gap-1.5"
        >
          {met.running ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Stop
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Start
            </>
          )}
        </Button>
      </div>

      {/* Beat dots */}
      <div className="mb-3 flex items-center justify-center gap-2">
        {Array.from({ length: met.beatsPerBar }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full transition-all duration-100",
              met.running && met.currentBeat === i
                ? i === 0
                  ? "scale-125 bg-gradient-to-br from-amber-400 to-orange-500 shadow-md ring-2 ring-amber-300"
                  : "scale-110 bg-emerald-500 shadow-sm"
                : "bg-slate-200 dark:bg-slate-700",
            )}
            aria-label={`Beat ${i + 1}${i === 0 ? " (accent)" : ""}`}
          />
        ))}
      </div>

      {/* BPM slider */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Tempo</span>
          <span className="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {met.bpm} BPM
          </span>
        </div>
        <Slider
          value={[met.bpm]}
          onValueChange={(v) => void met.setBpm(v[0])}
          min={40}
          max={220}
          step={1}
          aria-label="Beats per minute"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>40</span>
          <span>100</span>
          <span>140</span>
          <span>180</span>
          <span>220</span>
        </div>
      </div>

      {/* Time-signature selector */}
      <div>
        <div className="mb-1.5 text-xs font-medium text-muted-foreground">
          Beats per bar
        </div>
        <div className="grid grid-cols-7 gap-1">
          {TIME_SIGS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => met.setBeatsPerBar(n)}
              aria-pressed={met.beatsPerBar === n}
              className={cn(
                "rounded-md py-1.5 text-xs font-semibold transition-colors",
                met.beatsPerBar === n
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
