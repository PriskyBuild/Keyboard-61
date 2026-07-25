# Decisions Log

Autonomous decision log — when the spec was ambiguous or contradicted the existing repo, a reasoned choice was made here and work continued.

## D1 — Use existing Next.js 16 project, do not scaffold `piano-app/` subdirectory
- The system prompt explicitly states a Next.js project already exists at `/home/z/my-project` initialized with shadcn/ui and Tailwind v4.
- Re-scaffolding would discard the working setup and break the dev server / port 3000 contract.
- **Decision**: Adapt the user's `piano-app/` tree to the existing `src/` layout. Mapping:
  - `app/` → `src/app/`
  - `components/` → `src/components/`
  - `lib/` → `src/lib/`
  - `hooks/` → `src/hooks/`
  - `types/` → `src/types/`
  - `public/` → existing `public/`
  - Root docs (PLAN.md, PROGRESS.md, DECISIONS.md, README.md, .env.example, vercel.json) live at repo root.

## D2 — Tailwind v4 (not v3)
- The user's plan implies Tailwind v3 (`tailwind.config.ts` content paths). The repo uses Tailwind v4 (`@import "tailwindcss"` in globals.css, `@tailwindcss/postcss` plugin).
- **Decision**: Use Tailwind v4 conventions. Keep `tailwind.config.ts` for backward-compat content paths (harmless). All custom CSS via `@theme inline` / `@layer` blocks in `globals.css`.

## D3 — Strict TypeScript
- User requires `strict: true` + `zero any`. Existing `tsconfig.json` has `noImplicitAny: false`.
- **Decision**: Set `noImplicitAny: true` to enforce. Remove `typescript.ignoreBuildErrors` from `next.config.ts`. If build breaks due to existing shadcn defaults, we fix at the call site rather than relax.

## D4 — React Strict Mode
- User wants `reactStrictMode: true`. Existing config has `false`.
- **Decision**: Flip to `true`. Tone.js engine uses an idempotent singleton guard so strict mode double-mount won't double-init.

## D5 — Tone.js client-only
- Tone references `window`/`AudioContext`; SSR breaks.
- **Decision**: Tone is imported dynamically with `ssr: false` inside `useAudioEngine`. The `lib/audio.ts` module guards `typeof window === 'undefined'`.

## D6 — Piano samples
- Salamander grand piano samples hosted at `https://tonejs.github.io/audio/salamander/` — public, CORS-enabled, used by Tone.js docs.
- **Decision**: Use them. On `onerror`, fall back to `Tone.PolySynth` so the app is always playable offline.

## D7 — 61-key layout, computed
- 36 white + 25 black, C2..C7 inclusive. No black key after the terminal C7.
- **Decision**: Generate keys programmatically from a C2..C7 note range. White keys in a `flex` row; black keys absolutely positioned using the formula `left = (whiteIndex + 1) * whiteWidth - blackWidth/2` where `whiteIndex` is the index of the preceding white key (C for C#, D for D#, F for F#, G for G#, A for A#).

## D8 — Computer keyboard mapping
- `a s d f g h j` → C D E F G A B (white, current octave)
- `w e _ t y u _` → C# D# (skip E#) F# G# A# (skip B#)
- `z` / `x` → octave down / up (clamped 2..6 so mapped octave stays inside C2..C7)
- **Decision**: Implement as a pure function `keyboardMap(octave)` returning `{ [physKey]: noteName }`. Show hints only when toggled.

## D9 — Falling notes visualizer
- Canvas-based with `requestAnimationFrame`. Notes have `{note, start, duration}` (seconds). Hit-line at the top of the keyboard. Notes fall from top to hit-line; speed scaled by `pixelsPerSecond` × tempo.
- Tempo multiplier rescales both `Tone.Transport` and the visualizer.
- **Decision**: Use canvas for perf with up to ~50 simultaneous falling notes; measure DPR for crispness.

## D10 — Scoring
- On correct press within ±250ms of the scheduled start: +100, accuracy++, streak++.
- On wrong press or out-of-window: red flash, streak=0, accuracy denominator still increments (counted as miss).
- **Decision**: Simple but defensible scoring; window tunable as a constant.

## D11 — Backend health endpoint
- User's tree includes `app/api/health/route.ts`. Vercel zero-config still benefits from a health probe.
- **Decision**: Implement trivial `GET /api/health` returning `{ status: "ok", time: <ms> }`.

## D12 — Sticky footer + sticky header
- Per UI rules, footer must stick to bottom on short pages and push naturally on long pages.
- **Decision**: Root wrapper `<div className="min-h-screen flex flex-col">`; main content `flex-1`; footer `mt-auto`.

## D13 — Output mode
- Existing `next.config.ts` uses `output: "standalone"` (for containerized prod). Vercel supports `standalone` but it's not necessary.
- **Decision**: Keep `standalone` — Vercel handles it fine and the existing `bun run start` script depends on it.
