// MIT License — Piano Learning App (Phase 2)
// /stickers route — sticker album + shop. (Full implementation in P2-C6.)

"use client";

import Link from "next/link";
import { Mascot } from "@/components/listen/Mascot";
import { Button } from "@/components/ui/button";
import { STICKER_CATALOG } from "@/lib/storage";

export default function StickersPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Sticker Album</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Collect stickers by completing lessons!
          </p>
        </div>
        <Link
          href="/curriculum"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          ← Lessons
        </Link>
      </header>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-center dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900">
        <Mascot state="happy" size={100} message="Collect them all!" />
        <p className="max-w-md text-sm text-muted-foreground">
          You can collect {STICKER_CATALOG.length}+ stickers by completing
          lessons, building streaks, and scoring perfect. The album fills up
          as you play — check back after each lesson!
        </p>
        <Button asChild>
          <Link href="/curriculum">Start a lesson</Link>
        </Button>
      </div>

      {/* Preview grid of all available stickers (locked state) */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
        {STICKER_CATALOG.map((s) => (
          <div
            key={s.id}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 opacity-40 grayscale dark:border-slate-800 dark:bg-slate-900"
            title={`${s.name} (${s.rarity})`}
          >
            <span className="text-2xl sm:text-3xl">{s.emoji}</span>
            <span className="px-1 text-[9px] font-medium text-muted-foreground line-clamp-1">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
