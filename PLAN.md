# Piano Learning App — Build Plan

> Autonomous build plan for a client-side Next.js piano learning app.
> Adapted to the existing Next.js 16 + React 19 + Tailwind v4 + shadcn/ui project at `/home/z/my-project`.

## Stack (locked)
- Next.js 16 App Router, React 19, TypeScript (strict)
- Tailwind CSS v4 (CSS-based config in `globals.css`) + shadcn/ui (New York)
- `tone` v15 for audio (Sampler → PolySynth fallback)
- `zustand` v5 for cross-component state (mode, song, score)
- `lucide-react` icons (already installed)
- Fully client-side — no DB, no auth — deploys to Vercel with zero env vars.

## Adapted File Tree
The user spec used `piano-app/` with `app/`, `components/`, `lib/`, `hooks/`, `types/`. The existing repo uses `src/`, so we map:

```
src/
├── app/
│   ├── layout.tsx              # metadata + fonts + Toaster
│   ├── page.tsx                # the only user-visible route (/)
│   ├── globals.css             # tailwind v4 + theme vars + piano styling
│   └── api/
│       └── health/
│           └── route.ts        # GET -> { status:"ok" }
├── components/
│   ├── Piano.tsx               # 61-key container, computes layout, wires audio
│   ├── Key.tsx                 # generic key wrapper (shared pointer logic)
│   ├── WhiteKey.tsx
│   ├── BlackKey.tsx
│   ├── KeyLabels.tsx           # note-name + physical-key overlay
│   ├── Visualizer.tsx          # falling-notes canvas
│   ├── SongSelector.tsx        # cards for song library
│   ├── ModeToggle.tsx          # Free Play / Learning switch
│   ├── Controls.tsx            # volume, sustain, reverb, tempo
│   ├── Scoreboard.tsx          # score / accuracy / streak
│   └── ui/                     # existing shadcn components
├── lib/
│   ├── audio.ts                # Tone.js init + Sampler + play helpers
│   ├── notes.ts                # C2–C7 generator, note math
│   ├── keyboard-map.ts         # physical key -> note + octave shift
│   ├── songs.ts               # song library + types
│   ├── store.ts               # zustand store
│   ├── db.ts                   # existing (unused, kept)
│   └── utils.ts                # existing cn() helper
├── hooks/
│   ├── useAudioEngine.ts       # wraps audio.ts in React lifecycle
│   ├── useKeyboardInput.ts     # physical keyboard -> play + octave shift
│   └── useSongPlayer.ts       # song scheduling, scoring, visualizer events
└── types/
    └── index.ts                # Note, Song, KeyDescriptor, etc.
```

Root artifacts:
```
PLAN.md, PROGRESS.md, DECISIONS.md, README.md
.gitignore, .env.example, next.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.mjs
public/favicon.svg
vercel.json
```

## Phase / Task Breakdown

### C0 — Scaffold (estimated 6 files)
1. Update `tsconfig.json` -> strict, noImplicitAny true.
2. Update `next.config.ts` -> reactStrictMode true, remove ignoreBuildErrors.
3. Update `tailwind.config.ts` content paths (harmless in v4 but explicit).
4. Write `.env.example`, `vercel.json`, `public/favicon.svg`.
5. Write `README.md` (with deploy section).
6. Write `PROGRESS.md`, `DECISIONS.md` (this file).
7. Verify `bun run dev` boots and `/` returns 200.

### C1 — Audio Core (estimated 3 files)
1. `src/lib/notes.ts` — note name math, frequency via `Tone.Frequency`, C2..C7 generator.
2. `src/lib/audio.ts` — Tone singleton, Sampler with Salamander piano samples + PolySynth fallback, `playNote`, `releaseNote`, `releaseAll`, `setVolume`, `setReverb`, `setSustain`.
3. `src/hooks/useAudioEngine.ts` — React lifecycle wrapper, ensures Tone.start() on first user gesture.

Commit: `feat(audio): tone.js sampler init`

### C2 — Piano UI (estimated 7 files)
1. `src/types/index.ts` — Note, KeyDescriptor, Song, Score types.
2. `src/lib/notes.ts` — finish (if not in C1).
3. `src/components/WhiteKey.tsx`, `BlackKey.tsx`, `Key.tsx` — accessible `<button>`s with pointer/touch handlers, aria-labels, focus ring, depress visual.
4. `src/components/Piano.tsx` — generates 36 white + 25 black keys (C2..C7), positions black keys programmatically, horizontally scrolls on overflow, wires `onPress(note)`.
5. `src/app/page.tsx` — minimal: header + `<Piano />`, mode toggle disabled for now.
6. `src/components/ModeToggle.tsx` — placeholder wiring.

Commit: `feat(piano): 61-key interactive keyboard`

### C3 — Free Play Mode (estimated 4 files)
1. `src/lib/keyboard-map.ts` — `a s d f g h j` → C–B white; `w e t y u` → C#–A#; `z/x` shift octave; expose `keyboardMap(octave)` and `octaveShiftKey`.
2. `src/hooks/useKeyboardInput.ts` — global keydown/keyup listener, plays notes, handles octave shift.
3. `src/components/KeyLabels.tsx` — toggles for note names + physical key hints.
4. `src/components/Controls.tsx` — volume slider, sustain switch, reverb knob (Free Play only).
5. `src/lib/store.ts` — minimal: `mode`, `showNoteNames`, `showKeyHints`, `sustain`, `volume`, `reverb`, `octave`.

Commit: `feat(mode): free play`

### C4 — Learning Mode (estimated 5 files)
1. `src/lib/songs.ts` — 4 songs: Twinkle, Ode to Joy, Jingle Bells, Happy Birthday with `{id,title,artist,bpm,difficulty,notes:[{note,duration,start}]}`.
2. `src/components/SongSelector.tsx` — card grid, calls `playSong`.
3. `src/components/Visualizer.tsx` — falling-notes (requestAnimationFrame + absolute-positioned divs OR canvas); hit-line at key row; tempo-aware.
4. `src/components/Scoreboard.tsx` — score, accuracy %, streak; song-complete screen with replay/next.
5. `src/hooks/useSongPlayer.ts` — schedule notes via `Tone.Transport`/`Tone.Part`, advance on correct press, flash red on wrong press, emit visualizer events.
6. `src/app/page.tsx` — wire Free Play vs Learning layout (full screen, sticky footer).

Commit: `feat(mode): learning mode + songs`

### C5 — Deploy Config (estimated 3 files)
1. `vercel.json` — minimal (framework: nextjs); zero env.
2. `README.md` — final deploy section with one-click button + Git-import steps.
3. Run `bun run lint` and `bun run build` (note: per project rules, we use `bun run lint` only; build is disabled in this sandbox — `next.config.ts` is `output: standalone` so build still works for Vercel).
4. Fix any errors until green.

Commit: `chore: vercel + docs`

### C6 — Git Push Instructions
1. Print exact git commands.
2. Final self-verification with Agent Browser (open `/`, click keys, run Ode to Joy end-to-end, verify responsive at 375px, verify footer sticky).
3. Update PROGRESS.md final status.

## Estimated total files: ~30 source + 6 root docs.

## Decisions logged in DECISIONS.md:
- Using existing Next.js 16 + React 19 + Tailwind v4 + src/ layout (not scaffolding a new repo).
- Tone.js dynamically imported with `ssr: false` to avoid Vercel SSR audio issues.
- Salamander piano samples from `https://tonejs.github.io/audio/salamander/` (CDN; widely used, CORS-friendly).
- PolySynth fallback if Sampler fails to load.
- Piano layout computed via note-name parser, not hardcoded 61 divs.
- Touch target ≥ 44px enforced via `min-w-[44px] min-h-[44px]` and responsive sizing.
