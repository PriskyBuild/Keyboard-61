// MIT License — Piano Learning App
// Tone.js audio engine — singleton. Client-only (guarded by typeof window).
//
// Load order:
//   1. The module is imported by `useAudioEngine` via dynamic import with
//      `ssr: false`, so Tone never runs during Next.js SSR.
//   2. `initAudio()` creates a Sampler pointed at the Salamander piano samples
//      (CDN, CORS-enabled) and a PolySynth fallback. Whichever becomes ready
//      first is used; if the Sampler fails, we keep the PolySynth.
//   3. The Sampler's `release` is determined per-note by the caller.
//
// All public functions are idempotent: calling `initAudio()` twice is a no-op
// after the first call. This matters because React 19 strict mode mounts
// effects twice during development.

import type { AudioEngineState } from "@/types";
import { noteToFrequency } from "@/lib/notes";

// We type Tone loosely to avoid pulling Tone's full type surface here.
type ToneLike = {
  start: () => Promise<void>;
  getTransport: () => ToneTransport;
  now: () => number;
  Frequency: (note: string) => { toFrequency: () => number };
  Sampler: new (opts: any) => ToneInstrument;
  PolySynth: new (opts?: any) => ToneInstrument;
  Reverb: new (decay?: number) => ToneEffect & { wet: ToneParam };
  Volume: new (db?: number) => ToneEffect & { volume: ToneParam };
  Destination: ToneEffect;
};

interface ToneParam {
  value: number | string;
  rampTo: (target: number | string, time?: number) => void;
}

interface ToneInstrument {
  connect: (node: any) => ToneInstrument;
  disconnect: () => void;
  triggerAttack: (note: string, time?: number, velocity?: number) => void;
  triggerRelease: (note: string | string[], time?: number) => void;
  triggerAttackRelease: (
    note: string,
    duration: number | string,
    time?: number,
    velocity?: number,
  ) => void;
  releaseAll: (time?: number) => void;
  dispose: () => void;
  loaded: boolean;
  on: (event: string, cb: (...args: any[]) => void) => void;
}

interface ToneEffect {
  connect: (node: any) => ToneEffect;
  dispose: () => void;
  toDestination: () => ToneEffect;
}

interface ToneTransport {
  start: (time?: number) => void;
  stop: (time?: number) => void;
  pause: (time?: number) => void;
  cancel: (time?: number) => void;
  bpm: { value: number };
  seconds: number;
  position: number;
  state: "started" | "stopped" | "paused";
  scheduleOnce: (
    cb: (time: number) => void,
    time: string | number,
  ) => number;
  scheduleRepeat: (
    cb: (time: number) => void,
    interval: string | number,
    startTime?: string | number,
  ) => number;
  clear: (id: number) => void;
}

// ---------------------------------------------------------------------------
// Lazy Tone import + singleton state
// ---------------------------------------------------------------------------

let toneModule: ToneLike | null = null;
let instrument: ToneInstrument | null = null;
let fallbackInstrument: ToneInstrument | null = null;
let reverb: (ToneEffect & { wet: ToneParam }) | null = null;
let volumeNode: (ToneEffect & { volume: ToneParam }) | null = null;

let initPromise: Promise<void> | null = null;
let initStarted = false;
let usingFallback = false;
let sustainActive = false;
/** Notes currently held (sustain ON) so we can release them later. */
const heldNotes = new Set<string>();

const SAMPLES_BASE_URL =
  process.env.NEXT_PUBLIC_PIANO_SAMPLES_BASE_URL ||
  "https://tonejs.github.io/audio/salamander/";

// Salamander sample file names per note (a curated subset is enough; Tone will
// pitch-shift the missing ones). We sample every minor third across the
// keyboard for natural timbre.
const SAMPLE_MAP: Record<string, string> = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "D#1": "Ds1.mp3",
  "F#1": "Fs1.mp3",
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
  C7: "C7.mp3",
  "D#7": "Ds7.mp3",
  "F#7": "Fs7.mp3",
  A7: "A7.mp3",
  C8: "C8.mp3",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns true when the audio context has been initialised at least once. */
export function isAudioInitialised(): boolean {
  return initStarted;
}

/**
 * Initialise the Tone.js audio graph. Idempotent — safe to call multiple times.
 * Must be invoked from a user-gesture handler (e.g. pointerdown) on most
 * browsers, because `Tone.start()` unlocks the AudioContext.
 */
export async function initAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  if (initPromise) return initPromise;
  initStarted = true;
  initPromise = doInit().catch((err) => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

async function loadTone(): Promise<ToneLike> {
  if (toneModule) return toneModule;
  // Dynamic import keeps Tone out of the SSR bundle.
  const mod: any = await import("tone");
  toneModule = mod as ToneLike;
  return toneModule;
}

async function doInit(): Promise<void> {
  const tone = await loadTone();
  await tone.start();

  // Build the audio graph: instrument -> volume -> reverb -> destination
  reverb = new tone.Reverb(2.2);
  reverb.wet.value = 0.18;
  reverb.toDestination();

  volumeNode = new tone.Volume(-6);
  volumeNode.connect(reverb as unknown as ToneEffect);

  // PolySynth fallback — available immediately.
  fallbackInstrument = new tone.PolySynth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 1.2 },
  });
  fallbackInstrument.connect(volumeNode as unknown as ToneEffect);

  // Use the fallback immediately so users can play right away.
  if (!instrument) {
    instrument = fallbackInstrument;
    usingFallback = true;
  }

  // Kick off the real Sampler in the background. When it finishes loading
  // (or fails), we swap it in. initAudio() does NOT wait for this — the
  // fallback is already playable.
  void loadSamplerInBackground(tone).catch(() => {
    /* swallow — fallback already in place */
  });
}

let samplerLoadPromise: Promise<void> | null = null;

/** Lazily load the real Sampler in the background. Swaps `instrument` to
 *  the Sampler on success; leaves the fallback in place on failure. */
function loadSamplerInBackground(tone: ToneLike): Promise<void> {
  if (samplerLoadPromise) return samplerLoadPromise;
  samplerLoadPromise = new Promise<void>((resolve) => {
    const samples: Record<string, string> = {};
    for (const [note, file] of Object.entries(SAMPLE_MAP)) {
      samples[note] = `${SAMPLES_BASE_URL}${file}`;
    }

    // Tone.js v15 API: pass `onload` and `onerror` callbacks to the
    // Sampler constructor. The legacy `loaded` event was removed.
    const SamplerCtor = (tone as unknown as {
      Sampler: new (opts: {
        urls: Record<string, string>;
        release: number;
        onload?: () => void;
        onerror?: (error: Error) => void;
      }) => ToneInstrument;
    }).Sampler;

    const sampler = new SamplerCtor({
      urls: samples,
      release: 1.4,
      onload: () => {
        // Swap in the real sampler; keep the fallback alive so any in-flight
        // releases still resolve.
        instrument = sampler;
        usingFallback = false;
        notifyStateListeners();
        resolve();
      },
      onerror: () => {
        // Keep the fallback. Don't throw — the app is still playable.
        usingFallback = true;
        if (instrument !== fallbackInstrument && fallbackInstrument) {
          instrument = fallbackInstrument;
        }
        notifyStateListeners();
        resolve();
      },
    });
    sampler.connect(volumeNode as unknown as ToneEffect);

    // Safety net: if neither onload nor onerror fires within 20s, settle the
    // promise so the engine doesn't stay "loading" forever.
    window.setTimeout(() => {
      resolve();
    }, 20_000);
  });
  return samplerLoadPromise;
}

// ---------------------------------------------------------------------------
// State-listener mechanism so React can re-render when the Sampler swap happens.
// ---------------------------------------------------------------------------
type StateListener = (state: AudioEngineState) => void;
const stateListeners = new Set<StateListener>();

export function onAudioStateChange(listener: StateListener): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

function notifyStateListeners(): void {
  const state = getAudioState();
  for (const l of stateListeners) {
    try {
      l(state);
    } catch {
      /* ignore */
    }
  }
}

/** Snapshot of engine state for React. */
export function getAudioState(): AudioEngineState {
  return {
    ready: Boolean(instrument),
    usingFallback,
    error: null,
  };
}

/**
 * Trigger a note attack. Returns immediately if audio isn't ready yet.
 * @param note    e.g. "C4"
 * @param velocity 0..1
 * @param duration Optional; if provided, also schedules the release.
 * @param time    Optional audio-context time (seconds) at which to fire.
 *                Used by Learning Mode for sample-accurate scheduling.
 */
export function playNote(
  note: string,
  velocity = 0.8,
  duration?: number,
  time?: number,
): void {
  if (!instrument) return;
  if (sustainActive) {
    heldNotes.add(note);
  }
  if (duration !== undefined) {
    instrument.triggerAttackRelease(note, duration, time, velocity);
  } else {
    instrument.triggerAttack(note, time, velocity);
  }
}

/** Release a previously-attacked note (unless sustain is on). */
export function releaseNote(note: string): void {
  if (!instrument) return;
  if (sustainActive) {
    // Hold until sustain is released.
    heldNotes.add(note);
    return;
  }
  try {
    instrument.triggerRelease(note);
  } catch {
    /* ignore */
  }
}

/** Release every currently-held note. */
export function releaseAllNotes(): void {
  if (!instrument) return;
  instrument.releaseAll();
  heldNotes.clear();
}

/**
 * Toggle sustain pedal. When ON, notes keep ringing until turned OFF
 * (then releaseAll is called).
 */
export function setSustain(on: boolean): void {
  sustainActive = on;
  if (!on) {
    releaseAllNotes();
  }
}

/** Master volume in dB (typically -40..0). */
export function setVolumeDb(db: number): void {
  if (!volumeNode) return;
  volumeNode.volume.rampTo(db, 0.05);
}

/**
 * Master reverb wet mix, 0..1.
 */
export function setReverbWet(wet: number): void {
  if (!reverb) return;
  reverb.wet.rampTo(Math.max(0, Math.min(1, wet)), 0.05);
}

/** Expose the Tone transport (used by the song player hook). */
export function getTransport(): ToneTransport {
  if (!toneModule) {
    throw new Error("Audio engine not initialised — call initAudio() first.");
  }
  return toneModule.getTransport();
}

/** Current audio time in seconds (for synchronising the visualiser). */
export function nowSeconds(): number {
  if (!toneModule) return 0;
  return toneModule.now();
}

/** Convert a note name to a frequency (independent of Tone). */
export function noteFrequency(note: string): number {
  return noteToFrequency(note);
}

/**
 * Dispose of all audio nodes. Mainly useful for HMR / tests.
 */
export function disposeAudio(): void {
  instrument?.dispose();
  if (fallbackInstrument && fallbackInstrument !== instrument) {
    fallbackInstrument.dispose();
  }
  reverb?.dispose();
  volumeNode?.dispose();
  instrument = null;
  fallbackInstrument = null;
  reverb = null;
  volumeNode = null;
  toneModule = null;
  initPromise = null;
  initStarted = false;
  usingFallback = false;
  sustainActive = false;
  heldNotes.clear();
  samplerLoadPromise = null;
}
