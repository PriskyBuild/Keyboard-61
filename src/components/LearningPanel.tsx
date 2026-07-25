// MIT License — Piano Learning App
// Learning Mode layout: song selector, visualizer, scoreboard, transport controls.
// Re-uses the shared <Piano /> component but feeds it the song-player's
// press/release callbacks so presses are scored.

"use client";

import { useCallback, useMemo, useState } from "react";
import { Piano } from "@/components/Piano";
import { Visualizer } from "@/components/Visualizer";
import { SongSelector } from "@/components/SongSelector";
import { Scoreboard } from "@/components/Scoreboard";
import { useSongPlayer } from "@/hooks/useSongPlayer";
import { usePianoStore } from "@/lib/store";
import { SONGS, findSongById, songLengthBeats } from "@/lib/songs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PracticeModeToggle } from "@/components/PracticeModeToggle";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function LearningPanel() {
  const [songId, setSongId] = useState<string | null>(null);
  const song = useMemo(() => (songId ? findSongById(songId) ?? null : null), [songId]);

  const player = useSongPlayer(song ?? null);
  const tempo = usePianoStore((s) => s.tempo);
  const setTempo = usePianoStore((s) => s.setTempo);
  const setCurrentSong = usePianoStore((s) => s.setCurrentSong);

  const handleSelect = useCallback(
    (s: typeof SONGS[number]) => {
      setSongId(s.id);
      setCurrentSong(s);
    },
    [setCurrentSong],
  );

  const handleNext = useCallback(() => {
    if (!songId) return;
    const idx = SONGS.findIndex((s) => s.id === songId);
    const next = SONGS[(idx + 1) % SONGS.length];
    if (next) {
      handleSelect(next);
    }
  }, [songId, handleSelect]);

  const handleReplay = useCallback(() => {
    void player.restart();
  }, [player]);

  const handleStartPause = useCallback(() => {
    if (player.isPlaying) {
      void player.pause();
    } else {
      void player.start();
    }
  }, [player]);

  return (
    <section
      aria-label="Learning mode"
      className="mx-auto flex w-full max-w-6xl flex-col gap-4"
    >
      {!song ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-sm font-medium text-foreground">
            Pick a song to start learning
          </p>
          <p className="text-xs text-muted-foreground">
            Falling notes guide you to the right key. Press the highlighted key
            when a note reaches the hit line.
          </p>
        </div>
      ) : null}

      <SongSelector onSelect={handleSelect} selectedId={songId} />

      {song ? (
        <>
          {/* Visualizer */}
          <Visualizer notes={player.visualizer} isPlaying={player.isPlaying} />

          {/* Score + transport */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Scoreboard
                complete={player.complete}
                songId={songId}
                onReplay={handleReplay}
                onNext={handleNext}
              />
            </div>

            {/* Transport + tempo */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleStartPause}
                  className="flex-1"
                  aria-label={player.isPlaying ? "Pause" : "Play"}
                >
                  {player.isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Play
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReplay}
                  aria-label="Restart"
                >
                  <RotateCcw className="h-4 w-4" /> Restart
                </Button>
              </div>

              {/* Tempo slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5" /> Tempo
                  </span>
                  <span className="tabular-nums">{tempo.toFixed(2)}×</span>
                </div>
                <Slider
                  value={[Math.round(tempo * 100)]}
                  onValueChange={(v) => setTempo(v[0] / 100)}
                  min={50}
                  max={150}
                  step={5}
                  aria-label="Tempo"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0.5×</span>
                  <span>1.0×</span>
                  <span>1.5×</span>
                </div>
              </div>

              {/* Practice Mode toggle */}
              <PracticeModeToggle
                isPlaying={player.isPlaying}
                onRestart={handleReplay}
                songLengthBeats={songLengthBeats(song)}
              />

              {/* Song title + back */}
              <div className="mt-1 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{song.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {song.artist} · {song.bpm} BPM
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void player.stop();
                    setSongId(null);
                  }}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Songs
                </Button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={Math.round(player.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-150",
              )}
              style={{ width: `${Math.round(player.progress * 100)}%` }}
            />
          </div>
        </>
      ) : null}

      {/* Always render the Piano so the user can play along even before
          pressing Play. Pass the player's onNotePress so presses are scored. */}
      <Piano
        onNotePress={song ? player.onNotePress : undefined}
        onNoteRelease={song ? player.onNoteRelease : undefined}
      />
    </section>
  );
}
