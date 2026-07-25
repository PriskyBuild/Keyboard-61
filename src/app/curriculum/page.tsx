// MIT License — Piano Learning App (Phase 2)
// /curriculum route — 12-lesson structured beginner path.
//
// Reads the active profile's completed-lesson set + best accuracies from
// localStorage and renders the LessonPath. Tap a lesson card to navigate
// to /listen?lesson=ID.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LessonPath } from "@/components/curriculum/LessonPath";
import { Mascot } from "@/components/listen/Mascot";
import { CURRICULUM } from "@/lib/curriculum";
import {
  getActiveProfile,
  getProfileProgress,
  loadPhase2,
  migrateFromPhase1,
  type Phase2Storage,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function CurriculumPage() {
  // Hydrate from localStorage. We use a lazy initial state computed at
  // module-eval time (client-only) so the first render already has the
  // storage; this avoids both hydration mismatches AND setState-in-effect.
  const [storage, setStorage] = useState<Phase2Storage | null>(() => {
    if (typeof window === "undefined") return null;
    migrateFromPhase1();
    return loadPhase2();
  });

  // Re-load when the tab regains focus so progress made elsewhere reflects.
  useEffect(() => {
    const onFocus = () => setStorage(loadPhase2());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!storage) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading curriculum…</div>
      </main>
    );
  }

  const profile = getActiveProfile(storage);
  if (!profile) {
    return <NoProfileScreen />;
  }

  const progress = getProfileProgress(storage, profile.id);
  const completedLessonIds = new Set(
    Object.values(progress.lessons)
      .filter((l) => l.completed)
      .map((l) => l.lessonId),
  );
  const bestAccuracies: Record<string, number> = {};
  for (const [lessonId, lp] of Object.entries(progress.lessons)) {
    if (lp.completed) bestAccuracies[lessonId] = lp.bestAccuracy;
  }

  const completedCount = completedLessonIds.size;
  const totalLessons = CURRICULUM.length;
  const percentComplete = Math.round((completedCount / totalLessons) * 100);
  const nextLesson =
    CURRICULUM.find((l) => !completedLessonIds.has(l.id)) ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Lessons</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            12 lessons to become a piano star!
          </p>
        </div>
        <Link
          href="/listen"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Listen Mode
        </Link>
      </header>

      {/* Next-lesson hero card */}
      {nextLesson ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Mascot state="happy" size={80} />
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <Sparkles className="h-3 w-3" />
                Up next — Lesson {nextLesson.number}
              </div>
              <h2 className="mt-1 text-xl font-bold">{nextLesson.title}</h2>
              <p className="text-sm text-muted-foreground">{nextLesson.focus}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ⏱ {nextLesson.estMinutes} min · 🪙 {nextLesson.coins} coins ·{" "}
                {nextLesson.stickerEmoji} {nextLesson.stickerName}
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href={`/listen?lesson=${nextLesson.id}`}>
              Start lesson {nextLesson.number}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900">
          <Mascot state="happy" size={80} message="Piano star!" />
          <div>
            <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              🎉 You finished all 12 lessons!
            </h2>
            <p className="text-sm text-muted-foreground">
              Bruno is so proud of you. Keep practising in Listen Mode or try
              the songs in Learning Mode!
            </p>
          </div>
        </div>
      )}

      {/* Lesson path */}
      <LessonPath
        lessons={CURRICULUM}
        completedLessonIds={completedLessonIds}
        bestAccuracies={bestAccuracies}
      />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {completedCount} of {totalLessons} complete · {percentComplete}%
      </p>
    </main>
  );
}

function NoProfileScreen() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <Mascot state="idle" size={120} message="Hi! I'm Bruno!" />
      <div>
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask a grown-up to set up your profile in the Parent dashboard first.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/parent">Set up profile</Link>
      </Button>
    </main>
  );
}
