// MIT License — Piano Learning App (Phase 2)
// Sticker album — grid of all collectible stickers, with earned vs locked
// states. Grouped by theme.

"use client";

import { cn } from "@/lib/utils";
import { STICKER_CATALOG, type StickerData } from "@/lib/storage";
import { stickersByTheme } from "@/lib/rewards";
import { Lock, Sparkles, Star } from "lucide-react";

export interface StickerAlbumProps {
  /** Set of sticker ids the profile has earned. */
  earnedStickerIds: Set<string>;
  className?: string;
}

const THEME_LABELS: Record<string, string> = {
  curriculum: "Lesson Stickers",
  animals: "Animal Friends",
  instruments: "Instruments",
  nature: "Nature",
  achievements: "Achievements",
};

const RARITY_STYLES: Record<StickerData["rarity"], string> = {
  common: "",
  rare: "ring-2 ring-purple-300 dark:ring-purple-500/40",
  legendary: "ring-2 ring-amber-400 dark:ring-amber-500/60",
};

export function StickerAlbum({
  earnedStickerIds,
  className,
}: StickerAlbumProps) {
  const grouped = stickersByTheme();
  const earned = STICKER_CATALOG.filter((s) => earnedStickerIds.has(s.id));
  const total = STICKER_CATALOG.length;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Header — collection progress */}
      <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Your collection
          </div>
          <div className="mt-0.5 text-2xl font-bold">
            {earned.length}{" "}
            <span className="text-base font-normal text-muted-foreground">
              / {total}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {earned.slice(0, 5).map((s) => (
            <span
              key={s.id}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white text-2xl shadow dark:bg-slate-800"
              title={s.name}
            >
              {s.emoji}
            </span>
          ))}
          {earned.length > 5 ? (
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              +{earned.length - 5}
            </span>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-500"
          style={{ width: `${(earned.length / total) * 100}%` }}
        />
      </div>

      {/* Themed sections */}
      {Object.entries(grouped).map(([theme, stickers]) => (
        <section key={theme}>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {THEME_LABELS[theme] ?? theme}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({stickers.filter((s) => earnedStickerIds.has(s.id)).length}/
              {stickers.length})
            </span>
          </h3>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {stickers.map((s) => {
              const isEarned = earnedStickerIds.has(s.id);
              return (
                <div
                  key={s.id}
                  title={`${s.name} (${s.rarity})${isEarned ? "" : " — locked"}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-all",
                    isEarned
                      ? `border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900 ${RARITY_STYLES[s.rarity]}`
                      : "border-slate-200 bg-slate-50 opacity-50 grayscale dark:border-slate-800 dark:bg-slate-900",
                  )}
                >
                  <span className={cn("text-2xl sm:text-3xl", !isEarned && "opacity-30")}>
                    {isEarned ? s.emoji : "❓"}
                  </span>
                  <span className="line-clamp-1 text-[9px] font-medium text-muted-foreground">
                    {isEarned ? s.name : "Locked"}
                  </span>
                  {s.rarity === "legendary" && isEarned ? (
                    <Star className="h-2.5 w-2.5 text-amber-500" />
                  ) : null}
                  {!isEarned ? (
                    <Lock className="h-2.5 w-2.5 text-slate-400" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
