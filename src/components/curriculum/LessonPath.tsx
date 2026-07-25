// MIT License — Piano Learning App (Phase 2)
// Visual 12-step lesson path. Renders lessons in a winding layout that
// suggests progression — kids can see what's next + what's locked.

"use client";

import { cn } from "@/lib/utils";
import type { CurriculumLesson } from "@/lib/curriculum";
import { LessonCard } from "@/components/curriculum/LessonCard";

export interface LessonPathProps {
  lessons: CurriculumLesson[];
  /** Set of completed lesson ids. */
  completedLessonIds: Set<string>;
  /** Best accuracy per lesson id (0-100). */
  bestAccuracies: Record<string, number>;
}

export function LessonPath({
  lessons,
  completedLessonIds,
  bestAccuracies,
}: LessonPathProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Path header */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white shadow-md">
        <div>
          <h2 className="text-lg font-bold">Your Piano Journey</h2>
          <p className="text-sm text-white/90">
            {completedLessonIds.size} of {lessons.length} lessons complete
          </p>
        </div>
        <div className="text-3xl">🎹</div>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500"
          style={{
            width: `${(completedLessonIds.size / lessons.length) * 100}%`,
          }}
        />
      </div>

      {/* Lesson cards in a winding grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson, idx) => {
          const completed = completedLessonIds.has(lesson.id);
          const unlocked = isUnlocked(lesson, completedLessonIds);
          // Alternating vertical offset for the "path" feel on larger screens.
          const offset = idx % 3 === 1 ? "lg:translate-y-4" : "";
          return (
            <div key={lesson.id} className={cn(offset)}>
              <LessonCard
                lesson={lesson}
                unlocked={unlocked}
                completed={completed}
                bestAccuracy={bestAccuracies[lesson.id]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isUnlocked(
  lesson: CurriculumLesson,
  completedLessonIds: Set<string>,
): boolean {
  if (lesson.number === 1) return true;
  // Find the previous lesson in the curriculum.
  const prev = CURRICULUM_PREV(lesson.number);
  return prev ? completedLessonIds.has(prev) : false;
}

// Inline lookup of the previous lesson id (avoids circular import with
// curriculum.ts which re-exports isLessonUnlocked — we keep this small helper
// here so the component is self-contained).
function CURRICULUM_PREV(num: number): string | null {
  // Mirror of CURRICULUM ids (kept in sync manually — small enough).
  const IDS = [
    "lesson-01-middle-c",
    "lesson-02-cde",
    "lesson-03-cdefg",
    "lesson-04-lh-c3",
    "lesson-05-both-hands",
    "lesson-06-rhythm",
    "lesson-07-stepwise",
    "lesson-08-first-skip",
    "lesson-09-jingle",
    "lesson-10-chord",
    "lesson-11-f-position",
    "lesson-12-recital",
  ];
  return IDS[num - 2] ?? null;
}
