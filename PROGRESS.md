# Progress Log

## Phase C0 — Scaffold ✅ DONE
- Inspected existing Next.js 16 + React 19 + Tailwind v4 + shadcn/ui project at `/home/z/my-project`.
- Verified dev server is running on port 3000 (`/` returns 200).
- Installed `tone@15.1.22` and `zustand@5.0.14`.
- Wrote `PLAN.md`, `DECISIONS.md`, `PROGRESS.md` (this file), `README.md` (with Vercel deploy section).
- Updated `tsconfig.json`: `noImplicitAny: true`.
- Updated `next.config.ts`: `reactStrictMode: true`, dropped `typescript.ignoreBuildErrors`.
- Renamed package to `piano-learning-app@1.0.0`; added `typecheck` script.
- Wrote `.env.example`, `vercel.json`, `public/favicon.svg`.
- Updated `.gitignore` to allow `.env.example`.
- Updated `src/app/layout.tsx` (piano metadata, theme-color, viewport, favicon.svg).
- Added trivial `src/app/api/health/route.ts` returning `{status:"ok"}`.
- Added piano-specific CSS (key gradients, press/next/wrong states, falling-note keyframes, custom scrollbar) to `src/app/globals.css`.
- Wrote minimal `src/app/page.tsx` + `src/components/AppShell.tsx` placeholder; verified `/` returns 200.

### Next — C1: Audio Core
- `src/lib/notes.ts`: C2..C7 generator + note math.
- `src/lib/audio.ts`: Tone.js singleton with Sampler + PolySynth fallback + play/release/volume/reverb/sustain.
- `src/hooks/useAudioEngine.ts`: React lifecycle wrapper; ensures `Tone.start()` on first user gesture.

## Phase C1 — Audio Core ✅ DONE
- Wrote `src/types/index.ts` (NoteName, KeyDescriptor, Song, SongNote, Score, etc.).
- Wrote `src/lib/notes.ts`: parseNote/formatNote/noteToMidi/midiToNote/noteToFrequency + generateKeyboard() that produces exactly 36 white + 25 black keys for C2..C7 (invariant asserted at runtime). Includes blackKeyLeftRatio/blackKeyWidthRatio helpers for layout.
- Wrote `src/lib/audio.ts`: lazy `import("tone")`, singleton ToneLike typing, Sampler with 30 Salamander samples (C1..C8 + low octave samples), PolySynth fallback wired in immediately, Reverb+Volume graph, sustain set with heldNotes, dispose for HMR.
- Wrote `src/hooks/useAudioEngine.ts`: React adapter exposing state + ensureReady/playNote/releaseNote/setSustain/setVolumeDb/setReverbWet/getTransport/nowSeconds. Lazy-loads audio module via `import("@/lib/audio")` so Tone stays out of SSR.
- Cleaned `next.config.ts` (removed unsupported eslint field) and broadened `tsconfig.json` excludes (examples, skills, tests, mini-services, download, upload).
- Verified: `bun run typecheck` clean, `bun run lint` clean (0 errors / 0 warnings).

### Next — C2: Piano UI
- `src/components/WhiteKey.tsx`, `BlackKey.tsx`, `Key.tsx`.
- `src/components/Piano.tsx`: 61-key container, computed black-key positioning, horizontal scroll on overflow, 44px+ touch targets, accessible `<button>` keys.
- Wire minimal page to render the keyboard and play notes on click.

## Phase C2 — Piano UI ✅ DONE
- Wrote `src/lib/store.ts` (Zustand): mode, Free Play toggles, octave shift, sustain, volume, reverb, currentSong, tempo, isPlaying, score, nextNote, activeNotes (Set), wrongNote + flashWrong auto-clear.
- Wrote `src/lib/keyboard-map.ts`: pure `keyboardMap(octave)` returning the 12 mappings (7 white + 5 black), lookup tables, octave clamp.
- Wrote `src/components/Key.tsx` (shared `<button>`-based key with pointer capture, aria-label, focus ring, depress/next/wrong visual states, label layer).
- Wrote `src/components/WhiteKey.tsx` + `BlackKey.tsx` (thin wrappers around `Key`).
- Wrote `src/components/KeyLabels.tsx` (pure `decideLabel` helper).
- Wrote `src/components/Piano.tsx`: generates 36 white + 25 black keys via `getWhiteKeys()`/`getBlackKeys()`, ResizeObserver picks white-key width within [22,56]px, black keys positioned absolutely via `blackKeyLeftRatio`, horizontally scrollable on overflow.
- Wrote `src/components/ModeToggle.tsx` (Free Play / Learning pill tabs).
- Wrote `src/components/Controls.tsx` (volume, reverb, octave shift, sustain, note-names, key-hints) with sync effects into the audio engine.
- Wrote `src/components/LearningPanel.tsx` placeholder (real implementation in C4).
- Rewrote `src/components/AppShell.tsx` to render header + mode toggle + audio-status badge + Piano + Controls + sticky footer (mt-auto).
- Verified: `/` returns 200; HTML contains `piano-stage`, `piano-key-white`, note `C2`, status badge `Tap a key to enable audio`. typecheck + lint clean.

### Next — C3: Free Play Mode
- `src/hooks/useKeyboardInput.ts`: global keydown/keyup listener using `keyboardMap(octave)`.
- Wire keyboard input into `AppShell`.
- Test that physical-key presses play the right notes and Z/X shift octaves.

## Phase C3 — Free Play Mode ✅ DONE
- Wrote `src/hooks/useKeyboardInput.ts`: global keydown/keyup, ignores form fields + modifier combos, suppresses auto-repeat, handles Z/X octave shift (clamped), uses `keyboardMapLookup(octave)` for current mapping, blur handler releases all held notes so they don't stick on tab-switch.
- Wired `useKeyboardInput()` into `AppShell` (no override — uses default press/release behaviour which plays + visual depress).
- Verified: page returns 200, typecheck + lint clean.
- Note-name toggle, key-hint toggle, sustain toggle, volume slider, reverb slider, octave shift buttons all live in `Controls.tsx` with sync effects into the audio engine.

### Next — C4: Learning Mode
- `src/lib/songs.ts`: 4-song library (Twinkle, Ode to Joy, Jingle Bells, Happy Birthday) with `{id,title,artist,bpm,difficulty,notes:[{note,duration,start}]}`.
- `src/components/SongSelector.tsx`: song cards.
- `src/components/Visualizer.tsx`: canvas-based falling-notes.
- `src/components/Scoreboard.tsx`: score / accuracy / streak / song-complete screen.
- `src/hooks/useSongPlayer.ts`: Tone.Transport scheduling, scoring on correct/wrong press, tempo reschedule.
- Replace `LearningPanel` placeholder with the real layout.

## Phase C4 — Learning Mode ✅ DONE
- Wrote `src/lib/songs.ts`: 4-song library (Twinkle, Ode to Joy, Jingle Bells, Happy Birthday) with `{id,title,artist,bpm,difficulty,description,notes:[{note,duration,start}]}`. Includes `findSongById`, `songLengthBeats`, `beatsToSeconds` helpers.
- Wrote `src/hooks/useSongPlayer.ts`: Tone.Transport scheduling via `transport.scheduleOnce((time) => audio.playNote(note, vel, dur, time), startSec)` for sample-accurate playback. RAF loop advances progress, sets `nextNote` hint, detects missed notes (past HIT_WINDOW_MS = 280ms), marks complete. Tempo multiplier rescales both transport BPM and visualizer timestamps. Scoring: +100 + streak bonus per hit, streak reset on wrong/miss, `total` stays = expected count, accuracy = hits/total.
- Wrote `src/components/Visualizer.tsx`: canvas-based falling notes with DPR-aware sizing, ResizeObserver, color-coded white/black notes, gradient + glow, hit-line at bottom, live clock readout.
- Wrote `src/components/Scoreboard.tsx`: Score / Accuracy / Streak (with best-streak sub) + absolute-positioned song-complete overlay (Replay / Next song).
- Wrote `src/components/SongSelector.tsx`: card grid with difficulty badges, BPM/duration/note-count metadata, selected highlight ring.
- Replaced `LearningPanel` placeholder with full layout: SongSelector + Visualizer + Scoreboard + transport (Play/Pause/Restart) + tempo slider + progress bar + (its own) Piano with the player's scoring callbacks wired in.
- Refactored song player to use `useMemo` for visualizer snapshot (no effect), `useEffect` only for score reset + tempo transport sync, "adjust-state-during-render" pattern for `complete`/`progress` resets on song change (avoids React 19 `set-state-in-effect` lint).
- Fixed `audio.ts` Tone.Transport typing: `scheduleOnce(cb, time)` returns number (matches real Tone API).
- Refactored column lookup to module-level `COLUMN_LOOKUP` constant to avoid reading refs during render.
- Verified: typecheck clean, lint clean, `/` returns 200 with Free Play + Learning toggles rendering.

### Next — C5: Deploy config
- Finalise `vercel.json`, README deploy section.
- Add `next.config.ts` `allowedDevOrigins` for the preview origin (so dev warnings quiet down — purely cosmetic but nice).
- Run final `bun run lint` + `bun run typecheck` green.
- Final self-verification with agent-browser.

## Phase C5 — Deploy config + bug fixes ✅ DONE
- Added `allowedDevOrigins` to `next.config.ts` (silences dev-only cross-origin warnings; Vercel ignores this field).
- Ran final `bun run lint` (clean) + `bun run typecheck` (clean).
- Verified `/api/health` returns `{status:"ok",time:<ms>,service:"piano-learning-app"}`.
- **Fixed two critical bugs found via Agent Browser self-verification**:
  1. **Audio init blocked UI**: previously `initAudio()` awaited the Salamander sample load (up to 12s). Refactored to use the PolySynth fallback immediately and load the Sampler in the background. State listeners (`onAudioStateChange`) let React re-render when the Sampler swap completes. Also fixed the Tone.js v15 Sampler API: use `onload`/`onerror` callbacks (the legacy `loaded` event was removed in v15).
  2. **Song player RAF loop never ran**: every state update caused `useAudioEngine`'s returned object to be a new identity → `clearSchedule` → `stop` callback identity changed → cleanup effect fired on every render → `stop()` killed playback immediately. Fixed by (a) memoising the `useAudioEngine` return value with `useMemo`, and (b) holding `stop` in a `useRef` updated via its own effect so the song-change cleanup effect depends only on `[song, resetScore]`.
- **Self-verification (Agent Browser)**:
  - `/` returns 200, no console errors, no React hydration warnings.
  - Keyboard renders exactly **36 white + 25 black = 61 keys** spanning C2..C7 (verified by counting `button[data-variant='white']` and `button[data-variant='black']`).
  - Clicking C4 plays the correct pitch; audio badge transitions from "Tap a key" → "Synth fallback" → "Piano samples loaded" within ~12s (Salamander samples confirmed via network panel: 200 OK for 30 .mp3 files).
  - **Learning Mode end-to-end**: selected Ode to Joy → pressed Play → Play button switched to Pause → progress bar advanced 0% → 47% → 100% → "Song complete!" overlay shown. Score stayed at 0 because the test browser didn't press keys (all 30 notes missed).
  - **Correct press**: pressed C4 when nextNote was C4 → score +102 (100 + 2 streak bonus), hits=1, streak=1, advanced to next note.
  - **Wrong press**: pressed C5 when nextNote was C4 → score unchanged, hits unchanged, streak reset to 0, next-note hint did NOT advance (correct behaviour).
  - **Visualizer**: confirmed amber/orange pixels (RGB ≈ 248,173,22) drawing on the canvas during playback.
  - **Mobile 375px**: keyboard scrolls horizontally (1152px content in 325px viewport), keys 32px×150px.
  - **Desktop 1280×800**: footer sticks to bottom (totalH=800=viewportH, footer at top:751,bottom:800).
  - **Short viewport 1280×400**: footer pushed down naturally (totalH=586, viewportH=400, scrolls).
  - **Toggles**: Note names → key shows "C4"; Key hints → key shows "A"; Octave up → hint moves from C4 to C5.
  - **Computer keyboard**: dispatching `keydown` for "a" → C5 added to activeNotes; `keyup` → removed.
