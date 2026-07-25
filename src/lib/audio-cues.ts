// MIT License — Piano Learning App (Phase 2)
// Audio cues for Listen Mode — cheerful arpeggio on correct, gentle chime on
// wrong, fanfare on complete. Uses the existing Tone.js engine (audio.ts).
//
// These are SHORT positive cues only — never harsh, never punitive.

import { initAudio, playNote } from "@/lib/audio";

/** Cheerful ascending arpeggio on a correct note. */
export async function playCorrectCue(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await initAudio();
    // C major arpeggio: C4 → E4 → G4 → C5
    const notes = ["C4", "E4", "G4", "C5"];
    notes.forEach((n, i) => {
      // Stagger 80ms apart so the arpeggio is heard, not a chord.
      window.setTimeout(() => {
        playNote(n, 0.6, 0.18);
      }, i * 80);
    });
  } catch {
    /* audio engine not ready — silent */
  }
}

/** Gentle chime on wrong — soft and warm, NOT harsh. */
export async function playWrongCue(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await initAudio();
    // Soft two-note "try again" — A3 + E4 (perfect fifth, no dissonance).
    playNote("A3", 0.5, 0.4);
    window.setTimeout(() => playNote("E4", 0.4, 0.35), 100);
  } catch {
    /* silent */
  }
}

/** Triumphant fanfare on lesson complete. */
export async function playFanfareCue(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await initAudio();
    // C major fanfare: C4 → C4 → G4 → C5 (held)
    const seq: Array<{ note: string; t: number; d: number }> = [
      { note: "C4", t: 0, d: 0.18 },
      { note: "C4", t: 120, d: 0.18 },
      { note: "G4", t: 240, d: 0.18 },
      { note: "C5", t: 360, d: 0.5 },
      { note: "E5", t: 480, d: 0.6 },
      { note: "G5", t: 600, d: 0.8 },
    ];
    for (const ev of seq) {
      window.setTimeout(() => playNote(ev.note, 0.6, ev.d), ev.t);
    }
  } catch {
    /* silent */
  }
}

/** Soft "click" cue when a note is highlighted (optional, for focus). */
export async function playHighlightCue(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await initAudio();
    playNote("C5", 0.4, 0.08);
  } catch {
    /* silent */
  }
}
