// MIT License — Piano Learning App
// Practice Mode toggle — flips between "Scored" (default) and "Practice"
// modes. In Practice mode:
//   - Wrong notes don't penalise the score.
//   - A "loop section" feature is enabled so the song auto-restarts when it
//     ends (wired to the song player via the Zustand store).
//   - A-B loop markers let the user pick a specific section to repeat.

"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Repeat, Sparkles, Flag, Square } from "lucide-react";
import { usePianoStore } from "@/lib/store";

export interface PracticeModeToggleProps {
  isPlaying: boolean;
  onRestart: () => void;
  /** Total song length in beats (for the A-B loop slider range). */
  songLengthBeats?: number;
  /** Song BPM — used to convert beat numbers to time labels (e.g. "0:12"). */
  songBpm?: number;
}

export function PracticeModeToggle({
  isPlaying,
  onRestart,
  songLengthBeats = 32,
  songBpm = 100,
}: PracticeModeToggleProps) {
  const practice = usePianoStore((s) => s.practiceMode);
  const setPractice = usePianoStore((s) => s.setPracticeMode);
  const loop = usePianoStore((s) => s.loopSong);
  const setLoop = usePianoStore((s) => s.setLoopSong);
  const loopStartBeat = usePianoStore((s) => s.loopStartBeat);
  const setLoopStartBeat = usePianoStore((s) => s.setLoopStartBeat);
  const loopEndBeat = usePianoStore((s) => s.loopEndBeat);
  const setLoopEndBeat = usePianoStore((s) => s.setLoopEndBeat);

  // Slider value: [startBeat, endBeat] (both 0..songLengthBeats)
  const sliderValue: [number, number] = [
    loopStartBeat ?? 0,
    loopEndBeat ?? songLengthBeats,
  ];

  const onSliderChange = (vals: number[]) => {
    const [start, end] = vals;
    setLoopStartBeat(start);
    setLoopEndBeat(end);
  };

  const resetMarkers = () => {
    setLoopStartBeat(null);
    setLoopEndBeat(null);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              practice ? "text-amber-500" : "text-slate-400",
            )}
          />
          <div>
            <div className="text-xs font-semibold">Practice mode</div>
            <div className="text-[10px] text-muted-foreground">
              No score penalty for wrong notes
            </div>
          </div>
        </div>
        <Switch
          checked={practice}
          onCheckedChange={(v) => {
            setPractice(v);
            if (v && isPlaying) onRestart();
          }}
          aria-label="Toggle practice mode"
        />
      </div>

      {/* Loop section (only shown in practice mode) */}
      {practice ? (
        <>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Repeat className="h-3 w-3 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">
                Loop (auto-restart)
              </span>
            </div>
            <Switch
              checked={loop}
              onCheckedChange={setLoop}
              aria-label="Loop song"
            />
          </div>

          {/* A-B loop markers (only shown when loop is enabled) */}
          {loop ? (
            <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <Flag className="h-2.5 w-2.5 text-amber-500" />
                  A-B loop section
                </span>
                <button
                  type="button"
                  onClick={resetMarkers}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <Square className="h-2 w-2" />
                  Reset
                </button>
              </div>
              <Slider
                value={sliderValue}
                onValueChange={onSliderChange}
                min={0}
                max={songLengthBeats}
                step={1}
                aria-label="A-B loop range"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>
                  A: {beatsToTime(loopStartBeat ?? 0, songBpm)}
                </span>
                <span className="text-amber-500 dark:text-amber-400">
                  Loop: {beatsToTime((loopEndBeat ?? songLengthBeats) - (loopStartBeat ?? 0), songBpm)}
                </span>
                <span>
                  B: {beatsToTime(loopEndBeat ?? songLengthBeats, songBpm)}
                </span>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** Convert a beat count to a "M:SS" time string using the song's BPM. */
function beatsToTime(beats: number, bpm: number): string {
  const seconds = (beats * 60) / bpm;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
