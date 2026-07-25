// MIT License — Piano Learning App
// Top-level client shell: header, mode toggle, piano, controls, sticky footer.

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ModeToggle } from "@/components/ModeToggle";
import { Piano } from "@/components/Piano";
import { Metronome } from "@/components/Metronome";
import { HeroBanner } from "@/components/HeroBanner";
import {
  CommandPalette,
  CommandPaletteHint,
} from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HelpModal, useHelpModalState } from "@/components/HelpModal";
import { StatsButton } from "@/components/StatsPanel";
import { usePianoStore } from "@/lib/store";
import { Music4, BadgeInfo, HelpCircle, Github } from "lucide-react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { Button } from "@/components/ui/button";
import type { Mode } from "@/types";

// Free Play / Learning controls are dynamically imported because they depend
// on the audio engine which is client-only.
const Controls = dynamic(
  () => import("@/components/Controls").then((m) => m.Controls),
  { ssr: false },
);

const LearningPanel = dynamic(
  () => import("@/components/LearningPanel").then((m) => m.LearningPanel),
  { ssr: false },
);

export default function AppShell() {
  const mode = usePianoStore((s) => s.mode);
  const bumpStatField = usePianoStore((s) => s.bumpStatField);
  const audio = useAudioEngine();
  useKeyboardInput();
  const helpModal = useHelpModalState();

  // Count Free Play sessions — bump on each transition INTO free mode.
  // (Initial mount doesn't count; we only want explicit user transitions.)
  const [prevMode, setPrevMode] = useState<Mode | null>(null);
  if (prevMode !== mode) {
    if (prevMode !== null && mode === "free") {
      bumpStatField("freePlaySessions", 1);
    }
    setPrevMode(mode);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header onOpenHelp={() => helpModal.setOpen(true)} />

      <main className="flex flex-1 flex-col gap-6 px-3 py-6 sm:px-6 lg:px-8">
        {/* Hero banner — Free Play only, highlights Phase 2 features */}
        {mode === "free" ? <HeroBanner /> : null}

        {/* Mode toggle + status row */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <ModeToggle />
          <AudioStatusBadge
            ready={audio.state.ready}
            usingFallback={audio.state.usingFallback}
            error={audio.state.error}
          />
        </div>

        {mode === "learn" ? (
          // LearningPanel renders its own Piano with the song-player's
          // scoring callbacks wired in. We don't render a second Piano here.
          <LearningPanel />
        ) : (
          <>
            <Piano />
            {/* Metronome is Free-Play-only — Learning Mode already drives
                the kid with falling notes. */}
            <Metronome />
          </>
        )}

        {/* Controls are shared (volume, sustain, reverb, note-name + key-hint
            toggles, octave shift). Useful in both Free Play and Learning. */}
        <Controls />
      </main>

      <Footer />

      <HelpModal open={helpModal.open} onOpenChange={helpModal.setOpen} />
      <CommandPalette />
    </div>
  );
}

function Header({ onOpenHelp }: { onOpenHelp: () => void }) {
  return (
    <header className="header-gradient sticky top-0 z-30 border-b border-slate-200/60 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md ring-1 ring-amber-300/40 transition-transform hover:scale-105">
            <Music4 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
              Piano Learning App
            </h1>
            <p className="truncate text-[11px] text-muted-foreground">
              61 keys · C2–C7 · Free Play + Guided Songs
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <CommandPaletteHint />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 gap-1.5 px-2.5 text-xs sm:inline-flex"
            onClick={onOpenHelp}
            aria-label="Keyboard shortcuts help"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Shortcuts</span>
          </Button>
          <StatsButton />
          <ThemeToggle />
          <a
            href="https://github.com/PriskyBuild/Piano-Learn"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:text-slate-900 hover:shadow-sm sm:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
            aria-label="Source on GitHub"
          >
            <Github className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

function AudioStatusBadge({
  ready,
  usingFallback,
  error,
}: {
  ready: boolean;
  usingFallback: boolean;
  error: string | null;
}) {
  let tone: "ready" | "loading" | "fallback" | "error" = "loading";
  let label = "Tap a key to enable audio";
  if (error) {
    tone = "error";
    label = "Audio error";
  } else if (ready && usingFallback) {
    tone = "fallback";
    label = "Synth fallback";
  } else if (ready) {
    tone = "ready";
    label = "Piano samples loaded";
  }
  const dot =
    tone === "ready"
      ? "bg-emerald-500"
      : tone === "fallback"
        ? "bg-amber-500"
        : tone === "error"
          ? "bg-rose-500"
          : "bg-slate-400 animate-pulse";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
      <BadgeInfo className="h-3.5 w-3.5 opacity-60" />
    </span>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/60 bg-slate-50/60 py-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-3 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>Built with Next.js 16 · Tone.js · Tailwind CSS</p>
        <p>MIT License — fully client-side, deploys to Vercel with zero env vars.</p>
      </div>
    </footer>
  );
}
