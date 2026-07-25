// MIT License — Piano Learning App
// Song selector — card grid for the song library.

"use client";

import { Music2, Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { SONGS } from "@/lib/songs";
import { usePianoStore } from "@/lib/store";
import type { Difficulty, Song } from "@/types";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Easy: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Intermediate: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export interface SongSelectorProps {
  /** Called when the user picks a song. */
  onSelect: (song: Song) => void;
  /** Currently selected song id (for highlight). */
  selectedId?: string | null;
}

export function SongSelector({ onSelect, selectedId }: SongSelectorProps) {
  // Wire to store so the active selection is visible.
  const current = usePianoStore((s) => s.currentSong);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {SONGS.map((song) => {
        const isSelected =
          selectedId === song.id || current?.id === song.id;
        const noteCount = song.notes.length;
        const seconds =
          (song.notes.reduce(
            (m, n) => Math.max(m, n.start + n.duration),
            0,
          ) *
            60) /
          song.bpm;
        return (
          <button
            key={song.id}
            type="button"
            onClick={() => onSelect(song)}
            aria-pressed={isSelected}
            className={cn(
              "group relative flex flex-col gap-2 rounded-2xl border bg-white/80 p-4 text-left shadow-sm transition hover:shadow-md hover:-translate-y-0.5",
              isSelected
                ? "border-amber-400 ring-2 ring-amber-300/50 dark:bg-amber-500/5"
                : "border-slate-200/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
                <Music2 className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  DIFFICULTY_COLORS[song.difficulty],
                )}
              >
                {song.difficulty}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">
                {song.title}
              </h3>
              <p className="text-xs text-muted-foreground">{song.artist}</p>
            </div>
            {song.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {song.description}
              </p>
            ) : null}
            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-3 w-3" /> {song.bpm} BPM
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {Math.ceil(seconds)}s
              </span>
              <span className="inline-flex items-center gap-1">
                <Music2 className="h-3 w-3" /> {noteCount} notes
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
