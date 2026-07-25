// MIT License — Piano Learning App
// Renders note-name labels and physical-key hint overlays.
// (In this implementation the labels are rendered directly by Key, so this
// module exports pure helpers that other components can use to decide what to
// render on each key.)

import { getKeyboard, parseNote } from "@/lib/notes";
import { noteToPhysKey } from "@/lib/keyboard-map";
import type { KeyDescriptor } from "@/types";

export interface LabelDecision {
  /** Text to show as the note name, or null to hide. */
  noteLabel: string | null;
  /** Physical key letter to show (uppercase), or null to hide. */
  hintLabel: string | null;
}

export interface LabelOptions {
  showNoteNames: boolean;
  showKeyHints: boolean;
  keyboardOctave: number;
}

/** Decide labels for a single key descriptor given current options. */
export function decideLabel(
  descriptor: KeyDescriptor,
  opts: LabelOptions,
): LabelDecision {
  let noteLabel: string | null = null;
  if (opts.showNoteNames) {
    const { letter, accidental, octave } = parseNote(descriptor.note);
    noteLabel = `${letter}${accidental}${octave}`;
  }

  let hintLabel: string | null = null;
  if (opts.showKeyHints) {
    const lookup = noteToPhysKey(opts.keyboardOctave);
    const hint = lookup[descriptor.note];
    hintLabel = hint ?? null;
  }

  return { noteLabel, hintLabel };
}

/** Convenience: build a lookup of note -> hint label for the whole keyboard. */
export function buildHintLookup(octave: number): Record<string, string> {
  return noteToPhysKey(octave);
}

/** Convenience: validate the keyboard table without rendering. */
export function debugKeyboardSummary(): { count: number; first: string; last: string; white: number; black: number } {
  const keys = getKeyboard();
  return {
    count: keys.length,
    first: keys[0]?.note ?? "",
    last: keys[keys.length - 1]?.note ?? "",
    white: keys.filter((k) => !k.isBlack).length,
    black: keys.filter((k) => k.isBlack).length,
  };
}
