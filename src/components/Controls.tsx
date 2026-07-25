// MIT License — Piano Learning App
// Controls bar — Free Play: volume, sustain, reverb, note-name toggle, hint
// toggle, octave shift. Learning: tempo + (visualizer controls handled elsewhere).

"use client";

import { useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  Footprints,
  Sparkles,
  Tag,
  Keyboard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePianoStore } from "@/lib/store";
import { useAudioEngine } from "@/hooks/useAudioEngine";

const VOLUME_DB_MIN = -36;
const VOLUME_DB_MAX = 0;

function volumeToDb(v: number): number {
  // v in [0,1]; map exponentially so the slider feels natural.
  if (v <= 0) return VOLUME_DB_MIN;
  const db = VOLUME_DB_MIN + (VOLUME_DB_MAX - VOLUME_DB_MIN) * v;
  return Math.round(db * 10) / 10;
}

export function Controls() {
  const sustain = usePianoStore((s) => s.sustain);
  const toggleSustain = usePianoStore((s) => s.toggleSustain);
  const volume = usePianoStore((s) => s.volume);
  const setVolume = usePianoStore((s) => s.setVolume);
  const reverb = usePianoStore((s) => s.reverb);
  const setReverb = usePianoStore((s) => s.setReverb);
  const showNoteNames = usePianoStore((s) => s.showNoteNames);
  const toggleNoteNames = usePianoStore((s) => s.toggleNoteNames);
  const showKeyHints = usePianoStore((s) => s.showKeyHints);
  const toggleKeyHints = usePianoStore((s) => s.toggleKeyHints);
  const keyboardOctave = usePianoStore((s) => s.keyboardOctave);
  const shiftOctave = usePianoStore((s) => s.shiftOctave);

  const audio = useAudioEngine();

  // Sync volume / reverb into the audio engine whenever they change.
  useEffect(() => {
    void audio.setVolumeDb(volumeToDb(volume));
  }, [audio, volume]);

  useEffect(() => {
    void audio.setReverbWet(reverb);
  }, [audio, reverb]);

  useEffect(() => {
    void audio.setSustain(sustain);
  }, [audio, sustain]);

  return (
    <section
      aria-label="Controls"
      className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm backdrop-blur sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900/70"
    >
      {/* Volume */}
      <Control icon={<Volume2 className="h-4 w-4" />} label="Volume">
        <Slider
          value={[Math.round(volume * 100)]}
          onValueChange={(vals) => setVolume(vals[0] / 100)}
          min={0}
          max={100}
          step={1}
          aria-label="Master volume"
        />
      </Control>

      {/* Reverb */}
      <Control icon={<Sparkles className="h-4 w-4" />} label="Reverb">
        <Slider
          value={[Math.round(reverb * 100)]}
          onValueChange={(vals) => setReverb(vals[0] / 100)}
          min={0}
          max={100}
          step={1}
          aria-label="Reverb wet"
        />
      </Control>

      {/* Octave shift (computer-keyboard mapping) */}
      <Control icon={<Keyboard className="h-4 w-4" />} label={`Mapped octave: ${keyboardOctave}`}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => shiftOctave(-1)}
            disabled={keyboardOctave <= 2}
            className="h-8 flex-1"
            aria-label="Shift mapped octave down"
          >
            <ChevronDown className="h-4 w-4" /> Oct down
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => shiftOctave(1)}
            disabled={keyboardOctave >= 6}
            className="h-8 flex-1"
            aria-label="Shift mapped octave up"
          >
            <ChevronUp className="h-4 w-4" /> Oct up
          </Button>
        </div>
      </Control>

      {/* Toggles: sustain / note names / hints */}
      <div className="flex flex-col gap-2">
        <ToggleRow
          icon={<Footprints className="h-4 w-4" />}
          label="Sustain"
          checked={sustain}
          onChange={toggleSustain}
        />
        <ToggleRow
          icon={<Tag className="h-4 w-4" />}
          label="Note names"
          checked={showNoteNames}
          onChange={toggleNoteNames}
        />
        <ToggleRow
          icon={<Keyboard className="h-4 w-4" />}
          label="Key hints"
          checked={showKeyHints}
          onChange={toggleKeyHints}
        />
      </div>
    </section>
  );
}

function Control({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-amber-600">{icon}</span>
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  // Use a non-button wrapper to avoid nesting a button inside a button
  // (the shadcn Switch is itself a <button>). The wrapper is a labelled
  // container with role="switch" for a11y.
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange();
        }
      }}
      tabIndex={0}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200/60 bg-white/80 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/60",
        checked && "border-amber-400/60 bg-amber-50 dark:bg-amber-500/10",
      )}
    >
      <span className="flex items-center gap-2">
        <span className={checked ? "text-amber-600" : "text-muted-foreground"}>
          {icon}
        </span>
        {label}
      </span>
      <Switch checked={checked} aria-hidden tabIndex={-1} />
    </div>
  );
}
