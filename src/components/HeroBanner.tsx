// MIT License — Piano Learning App
// Hero banner — eye-catching intro shown at the top of the home page (Free
// Play mode). Highlights the new Phase 2 features (mic listening, curriculum,
// parent dashboard) with quick-cta buttons.

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ear, GraduationCap, Trophy, ArrowRight, Sparkles } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-sm dark:border-amber-500/30 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-rose-500/10 sm:p-8">
      {/* Decorative floating notes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span className="absolute left-[10%] top-2 text-3xl opacity-20 animate-float-note">🎵</span>
        <span className="absolute right-[15%] top-6 text-2xl opacity-15 animate-float-note" style={{ animationDelay: "0.7s" }}>🎶</span>
        <span className="absolute right-[35%] top-1 text-xl opacity-20 animate-float-note" style={{ animationDelay: "1.4s" }}>🎹</span>
        <span className="absolute left-[55%] top-3 text-2xl opacity-15 animate-float-note" style={{ animationDelay: "0.3s" }}>🌟</span>
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            <Sparkles className="h-3 w-3" />
            New: Microphone Listening Mode
          </div>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            Play your <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">real piano</span>, we&apos;ll listen.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Sit at your piano, play along, and Bruno the bear cheers you on.
            Plus 12 structured lessons, a sticker album, and a parent dashboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/listen">
                <Ear className="h-4 w-4" />
                Try Listen Mode
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/curriculum">
                <GraduationCap className="h-4 w-4" />
                Start lessons
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5">
              <Link href="/stickers">
                <Trophy className="h-4 w-4" />
                Sticker album
              </Link>
            </Button>
          </div>
        </div>

        {/* Right-side mascot hint card */}
        <Link
          href="/curriculum"
          className="group hidden shrink-0 items-center gap-3 rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm transition hover:shadow-md dark:border-amber-500/30 dark:bg-slate-900/80 sm:flex"
        >
          <div className="text-5xl">🐻</div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Bruno says
            </div>
            <div className="text-sm font-medium">
              Hi! I&apos;m Bruno. Ready to play?
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              Let&apos;s go
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
