---
Task ID: webDevReview-round-3
Agent: GLM-5.2 webDevReview cron (every 15 min)
Task: Third recurring QA + feature-expansion round. Read worklog, run QA, then independently choose the work focus (fix bugs or add features) and continue development. Mandated: improve styling with more details + add more features/functionality.

## 1. Current project status assessment

The project has two prior rounds of work in the worklog:
- **Round 1 / Phase 1** (C0-C6): scaffold, audio engine, 61-key piano, Free Play + Learning Mode, deploy config, git push.
- **Round 2 / Phase 1 polish**: expanded songs (4→9), localStorage persistence (prefs + highScores + stats), theme toggle (next-themes), sticky header, HelpModal, StatsPanel, sliding mode toggle, visualizer polish.
- **Phase 2 (P2-C0 → P2-C9)**: Microphone listening engine (YIN pitch detection + AudioWorklet), Listen Mode UI (Bruno the bear mascot, kid-friendly falling notes, hand-position diagram, celebration screen), 12-lesson curriculum, gamification (35 stickers + coins + streak calendar), PIN-locked parent dashboard (multi-profile, recharts progress chart, export/import JSON).
- **Post-launch fixes**: Suspense boundary around `useSearchParams` (Vercel prerender error), visualizer-piano gap fix, Score/Play panel moved above visualizer.

**QA findings this round:**
- `bun run lint` clean.
- `bun run typecheck` clean.
- All 7 routes return 200: /, /listen, /curriculum, /parent, /stickers, /help/microphone, /api/health.
- Dev server is unstable in this sandbox (gets killed when agent-browser opens a tab); verified via curl + tailing dev.log instead.

## 2. Work focus chosen

Addressed both mandated asks ("improve styling with more details" + "add more features/functionality") via four parallel tracks:

### Track A — Visualizer performance optimization
- src/components/Visualizer.tsx + src/components/listen/FallingNotesKid.tsx:
  Both visualizers previously awaited `audio.getTransport()` on every animation frame (~60 awaits/sec, each one re-importing the audio module). Refactored to cache the transport reference on first successful call and reuse it for all subsequent frames. The cache is invalidated only when the audio module isn't ready yet, so it self-heals on engine restart.

### Track B — Metronome for Free Play
- New: src/hooks/useMetronome.ts — drives Tone.Transport with `scheduleRepeat("4n")` for sample-accurate clicks. Beat 1 of each bar gets an accent (C5 + 0.7 velocity); other beats use A4 + 0.45 velocity. BPM 40-220, beats-per-bar 1-8.
- New: src/components/Metronome.tsx — compact panel with:
  - Visual beat dots (1 per beat in the bar; beat 1 is amber + accented, others are emerald).
  - BPM slider with labels (40/100/140/180/220).
  - Time-signature selector (2/3/4/5/6/7/8 beats per bar).
  - Start/Stop toggle button.
- Wired into AppShell.tsx — only renders in Free Play mode (Learning Mode already drives the kid with falling notes).

### Track C — Practice Mode for Learning Mode
- New: src/components/PracticeModeToggle.tsx — toggle in LearningPanel that flips between "Scored" and "Practice" modes. Practice mode disables score penalty (UI affordance only — wiring the loop range to the song player is left as a future enhancement). Includes a "loop whole song" toggle shown only in Practice mode.
- Wired into src/components/LearningPanel.tsx below the tempo slider.

### Track D — Command palette (⌘K)
- New: src/components/CommandPalette.tsx — quick-access overlay using the existing cmdk library. Triggered by ⌘K / Ctrl+K / "/" (when not in a form field). Includes:
  - **Navigate**: Play (home), Listen Mode, Lessons, Stickers, Parent, Microphone Privacy Help.
  - **Modes**: Switch to Free Play / Learning Mode.
  - **Toggles**: Note names, Key hints, Sustain pedal.
  - **Theme**: Light / Dark / Follow system.
  - **Help**: Open microphone privacy help.
- New: CommandPaletteHint — small "⌘K" badge in the header that hints at the shortcut.
- Wired into AppShell.tsx — palette renders globally; hint badge sits next to the Shortcuts button in the header.

### Track E — Styling polish
- src/app/globals.css: added 5 new animations:
  - `header-shimmer` — animated gradient backdrop on the header (12s ease-in-out).
  - `float-note` — gentle 4px bobbing for floating note badges above visualizers.
  - `mascot-enter` — slide-up + fade-in entrance for Bruno the bear.
  - `happy-glow` — pulsing amber glow ring around the mascot in "happy" state.
  - `pulse-ring` — expanding ring for active mic indicators.
- Added `card-lift` utility class — 3px translate-Y + soft shadow on hover. Applied to SongSelector + LessonCard components.
- src/components/AppShell.tsx: header now uses `header-gradient` class (animated gradient backdrop). Logo icon scales 5% on hover.
- src/components/listen/Mascot.tsx: outer container now has `animate-mascot-enter` (slide-up entrance). "Happy" state now combines `animate-mascot-bounce` + `animate-happy-glow` (pulsing amber glow ring).

## 3. Verification
- `bun run lint` → clean (0 errors / 0 warnings).
- `bun run typecheck` → clean.
- All 7 routes return 200 via curl.
- Dev server unstable when agent-browser opens tabs in this sandbox (gets killed); used curl + dev.log tailing instead for verification.

## 4. Files added / modified this round

### New files (4)
- src/hooks/useMetronome.ts
- src/components/Metronome.tsx
- src/components/PracticeModeToggle.tsx
- src/components/CommandPalette.tsx

### Modified files (6)
- src/components/Visualizer.tsx (transport-reference caching)
- src/components/listen/FallingNotesKid.tsx (transport-reference caching)
- src/components/AppShell.tsx (Metronome wiring, CommandPalette, CommandPaletteHint, gradient header)
- src/components/listen/Mascot.tsx (mascot-enter + happy-glow animations)
- src/components/LearningPanel.tsx (Practice Mode toggle)
- src/components/SongSelector.tsx (card-lift hover)
- src/components/curriculum/LessonCard.tsx (card-lift hover)
- src/app/globals.css (5 new animations + card-lift utility)

## 5. Unresolved issues / risks for next phase
- **Practice Mode loop wiring**: the toggle currently shows the UI affordance only. Wiring the loop range to the song player (auto-restart at the loop end) is left as a future enhancement.
- **Metronome accent synthesis**: the accent uses a higher pitch (C5) — could be improved with a proper woodblock sample for a more authentic click sound.
- **Command palette**: doesn't yet include "select song" actions (jumping to a specific song in Learning Mode). Could add a `songs` group that lists all 9 songs.
- **Songs library**: still hardcoded TypeScript (9 songs). Could be moved to JSON for easier community contributions.
- **Audio engine**: still loads all 30 Salamander samples at once (~5MB). Could split into per-octave fetches.
- **High-score formatting**: shows raw numbers; could format with thousands separators for very high scores.

Stage Summary:
- Build is feature-rich: 9 songs, 12 lessons, mic listening, parent dashboard, sticker album, metronome, practice mode, command palette, theme toggle, stats panel, keyboard-shortcuts help, animated mascot with glow effects.
- Lint clean, typecheck clean.
- Recommended next focus: wire Practice Mode loop to the song player + add song-selection actions to the command palette + move songs to JSON.
