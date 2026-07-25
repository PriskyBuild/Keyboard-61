// MIT License — Piano Learning App
// Toggle between Free Play and Learning modes. Uses a sliding active
// indicator for a tactile, polished feel.

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
  const activeIdx = OPTIONS.findIndex((o) => o.value === mode);

  return (
    <div
      role="tablist"
      aria-label="Mode"
      className="relative inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Sliding active indicator */}
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md transition-[left,width] duration-300 ease-out"
        style={{
          // Each button is 50% wide minus the 0.25rem p-1 padding.
          left: `calc(${activeIdx * 50}% + 0.25rem)`,
          width: "calc(50% - 0.5rem)",
        }}
      />
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
              "relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
              isActive
                ? "text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
            )}
          >
            <Icon className={cn("h-4 w-4 transition-transform duration-300", isActive && "scale-110")} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
