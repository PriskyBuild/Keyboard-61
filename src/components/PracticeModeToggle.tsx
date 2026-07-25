// MIT License — Piano Learning App
// Practice Mode toggle — flips between "Scored" (default) and "Practice"
// modes. In Practice mode:
//   - Wrong notes don't penalise the score.
//   - A "loop section" feature is enabled so the song auto-restarts when it
//     ends (wired to the song player via the Zustand store).

"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Repeat, Sparkles } from "lucide-react";
import { usePianoStore } from "@/lib/store";

export interface PracticeModeToggleProps {
  isPlaying: boolean;
  onRestart: () => void;
}

export function PracticeModeToggle({
  isPlaying,
  onRestart,
}: PracticeModeToggleProps) {
  const practice = usePianoStore((s) => s.practiceMode);
  const setPractice = usePianoStore((s) => s.setPracticeMode);
  const loop = usePianoStore((s) => s.loopSong);
  const setLoop = usePianoStore((s) => s.setLoopSong);

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
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Repeat className="h-3 w-3 text-amber-500" />
            <span className="text-[11px] text-muted-foreground">
              Loop whole song (auto-restart)
            </span>
          </div>
          <Switch
            checked={loop}
            onCheckedChange={setLoop}
            aria-label="Loop song"
          />
        </div>
      ) : null}
    </div>
  );
}
