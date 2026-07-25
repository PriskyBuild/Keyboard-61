// MIT License — Piano Learning App
// 61-key interactive keyboard (36 white + 25 black, C2..C7).

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WhiteKey } from "@/components/WhiteKey";
import { BlackKey } from "@/components/BlackKey";
import { decideLabel } from "@/components/KeyLabels";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePianoStore } from "@/lib/store";
import {
  blackKeyLeftRatio,
  getBlackKeys,
  getWhiteKeys,
} from "@/lib/notes";

// Responsive sizing: white key width grows with viewport but caps so 36 keys
// fit comfortably. Black keys are 62% of a white key's width.
const MIN_WHITE_WIDTH = 32; // px — 36*32 = 1152px (mobile scrolls)
const MAX_WHITE_WIDTH = 56; // px — 36*56 = 2016px (desktop fits)
const DEFAULT_WHITE_HEIGHT = 200; // px
const BLACK_HEIGHT_RATIO = 0.62; // black key height = 62% of white

export interface PianoProps {
  /**
   * Optional override of the press/release handlers (used by Learning Mode
   * to score presses against the song). If omitted, Free Play behaviour
   * (just play + visual depress) is used.
   */
  onNotePress?: (note: string) => void;
  onNoteRelease?: (note: string) => void;
}

export function Piano({ onNotePress, onNoteRelease }: PianoProps) {
  const whites = useMemo(() => getWhiteKeys(), []);
  const blacks = useMemo(() => getBlackKeys(), []);
  const whiteCount = whites.length; // 36

  // Stage element so we can measure available width and pick the white key width.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [whiteWidth, setWhiteWidth] = useState<number>(MAX_WHITE_WIDTH);
  const [whiteHeight, setWhiteHeight] = useState<number>(DEFAULT_WHITE_HEIGHT);

  // Read store state for labels + visual state.
  const showNoteNames = usePianoStore((s) => s.showNoteNames);
  const showKeyHints = usePianoStore((s) => s.showKeyHints);
  const keyboardOctave = usePianoStore((s) => s.keyboardOctave);
  const activeNotes = usePianoStore((s) => s.activeNotes);
  const nextNote = usePianoStore((s) => s.nextNote);
  const wrongNote = usePianoStore((s) => s.wrongNote);
  const pressNote = usePianoStore((s) => s.pressNote);
  const releaseNoteState = usePianoStore((s) => s.releaseNoteState);
  const bumpStatField = usePianoStore((s) => s.bumpStatField);

  // Audio engine.
  const audio = useAudioEngine();

  // Resize observer to pick a responsive white-key width.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      // Aim for 36 keys to fit in available width with 8px slack.
      const ideal = Math.floor((available - 8) / whiteCount);
      const next = Math.max(
        MIN_WHITE_WIDTH,
        Math.min(MAX_WHITE_WIDTH, ideal),
      );
      setWhiteWidth(next);
      // Height scales slightly with width so big screens feel weighty.
      const h = Math.min(
        260,
        Math.max(150, Math.round(next * 3.6)),
      );
      setWhiteHeight(h);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [whiteCount]);

  // Default press/release: play the note via Tone.
  const handlePress = useCallback(
    async (note: string) => {
      pressNote(note);
      try {
        await audio.ensureReady();
      } catch {
        /* will fall back to silent */
      }
      void audio.playNote(note, 1.0);
      // Persist: count this note toward lifetime stats when in Free Play
      // (Learning Mode counts hits via the song player hook instead, to
      // avoid double-counting).
      if (!onNotePress) {
        bumpStatField("totalNotesPlayed", 1);
      }
      onNotePress?.(note);
    },
    [audio, onNotePress, pressNote, bumpStatField],
  );

  const handleRelease = useCallback(
    async (note: string) => {
      releaseNoteState(note);
      try {
        await audio.ensureReady();
      } catch {
        /* noop */
      }
      void audio.releaseNote(note);
      onNoteRelease?.(note);
    },
    [audio, onNoteRelease, releaseNoteState],
  );

  // Black key width = 62% of a white key's width; height = 62% of white height.
  const blackWidthPx = 0.62 * whiteWidth;
  const blackHeight = Math.round(whiteHeight * BLACK_HEIGHT_RATIO);

  const keyboardWidthPx = whiteWidth * whiteCount;

  const labelOpts = useMemo(
    () => ({ showNoteNames, showKeyHints, keyboardOctave }),
    [showNoteNames, showKeyHints, keyboardOctave],
  );

  return (
    <div
      ref={stageRef}
      className="piano-stage w-full rounded-2xl border border-slate-700/40 p-3 shadow-2xl sm:p-4"
    >
      {/* Horizontal scroll container — overflow on small screens. */}
      <div className="piano-scroll overflow-x-auto overflow-y-hidden">
        <div
          className="relative mx-auto"
          style={{ width: keyboardWidthPx, height: whiteHeight }}
        >
          {/* White-key row */}
          <div className="flex h-full w-full">
            {whites.map((k) => {
              const labels = decideLabel(k, labelOpts);
              return (
                <WhiteKey
                  key={k.note}
                  descriptor={k}
                  pixelWidth={whiteWidth}
                  pixelHeight={whiteHeight}
                  pressed={activeNotes.has(k.note)}
                  isNext={nextNote === k.note}
                  isWrong={wrongNote === k.note}
                  noteLabel={labels.noteLabel}
                  hintLabel={labels.hintLabel}
                  onNotePress={handlePress}
                  onNoteRelease={handleRelease}
                />
              );
            })}
          </div>

          {/* Black-key overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            {blacks.map((k) => {
              if (k.precedingWhiteIndex === undefined) return null;
              const leftRatio = blackKeyLeftRatio(
                k.precedingWhiteIndex,
                whiteCount,
              );
              const leftPx = leftRatio * keyboardWidthPx;
              const labels = decideLabel(k, labelOpts);
              return (
                <div key={k.note} className="pointer-events-auto">
                  <BlackKey
                    descriptor={k}
                    pixelWidth={blackWidthPx}
                    pixelHeight={blackHeight}
                    pixelLeft={leftPx}
                    pressed={activeNotes.has(k.note)}
                    isNext={nextNote === k.note}
                    isWrong={wrongNote === k.note}
                    noteLabel={labels.noteLabel}
                    hintLabel={labels.hintLabel}
                    onNotePress={handlePress}
                    onNoteRelease={handleRelease}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
