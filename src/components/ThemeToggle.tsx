// MIT License — Piano Learning App
// Light / dark / system theme toggle.
//
// Uses next-themes. To avoid SSR hydration mismatches (next-themes resolves
// the theme client-side after mount), we use CSS attribute selectors based
// on the `class` that next-themes sets on <html>, rather than reading the
// theme value in React state during render.

"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, type LucideIcon } from "lucide-react";

type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function ThemeToggle() {
  // We don't read `theme` for rendering — we rely on next-themes' `class`
  // attribute on <html> + CSS to highlight the active option. We only need
  // `setTheme` here for the click handler.
  const { setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="piano-theme-toggle inline-flex items-center rounded-full border border-slate-200 bg-white/80 p-0.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={false}
          title={label}
          data-theme-choice={value}
          onClick={() => setTheme(value)}
          className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground aria-[checked=true]:bg-amber-500 aria-[checked=true]:text-white aria-[checked=true]:shadow"
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
