---
Task ID: C0-C6 (full autonomous build)
Agent: GLM-5.2 full-stack agent
Task: Build a fully client-side Next.js Piano Learning App (Free Play + guided Learning Mode with falling-notes visualizer + scoring), deploy-ready for Vercel, and push to https://github.com/PriskyBuild/Piano-Learn.git.

Work Log:
- C0 Scaffold: inspected existing Next.js 16 + React 19 + Tailwind v4 + shadcn/ui project at /home/z/my-project. Installed tone@15.1.22 and zustand@5.0.14. Wrote PLAN.md, DECISIONS.md, PROGRESS.md, README.md (with Vercel deploy section). Updated tsconfig.json (noImplicitAny:true), next.config.ts (reactStrictMode:true), .gitignore (allow .env.example). Wrote .env.example, vercel.json, public/favicon.svg. Updated src/app/layout.tsx (piano metadata, theme-color, viewport, favicon.svg). Added /api/health endpoint. Added piano-specific CSS (key gradients, press/next/wrong states, falling-note keyframes, custom scrollbar) to globals.css.
- C1 Audio Core: wrote src/types/index.ts, src/lib/notes.ts (parseNote/formatNote/noteToMidi/midiToNote/noteToFrequency + generateKeyboard() that produces exactly 36 white + 25 black keys for C2..C7 with runtime invariant), src/lib/audio.ts (lazy import("tone"), Sampler with 30 Salamander samples, PolySynth fallback, Reverb+Volume graph, sustain with heldNotes), src/hooks/useAudioEngine.ts (React adapter with ensureReady/playNote/releaseNote/setSustain/setVolumeDb/setReverbWet/getTransport/nowSeconds).
- C2 Piano UI: wrote src/lib/store.ts (Zustand store), src/lib/keyboard-map.ts (pure keyboardMap(octave)), src/components/Key.tsx + WhiteKey.tsx + BlackKey.tsx (accessible buttons with pointer capture, aria-labels, focus ring, depress/next/wrong visual states), src/components/KeyLabels.tsx, src/components/Piano.tsx (61-key container with ResizeObserver, computed black-key positioning, horizontal scroll on overflow), src/components/ModeToggle.tsx, src/components/Controls.tsx (volume, reverb, octave shift, sustain, note-names, key-hints), src/components/AppShell.tsx (header + mode toggle + audio-status badge + Piano + Controls + sticky footer).
- C3 Free Play: wrote src/hooks/useKeyboardInput.ts (global keydown/keyup, ignores form fields + modifier combos, suppresses auto-repeat, handles Z/X octave shift, blur handler releases all held notes). Wired into AppShell.
- C4 Learning Mode: wrote src/lib/songs.ts (4 songs: Twinkle, Ode to Joy, Jingle Bells, Happy Birthday with {id,title,artist,bpm,difficulty,description,notes}), src/hooks/useSongPlayer.ts (Tone.Transport scheduling, RAF loop for progress/next-note/missed-notes detection, tempo rescaling for both audio + visualizer, scoring with streak bonus), src/components/Visualizer.tsx (canvas-based falling notes with DPR-aware sizing, ResizeObserver, color-coded white/black, gradient + glow, hit-line), src/components/Scoreboard.tsx (Score/Accuracy/Streak + song-complete overlay with Replay/Next), src/components/SongSelector.tsx (card grid with difficulty badges). Replaced LearningPanel placeholder with full layout.
- C5 Deploy + bug fixes: added allowedDevOrigins to next.config.ts. Ran final lint + typecheck green. Verified /api/health endpoint.
- Found + fixed two critical bugs via Agent Browser self-verification:
  1. Audio init blocked UI: initAudio() was awaiting the Salamander sample load. Refactored to use PolySynth fallback immediately and load Sampler in background. Added onAudioStateChange listener mechanism. Fixed Tone.js v15 Sampler API (use onload/onerror, not the removed "loaded" event).
  2. Song player RAF loop never ran: useAudioEngine returned a fresh object every render → clearSchedule/stop identity changed every render → cleanup effect fired every render → stop() killed playback. Fixed by useMemo on useAudioEngine's return value + useSongPlayer uses a stopRef updated via effect so the song-change cleanup effect only depends on [song, resetScore].
- Self-verification via Agent Browser:
  - / returns 200, no console errors, no React hydration warnings.
  - 36 white + 25 black = 61 keys (verified by counting DOM buttons).
  - Clicking C4 plays correct pitch; audio badge transitions "Tap a key" → "Synth fallback" → "Piano samples loaded" within ~12s (30 Salamander samples 200 OK).
  - Learning Mode: Ode to Joy → Play → Pause → progress 0%→47%→100% → "Song complete!" overlay shown.
  - Correct press: C4 when nextNote=C4 → +102 points, hits=1, streak=1, advances.
  - Wrong press: C5 when nextNote=C4 → score unchanged, streak=0, hint does NOT advance.
  - Visualizer: amber/orange pixels (RGB ~248,173,22) drawing on canvas during playback.
  - Mobile 375px: keyboard scrolls horizontally, keys 32×150px.
  - Desktop 1280×800: footer sticky at bottom (totalH=800=viewportH).
  - Short viewport 1280×400: footer pushed down naturally (totalH=586, viewportH=400, scrolls).
  - Toggles: Note names → "C4" shows; Key hints → "A" shows; Octave up → hint moves from C4 to C5.
  - Computer keyboard: dispatching keydown for "a" → C5 added to activeNotes; keyup → removed.
- C6 Git push: pushed all commits to https://github.com/PriskyBuild/Piano-Learn.git (main branch). Added clean origin remote (no token in git config). User's GitHub PAT was used transiently only for the push.

Stage Summary:
- Build is COMPLETE: C0-C6 all done. App is at https://github.com/PriskyBuild/Piano-Learn.git.
- All checkpoints met: scaffold ✓, audio ✓, 61-key piano ✓, free play ✓, learning mode + songs + visualizer + scoring ✓, deploy config ✓, git push ✓.
- Lint clean, typecheck clean, runtime verified end-to-end via Agent Browser.
- Vercel deploy is one-click ready: import the repo, Vercel auto-detects Next.js, no env vars needed.
- SECURITY NOTE: the user pasted a GitHub PAT in plain text. They should revoke it at https://github.com/settings/tokens immediately.

Unresolved issues / risks for next phase:
- Songs library is hardcoded (4 songs). Could be expanded or moved to a JSON file.
- Visualizer uses requestAnimationFrame with async audio.getTransport() per frame — could be optimized to cache the transport reference.
- Salamander samples are ~5MB total — could be lazy-loaded per-octave.
- No persistence: user's high score, last-played song etc. are lost on refresh. Could add localStorage.
- No backend, so no leaderboard / sharing features.
- No tests (per project rules: "do not write any test code").
- The dev server emits a cosmetic cross-origin warning for the chat-preview origin (suppressed via allowedDevOrigins but the warning still appears for unknown subdomains).
