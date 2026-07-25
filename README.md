# 🎹 Piano Learning App

A fully client-side **web-based piano learning app** built with Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, and Tone.js. Deployable to Vercel with **zero environment variables** — no backend, no database, no auth.

![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Tone.js](https://img.shields.io/badge/Tone.js-15-purple)

## ✨ Features

### 🎼 Two modes
- **Free Play** — click or touch any of the 61 keys, or play with your computer keyboard.
- **Learning Mode** — guided playback of classic songs with a falling-notes visualizer, scoring, accuracy %, streak counter, and tempo control.

### 🎹 61-key interactive keyboard
- Exactly 36 white + 25 black keys spanning **C2 → C7** (5 octaves + terminal C7).
- Layout computed programmatically — black keys positioned over the correct white-key boundaries.
- Pointer + touch + mouse support with visual depress and accessibility (`aria-label`, focus ring).
- Horizontally scrollable on mobile; ≥ 44px touch targets.

### ⌨️ Computer-keyboard mapping
- `a s d f g h j` → white keys C–B in the current octave.
- `w e t y u` → black keys C#–A#.
- `Z` / `X` → shift the mapped octave down / up (clamped to C2..C7).
- Toggle to show/hide on-key hints.

### 🔊 Audio engine
- Tone.js `Sampler` loaded with the public **Salamander** grand-piano samples.
- Automatic fallback to `PolySynth` if samples fail to load (offline-friendly).
- Sustain pedal toggle, master volume, and reverb knob.
- Loaded **client-side only** (dynamic import, `ssr: false`) — Vercel SSR-safe.

### 📊 Learning mode scoring
- Falling-notes visualizer synced to song timing.
- Next-key highlight + red flash on wrong press (no advance).
- Score, accuracy %, streak counter.
- Song-complete screen with replay / next song.
- Tempo control (0.5×–1.5×) reschedules both audio and visualizer.

### 📚 Built-in song library
- Twinkle Twinkle Little Star
- Ode to Joy (Beethoven)
- Jingle Bells
- Happy Birthday

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | Tailwind CSS v4 + shadcn/ui (New York) |
| Icons | lucide-react |
| Audio | Tone.js v15 (Sampler + PolySynth fallback) |
| State | React hooks + Zustand |
| Package manager | bun (locally) / npm (Vercel auto-detects) |
| Backend | None — fully client-side |

## 🚀 Getting started (local dev)

```bash
# 1. Install deps
npm install            # or: bun install / pnpm install

# 2. Copy env (optional — sensible defaults are baked in)
cp .env.example .env.local

# 3. Run dev server
npm run dev            # opens http://localhost:3000
```

Open <http://localhost:3000> in your browser. Click any key to play.

## 📦 Production build

```bash
npm run build          # next build
npm run start          # serve the production build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
```

## ☁️ Deploy to Vercel

This app is **zero-config** for Vercel: no env vars, no database, no server-only secrets. Two options:

### Option A — One-click Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_GITHUB_USER/piano-app)

> Replace `YOUR_GITHUB_USER/piano-app` with your repo URL after pushing (see Option B).

### Option B — Git import (recommended)

1. Push the repo to GitHub (see [Git push instructions](#git-push-instructions) below).
2. Go to <https://vercel.com/new>.
3. **Import** your `piano-app` repository.
4. Vercel auto-detects Next.js — leave all settings default.
5. **Deploy** — no environment variables needed.

Once deployed, Vercel will:
- Run `next build` automatically.
- Serve the app on a global CDN.
- Provide a `https://<project>.vercel.app` URL.
- Re-deploy on every push to `main`.

## 🔗 Git push instructions

After scaffolding, push to a fresh GitHub repo with these exact commands:

```bash
git init
git add .
git commit -m "feat: piano learning app"
git branch -M main
git remote add origin https://github.com/<USER>/piano-app.git
git push -u origin main
```

Then: **Vercel → New Project → Import the repo → Deploy (no env vars needed).**

## 🗂️ Project structure

```
src/
├── app/
│   ├── layout.tsx          # metadata, fonts, Toaster
│   ├── page.tsx            # the only user-visible route (/)
│   ├── globals.css         # Tailwind v4 + theme + piano styling
│   └── api/health/route.ts # trivial health probe
├── components/
│   ├── Piano.tsx           # 61-key container
│   ├── Key.tsx, WhiteKey.tsx, BlackKey.tsx
│   ├── KeyLabels.tsx       # note-name + keyboard-hint overlays
│   ├── Visualizer.tsx      # falling-notes canvas
│   ├── SongSelector.tsx    # song cards
│   ├── ModeToggle.tsx      # Free Play / Learning switch
│   ├── Controls.tsx        # volume, sustain, reverb, tempo
│   ├── Scoreboard.tsx      # score / accuracy / streak
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── audio.ts            # Tone.js engine (singleton)
│   ├── notes.ts            # C2–C7 generator + note math
│   ├── keyboard-map.ts     # physical key -> note
│   ├── songs.ts            # 4-song library
│   └── store.ts            # zustand store
├── hooks/
│   ├── useAudioEngine.ts
│   ├── useKeyboardInput.ts
│   └── useSongPlayer.ts
└── types/index.ts
```

Root: `PLAN.md`, `PROGRESS.md`, `DECISIONS.md`, `README.md`, `.env.example`, `vercel.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`.

## 📜 License

MIT — see source headers. Free for personal and commercial use.
