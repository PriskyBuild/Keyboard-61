# Phase 2 — Microphone Listening Mode + Kids Curriculum + Parent Dashboard

> Add a kid-friendly microphone listening mode so a 6-7 year old can play along on
> their real piano and get instant feedback, plus a 12-lesson beginner curriculum,
> gamified rewards (stickers + coins), and a PIN-locked parent dashboard. Everything
> stays client-side; no new backend.

## Existing Tech Stack (Do not change)

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | Tailwind CSS v4 + shadcn/ui (New York) |
| Audio | Tone.js v15 (Sampler + PolySynth fallback) |
| State | Zustand |
| Persistence | localStorage (piano-app:v1 + piano-app:stats:v1) |
| Charts | recharts (already installed) |
| Confetti | canvas-confetti (installed this round) |

## Existing Architecture Inventory

```
src/
├── app/
│   ├── layout.tsx          # ThemeProvider + Geist fonts + Toaster
│   ├── page.tsx            # Renders <AppShell />
│   ├── globals.css         # Tailwind v4 + theme vars + piano styling
│   ├── api/health/route.ts # Health probe
│   └── api/route.ts        # Root API stub
├── components/
│   ├── AppShell.tsx        # Header + ModeToggle + Piano/LearningPanel + Controls + Footer
│   ├── Piano.tsx           # 61-key interactive keyboard (C2..C7)
│   ├── Key.tsx             # Shared <button>-based key (pointer capture, aria-labels)
│   ├── WhiteKey.tsx        # variant="white" wrapper
│   ├── BlackKey.tsx        # variant="black" wrapper (absolutely positioned)
│   ├── KeyLabels.tsx       # decideLabel() helper
│   ├── ModeToggle.tsx     # free|learn pill toggle with sliding indicator
│   ├── Controls.tsx        # Volume / Reverb / Octave shift / Sustain / Note-names / Key-hints
│   ├── LearningPanel.tsx   # Song selector + Visualizer + Scoreboard + transport
│   ├── Visualizer.tsx      # Canvas-based falling-notes for Learning Mode
│   ├── SongSelector.tsx    # Song card grid
│   ├── Scoreboard.tsx      # Score/Accuracy/Streak + complete overlay
│   ├── StatsPanel.tsx      # Sheet drawer with lifetime stats + per-song high scores
│   ├── ThemeToggle.tsx     # Light/Dark/Auto (next-themes)
│   ├── HelpModal.tsx        # Keyboard shortcuts dialog
│   └── ui/                  # Full shadcn/ui kit
├── lib/
│   ├── audio.ts            # Tone.js singleton (Sampler + PolySynth + Reverb + Volume)
│   ├── notes.ts            # C2..C7 generator + parseNote/noteToMidi/noteToFrequency
│   ├── songs.ts            # 9-song library (Twinkle, Ode to Joy, Jingle Bells, etc.)
│   ├── keyboard-map.ts     # Physical-key → note mapping
│   ├── store.ts            # Zustand store (mode, prefs, score, high scores, stats, theme)
│   ├── persistence.ts      # localStorage wrapper (prefs + stats)
│   ├── db.ts               # Prisma client (unused)
│   └── utils.ts            # cn() helper
├── hooks/
│   ├── useAudioEngine.ts   # React adapter for audio.ts (useMemo'd return)
│   ├── useKeyboardInput.ts # Global keydown/keyup → notes
│   ├── useSongPlayer.ts    # Tone.Transport scheduling + scoring + persistence
│   ├── use-mobile.ts       # shadcn hook
│   └── use-toast.ts        # shadcn hook
└── types/index.ts          # NoteName, KeyDescriptor, Song, SongNote, Score, etc.

public/
├── favicon.svg
├── logo.svg
└── robots.txt
```

## Phase 2 — New Modules (extending, not replacing)

### `src/lib/mic/` — Microphone capture + DSP
- `capture.ts`: getUserMedia with echoCancellation/noiseSuppression/autoGainControl OFF, channelCount:1, sampleRate:44100. Permission-denied + non-secure-context handling.
- `yin.ts`: Pure YIN algorithm (difference function → cumulative mean normalized difference → absolute threshold 0.10 → parabolic interpolation). Also bundled into the worklet.
- `note-matcher.ts`: freq → MIDI → note name; ±50 cents tolerance; 80ms debounce; RMS onset detection.
- `audio-worklet-bridge.ts`: Loads `public/worklets/yin-processor.js`, falls back to ScriptProcessorNode if AudioWorklet unavailable.
- `calibration.ts`: First-run "play middle C three times" flow, sets noise floor at 2× ambient.

### `public/worklets/yin-processor.js` — AudioWorklet
- Extends `AudioWorkletProcessor`.
- Accumulates 2048 samples from `inputs[0][0]`, runs YIN, posts `{ freq, confidence, rms }`.

### `src/lib/curriculum.ts` — 12-lesson beginner path
- Each lesson: `{ id, title, focus, song, targetNotes, fingerHints, passAccuracy: 0.7, estMinutes ≤ 5 }`.
- Lessons unlock sequentially.

### `src/lib/storage.ts` — Phase-2 persistence (multi-profile)
- New versioned schema under `piano-app:phase2:v1`:
  - `profiles: KidProfile[]` (up to 4)
  - `activeProfileId: string | null`
  - `parentPinHash: string | null` (SHA-256 via crypto.subtle)
  - `settings: ParentSettings` (tolerance, octave-forgiveness, time limit)
  - `progress: Record<profileId, ProfileProgress>` (lessons completed, accuracy, minutes)
  - `stickers: Record<profileId, string[]>` (earned sticker ids)
  - `coins: Record<profileId, number>`
  - `streaks: Record<profileId, StreakData>` (7-day calendar with 1-day grace)
- Migrates `piano-app:v1` (phase 1 prefs + stats) into the active profile gracefully.

### `src/lib/rewards.ts` — Sticker catalog + coin economy
- 30+ sticker definitions: `{ id, name, emoji, theme, rarity }`.
- Earn logic: 1 sticker per lesson completion.

### `src/lib/streaks.ts` — Streak calendar helpers
- `markDayComplete()`, `getCurrentStreak()`, `getStreakCalendar()`.
- 1-day grace: missing one day keeps streak alive but caps bonus.

### New hooks
- `useMicListener.ts`: Wraps mic capture + worklet bridge, exposes `{ start, stop, detectedNote, confidence, listening }`.
- `useLessonEngine.ts`: Drives a single lesson's flow (intro → warm-up → guided → recital → sticker).
- `useParentPin.ts`: PIN entry + verify + set + change.

### New routes
```
src/app/
├── listen/page.tsx         # Mic Listening Mode (kid-friendly UI)
├── curriculum/page.tsx     # 12-lesson path
├── parent/page.tsx         # PIN-locked parent dashboard
├── stickers/page.tsx       # Sticker album + shop
└── help/microphone/page.tsx # Static help explaining mic privacy
```

### New components
```
src/components/
├── listen/
│   ├── ListenPiano.tsx          # Reference-only 61-key display (keys light up, not clickable)
│   ├── FallingNotesKid.tsx      # Large colorful slow falling notes (BPM 60)
│   ├── Mascot.tsx               # SVG/animated mascot (bear/cat/penguin) with states
│   ├── FeedbackOverlay.tsx      # Green burst / yellow wiggle / silence
│   ├── HandPositionDiagram.tsx  # Visual finger hints
│   └── CelebrationScreen.tsx    # Confetti + sticker reveal
├── curriculum/
│   ├── LessonPath.tsx           # 12-step visual path with lock state
│   ├── LessonCard.tsx            # Single lesson tile
│   └── FingerHint.tsx            # Numbered finger indicator
├── parent/
│   ├── PinGate.tsx               # 4-digit PIN entry + setup
│   ├── ProfileSwitcher.tsx       # Up to 4 kid profiles
│   ├── ProgressChart.tsx         # recharts per-child chart
│   └── SettingsPanel.tsx         # Tolerance, time limit, octave-forgiveness
├── rewards/
│   ├── StickerAlbum.tsx          # Grid of earned + locked stickers
│   ├── CoinCounter.tsx           # Animated coin balance
│   └── StreakCalendar.tsx        # 7-day visual streak
└── onboarding/
    ├── MicPermissionModal.tsx    # Friendly modal explaining why mic is needed
    └── CalibrationFlow.tsx       # 3× middle C capture
```

### Public assets
```
public/
├── worklets/yin-processor.js
└── stickers/*.svg  (30+ sticker SVGs)
```

## Architecture Decisions

### D1 — Tone.js engine is untouched
The existing `src/lib/audio.ts` singleton stays as the playback engine. The mic DSP uses a SEPARATE `AudioContext` (a new one we create in `capture.ts`) to avoid contaminating Tone's audio graph with feedback loops. We never connect the mic stream to `audioContext.destination` — no feedback howl.

### D2 — AudioWorklet lives in `public/`
Next.js serves `public/` at the root, so `public/worklets/yin-processor.js` is fetchable at `/worklets/yin-processor.js`. The worklet is plain JS (not TypeScript) because AudioWorklet processors run in a separate global scope with no module imports beyond what the spec allows. The `yin.ts` algorithm is duplicated as a string inside the worklet file (NOT imported) to satisfy the AudioWorkletGlobalScope constraint.

### D3 — YIN inside the worklet
YIN at 2048 samples @ 44.1kHz has ~46ms latency — perfect for kid feedback (perceptual threshold is ~50ms). The worklet posts a result every 2048-sample block. The React side debounces by 80ms (≈2 blocks) to suppress glitches.

### D4 — PIN security
PINs are 4-digit. Hashed with SHA-256 via `crypto.subtle.digest("SHA-256", pin)` before storing. This is NOT cryptographic security (4-digit PINs are brute-forceable in 10k tries), but it prevents casual shoulder-surfing of the stored value. We add a 1-second delay between PIN attempts to slow brute force.

### D5 — Multi-profile localStorage
All Phase-2 data is keyed by `profileId`. The active profile id lives in the same localStorage object. Switching profiles is a single key update.

### D6 — Mascot
Single SVG mascot (a friendly bear) with 4 states: idle, listening, happy, encourage. CSS-only animations — no Lottie, no external libs. Bear chosen because it's the most universally liked animal for the 6-7 age range.

### D7 — Never punitive
Wrong notes get a soft yellow wiggle (NEVER red). Mascot says "try again!" with a friendly expression. No score deduction. Unlimited retries. Silence is just silence — no timeout pressure.

### D8 — Session timer
Parent-configurable cap (default 15 min). When reached, mascot says "time to rest!" and the Listen Mode button is replaced with a "Come back tomorrow!" screen. The cap is per-day per-profile, persisted.

### D9 — Privacy
- Mic is stopped on `visibilitychange` (tab blur).
- No recording, no upload. Audio is processed in-memory only.
- A persistent "🎤 Listening" badge appears when the mic is active.
- The permission modal explains all this BEFORE calling getUserMedia.

### D10 — Routing
Phase 2 adds 5 new routes. The home page (`/`) keeps the existing Free Play + Learning Mode shell. A new nav bar (in the header) lets users jump to `/listen`, `/curriculum`, `/stickers`, `/parent`. Help is at `/help/microphone`.

## Checkpoint Plan

### P2-C0 — Plan & inventory
This document. Commit: `docs(phase2): plan`.

### P2-C1 — Mic capture + AudioWorklet
- `src/lib/mic/capture.ts`: getUserMedia with DSP filters OFF.
- `public/worklets/yin-processor.js`: AudioWorklet skeleton, posts raw Float32 frames.
- `src/lib/mic/audio-worklet-bridge.ts`: load worklet, fallback to ScriptProcessorNode.
- Manual test: open `/listen`, see console logs of Float32 frame lengths.
- Commit: `feat(phase2): mic capture worklet`.

### P2-C2 — YIN pitch detection
- `src/lib/mic/yin.ts`: pure YIN algorithm (also inlined into the worklet).
- Worklet posts `{ freq, confidence, rms }`.
- `src/hooks/useMicListener.ts`: subscribes to worklet messages.
- Manual test: play middle C on real piano → logs ~261.6 Hz.
- Commit: `feat(phase2): yin pitch detector`.

### P2-C3 — Note matcher + tolerance
- `src/lib/mic/note-matcher.ts`: freq → MIDI → note name, ±50 cents, 80ms debounce, RMS onset.
- `useMicListener` exposes `detectedNote: string | null` and `confidence: number`.
- Commit: `feat(phase2): note matcher`.

### P2-C4 — Listen Mode UI
- `src/app/listen/page.tsx` + `ListenPiano` + `FallingNotesKid` + `Mascot` + `FeedbackOverlay`.
- Reference-only 61-key display, large colorful slow notes, mascot states, green/yellow feedback.
- Tone.js audio cues: arpeggio on correct, chime on wrong, fanfare on complete.
- Commit: `feat(phase2): listen mode ui`.

### P2-C5 — Kids curriculum
- `src/lib/curriculum.ts`: 12 lessons with finger hints.
- `src/app/curriculum/page.tsx` + `LessonPath` + `LessonCard` + `FingerHint`.
- Lessons unlock sequentially; pass at 70% accuracy.
- Commit: `feat(phase2): kids curriculum`.

### P2-C6 — Gamification & rewards
- `src/lib/rewards.ts`: 30+ sticker catalog.
- `src/lib/streaks.ts`: 7-day streak with 1-day grace.
- `src/app/stickers/page.tsx` + `StickerAlbum` + `CoinCounter` + `StreakCalendar` + `CelebrationScreen`.
- Confetti via canvas-confetti on lesson complete.
- Commit: `feat(phase2): rewards`.

### P2-C7 — Parent dashboard
- `src/app/parent/page.tsx` + `PinGate` + `ProfileSwitcher` + `ProgressChart` + `SettingsPanel`.
- 4-digit PIN (SHA-256), up to 4 profiles, recharts progress, export/import JSON.
- Commit: `feat(phase2): parent dashboard`.

### P2-C8 — Persistence & polish
- `src/lib/storage.ts`: versioned schema, migrate phase-1 data.
- `src/components/onboarding/MicPermissionModal.tsx` + `CalibrationFlow.tsx`.
- First-run calibration: "Play middle C three times."
- `bun run build` green.
- Commit: `feat(phase2): persistence + docs`.

### P2-C9 — Deploy ready
- Print git push commands.
- Commit: `chore(phase2): vercel ready`.

## Constraints
- TypeScript strict, zero `any`, zero `@ts-ignore`.
- `bun run build` and `bun run lint` exit 0 before each commit.
- No console errors in the browser.
- Mobile: 64px+ touch targets in kid UI, 24px+ body text, 48px+ note cards.
- All mic access requires HTTPS (Vercel provides this).
- No new backend.
