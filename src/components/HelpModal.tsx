// MIT License — Piano Learning App
// Keyboard-shortcuts help modal. Triggered by a "?" button in the header.

"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Keyboard, type LucideIcon } from "lucide-react";

interface ShortcutRow {
  keys: string[];
  description: string;
  icon?: LucideIcon;
}

const WHITE_KEYS = ["a", "s", "d", "f", "g", "h", "j"];
const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_KEYS = ["w", "e", "t", "y", "u"];
const BLACK_NOTES = ["C#", "D#", "F#", "G#", "A#"];

const GLOBAL_SHORTCUTS: ShortcutRow[] = [
  { keys: ["Z"], description: "Shift mapped octave down" },
  { keys: ["X"], description: "Shift mapped octave up" },
];

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-6 p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Keyboard className="h-5 w-5 text-amber-500" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Play the piano with your computer keyboard. The home row maps to
            one octave; <kbd className="rounded bg-amber-100 px-1 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Z</kbd>/<kbd className="rounded bg-amber-100 px-1 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">X</kbd> shift which octave.
          </DialogDescription>
        </DialogHeader>

        {/* White keys mapping */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            White keys (current octave)
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {WHITE_KEYS.map((k, i) => (
              <KeyCap
                key={k}
                letter={k.toUpperCase()}
                label={WHITE_NOTES[i]}
                variant="white"
              />
            ))}
          </div>
        </div>

        {/* Black keys mapping */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Black keys (sharps)
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {BLACK_KEYS.map((k, i) => (
              <KeyCap
                key={k}
                letter={k.toUpperCase()}
                label={BLACK_NOTES[i]}
                variant="black"
              />
            ))}
          </div>
        </div>

        {/* Global shortcuts */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Global
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GLOBAL_SHORTCUTS.map((row) => (
              <div
                key={row.description}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <span className="text-sm">{row.description}</span>
                <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {row.keys.join(" + ")}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KeyCap({
  letter,
  label,
  variant,
}: {
  letter: string;
  label: string;
  variant: "white" | "black";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${
        variant === "black"
          ? "border-slate-700 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-100"
      }`}
    >
      <kbd
        className={`text-sm font-bold uppercase ${
          variant === "black" ? "text-amber-300" : "text-amber-600"
        }`}
      >
        {letter}
      </kbd>
      <span className="text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/** Convenience hook to manage open/close state + a trigger button. */
export function useHelpModalState() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
