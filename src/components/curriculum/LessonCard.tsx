// MIT License — Piano Learning App (Phase 2)
// Single lesson tile in the curriculum path.

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CurriculumLesson } from "@/lib/curriculum";
import { Lock, Check, Play, Star } from "lucide-react";

export interface LessonCardProps {
  lesson: CurriculumLesson;
  /** True if this lesson is unlocked (previous lesson completed). */
  unlocked: boolean;
  /** True if this lesson is completed. */
  completed: boolean;
  /** Best accuracy (0-100) if completed. */
  bestAccuracy?: number;
  className?: string;
}

export function LessonCard({
  lesson,
  unlocked,
  completed,
  bestAccuracy,
  className,
}: LessonCardProps) {
  // When unlocked, render as a Next.js Link; otherwise render a plain div.
  if (unlocked) {
    return (
      <Link
        href={`/listen?lesson=${lesson.id}`}
        className={cn(
          "group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-4 transition-all",
          completed
            ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:border-emerald-500/40 dark:from-emerald-500/10 dark:to-slate-900"
            : "border-amber-300 bg-white shadow-sm card-lift dark:border-amber-500/40 dark:bg-slate-900",
          className,
        )}
      >
        <LessonCardContent
          lesson={lesson}
          unlocked={unlocked}
          completed={completed}
          bestAccuracy={bestAccuracy}
        />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-60 transition-all dark:border-slate-800 dark:bg-slate-900/50",
        className,
      )}
    >
      <LessonCardContent
        lesson={lesson}
        unlocked={unlocked}
        completed={completed}
        bestAccuracy={bestAccuracy}
      />
    </div>
  );
}

function LessonCardContent({
  lesson,
  unlocked,
  completed,
  bestAccuracy,
}: {
  lesson: CurriculumLesson;
  unlocked: boolean;
  completed: boolean;
  bestAccuracy?: number;
}) {
  return (
    <>
      {/* Lesson number badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl text-base font-bold shadow",
            completed
              ? "bg-emerald-500 text-white"
              : unlocked
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                : "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
          )}
        >
          {completed ? <Check className="h-5 w-5" /> : lesson.number}
        </span>
        <span className="text-2xl" aria-hidden>
          {lesson.stickerEmoji}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-semibold leading-tight">{lesson.title}</h3>
        <p className="text-xs text-muted-foreground">{lesson.focus}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>⏱ {lesson.estMinutes} min</span>
        <span className="inline-flex items-center gap-0.5">
          🪙 {lesson.coins}
        </span>
      </div>

      {/* Status row */}
      <div className="mt-1 border-t border-slate-200 pt-2 dark:border-slate-800">
        {completed ? (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              Completed
            </span>
            {bestAccuracy !== undefined ? (
              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3" />
                {bestAccuracy}%
              </span>
            ) : null}
          </div>
        ) : unlocked ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Play className="h-3 w-3" />
            Tap to start
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        )}
      </div>
    </>
  );
}
