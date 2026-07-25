// MIT License — Piano Learning App
// Toggle between Free Play and Learning modes.

"use client";

import { Music2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePianoStore } from "@/lib/store";
import type { Mode } from "@/types";

const OPTIONS: { value: Mode; label: string; icon: typeof Music2 }[] = [
  { value: "free", label: "Free Play", icon: Music2 },
  { value: "learn", label: "Learning", icon: GraduationCap },
];

export function ModeToggle() {
  const mode = usePianoStore((s) => s.mode);
  const setMode = usePianoStore((s) => s.setMode);

  return (
    <div
      role="tablist"
      aria-label="Mode"
      className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setMode(value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
