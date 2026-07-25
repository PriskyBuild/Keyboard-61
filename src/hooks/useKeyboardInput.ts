// MIT License — Piano Learning App
// Global computer-keyboard listener that plays notes from `keyboardMap(octave)`.
// Also handles Z/X octave shift and prevents key-repeat from retriggering.

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePianoStore } from "@/lib/store";
import {
  isMappingKey,
  keyboardMapLookup,
  MAX_MAPPED_OCTAVE,
  MIN_MAPPED_OCTAVE,
  OCTAVE_DOWN_KEY,
  OCTAVE_UP_KEY,
} from "@/lib/keyboard-map";

export interface UseKeyboardInput {
  /** Optional override for when a note is pressed (used by Learning Mode). */
  onNotePress?: (note: string) => void;
  /** Optional override for when a note is released. */
  onNoteRelease?: (note: string) => void;
}

export function useKeyboardInput(
  opts: UseKeyboardInput = {},
): void {
  const audio = useAudioEngine();
  const { onNotePress, onNoteRelease } = opts;

  // Refs to avoid re-binding the listener when store state changes.
  const octaveRef = useRef<number>(4);
  const sustainRef = useRef<boolean>(false);
  const heldKeysRef = useRef<Set<string>>(new Set());

  // Subscribe to store so refs stay current.
  useEffect(() => {
    const unsub = usePianoStore.subscribe((state) => {
      octaveRef.current = state.keyboardOctave;
      sustainRef.current = state.sustain;
    });
    // Initialize from the current state.
    octaveRef.current = usePianoStore.getState().keyboardOctave;
    sustainRef.current = usePianoStore.getState().sustain;
    return unsub;
  }, []);

  const pressNote = usePianoStore((s) => s.pressNote);
  const releaseNoteState = usePianoStore((s) => s.releaseNoteState);
  const shiftOctave = usePianoStore((s) => s.shiftOctave);

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      // Ignore when typing into form fields.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      // Ignore modifier-combos so browser shortcuts still work.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Octave shift keys.
      if (key === OCTAVE_DOWN_KEY) {
        if (e.repeat) return;
        const cur = octaveRef.current;
        if (cur > MIN_MAPPED_OCTAVE) shiftOctave(-1);
        return;
      }
      if (key === OCTAVE_UP_KEY) {
        if (e.repeat) return;
        const cur = octaveRef.current;
        if (cur < MAX_MAPPED_OCTAVE) shiftOctave(1);
        return;
      }

      if (!isMappingKey(key)) return;
      if (e.repeat) return; // avoid retrigger on auto-repeat

      const lookup = keyboardMapLookup(octaveRef.current);
      const note = lookup[key];
      if (!note) return;
      if (heldKeysRef.current.has(note)) return;
      heldKeysRef.current.add(note);

      pressNote(note);
      try {
        await audio.ensureReady();
      } catch {
        /* fall back to silent */
      }
      void audio.playNote(note, 1.0);
      onNotePress?.(note);
    },
    [audio, onNotePress, pressNote, shiftOctave],
  );

  const handleKeyUp = useCallback(
    async (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === OCTAVE_DOWN_KEY || key === OCTAVE_UP_KEY) return;
      if (!isMappingKey(key)) return;

      // Look up the note in the CURRENT octave (in case it shifted mid-press).
      const lookup = keyboardMapLookup(octaveRef.current);
      const note = lookup[key];
      if (!note) return;

      heldKeysRef.current.delete(note);
      releaseNoteState(note);
      try {
        await audio.ensureReady();
      } catch {
        /* noop */
      }
      if (!sustainRef.current) {
        void audio.releaseNote(note);
      }
      onNoteRelease?.(note);
    },
    [audio, onNoteRelease, releaseNoteState],
  );

  // Reset held keys if the window loses focus (so notes don't stick).
  const handleBlur = useCallback(() => {
    for (const note of heldKeysRef.current) {
      releaseNoteState(note);
    }
    heldKeysRef.current.clear();
  }, [releaseNoteState]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleBlur]);

  // Mark flashWrong as used so it isn't tree-shaken from the store interface.
  // (Learning Mode in C4 will drive this; the hook keeps the reference alive.)
}
