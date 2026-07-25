// MIT License — Piano Learning App
// Song selector — card grid for the song library.

"use client";

import { useState } from "react";
import { Music2, Clock, Gauge, Crown, Star, Play, Square, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { SONGS } from "@/lib/songs";
import { usePianoStore } from "@/lib/store";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { loadFavorites, toggleFavorite } from "@/lib/favorites";
import type { Difficulty, Song } from "@/types";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Easy: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Intermediate: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

const DIFFICULTY_BORDERS: Record<Difficulty, string> = {
  Beginner: "border-l-4 border-l-emerald-400",
  Easy: "border-l-4 border-l-amber-400",
  Intermediate: "border-l-4 border-l-rose-400",
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
  const highScores = usePianoStore((s) => s.highScores);
  const audio = useAudioEngine();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    typeof window !== "undefined" ? loadFavorites() : new Set(),
  );

  const handleToggleFavorite = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => toggleFavorite(songId, prev));
  };

  // Sort songs: favorites first (alphabetical), then the rest (by original order).
  const sortedSongs = [...SONGS].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 0 : 1;
    const bFav = favorites.has(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    if (aFav === 0) return a.title.localeCompare(b.title);
    return 0; // preserve original order for non-favorites
  });

  const previewSong = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingId === song.id) {
      // Stop previewing.
      setPreviewingId(null);
      try {
        const mod = await audio.ensureReady();
        mod.releaseAllNotes();
      } catch {
        /* noop */
      }
      return;
    }
    setPreviewingId(song.id);
    try {
      await audio.ensureReady();
      const beatsPerSecond = song.bpm / 60;
      for (const note of song.notes) {
        const startSec = note.start / beatsPerSecond;
        const durationSec = note.duration / beatsPerSecond;
        window.setTimeout(() => {
          void audio.playNote(note.note, 0.9, durationSec);
          if (note === song.notes[song.notes.length - 1]) {
            window.setTimeout(() => setPreviewingId(null), durationSec * 1000 + 200);
          }
        }, startSec * 1000);
      }
    } catch {
      /* audio not ready */
      setPreviewingId(null);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "all">("all");

  // Filter songs by search query + difficulty.
  const filteredSongs = sortedSongs.filter((song) => {
    if (filterDifficulty !== "all" && song.difficulty !== filterDifficulty) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        (song.description ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search songs…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-900"
          aria-label="Search songs"
        />
        <div className="flex gap-1">
          {(["all", "Beginner", "Easy", "Intermediate"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setFilterDifficulty(d)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                filterDifficulty === d
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {searchQuery || filterDifficulty !== "all" ? (
        <p className="text-xs text-muted-foreground">
          {filteredSongs.length} of {sortedSongs.length} songs
        </p>
      ) : null}

      {/* Song grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredSongs.map((song, idx) => {
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
        const hs = highScores[song.id];
        return (
          <div
            key={song.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(song)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(song);
              }
            }}
            aria-pressed={isSelected}
            className={cn(
              "group relative flex flex-col gap-2 overflow-hidden rounded-2xl border bg-white/80 p-4 text-left shadow-sm card-lift card-shimmer animate-soft-enter cursor-pointer",
              `stagger-${(idx % 6) + 1}`,
              DIFFICULTY_BORDERS[song.difficulty],
              isSelected
                ? "border-amber-400 ring-2 ring-amber-300/50 dark:bg-amber-500/5"
                : "border-slate-200/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70",
            )}
          >
            {/* Favorite heart button (top-left corner) */}
            <button
              type="button"
              onClick={(e) => handleToggleFavorite(song.id, e)}
              className={cn(
                "absolute left-1.5 top-1.5 z-10 grid h-7 w-7 place-items-center rounded-full transition-all",
                favorites.has(song.id)
                  ? "bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400"
                  : "bg-white/60 text-slate-400 hover:text-rose-400 dark:bg-slate-900/60",
              )}
              aria-label={favorites.has(song.id) ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn("h-3.5 w-3.5", favorites.has(song.id) && "fill-current")}
              />
            </button>

            {/* Personal-best ribbon (top-right corner) */}
            {hs ? (
              <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-lg bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Crown className="h-2.5 w-2.5" />
                {hs.points >= 1000 ? `${(hs.points / 1000).toFixed(1)}k` : hs.points}
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow ring-1 ring-amber-300/30">
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
                <Music2 className="h-3 w-3" /> {noteCount}
              </span>
            </div>
            {/* Personal-best accuracy footer */}
            {hs ? (
              <div className="mt-1 flex items-center gap-1 border-t border-slate-200/60 pt-1.5 text-[10px] text-muted-foreground dark:border-slate-800">
                <Star className="h-2.5 w-2.5 text-amber-500" />
                Best: <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{hs.accuracy}%</span>
                <span className="opacity-60">· streak {hs.bestStreak}</span>
              </div>
            ) : null}

            {/* Preview button — play the song's audio without scoring */}
            <button
              type="button"
              onClick={(e) => void previewSong(song, e)}
              className={cn(
                "mt-1.5 inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors",
                previewingId === song.id
                  ? "border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
              aria-label={previewingId === song.id ? "Stop preview" : "Preview song"}
            >
              {previewingId === song.id ? (
                <>
                  <Square className="h-2.5 w-2.5" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-2.5 w-2.5" />
                  Preview
                </>
              )}
            </button>
          </div>
        );
      })}
      </div>

      {/* Empty state */}
      {filteredSongs.length === 0 ? (
        <div className="empty-state">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-medium">No songs found</p>
          <p className="text-xs">Try a different search or filter.</p>
        </div>
      ) : null}
    </div>
  );
}
