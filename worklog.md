---
Task ID: webDevReview-round-2
Agent: GLM-5.2 webDevReview cron (every 15 min)
Task: First recurring QA + feature-expansion round. Read worklog, run agent-browser QA, then independently choose the work focus (fix bugs or add features) and continue development. Mandated: improve styling with more details + add more features/functionality.

Work Log:

## 1. Project status assessment
- Read previous worklog (C0-C6 full build). All checkpoints complete: scaffold, audio, 61-key piano, Free Play, Learning Mode + songs + visualizer + scoring, deploy config, git push to https://github.com/PriskyBuild/Piano-Learn.git.
- Ran QA: dev server healthy (`/` returns 200), `bun run lint` clean, `bun run typecheck` clean, Agent Browser confirmed 36 white + 25 black = 61 keys, no console errors.
- Took "before" screenshots (download/before-styling.png, download/before-learning.png) for visual baseline.
- Identified gaps from the previous round's "Unresolved issues" list:
  - Only 4 songs in the library
  - No persistence (high scores, last-played song, settings lost on refresh)
  - No theme toggle
  - Visualizer was plain
  - No keyboard-shortcuts help
  - No stats panel

## 2. Work focus chosen
Two of the mandated asks ("improve styling with more details" + "add more features/functionality") were addressed in parallel via four feature tracks:

### Track A — Expanded song library (4 → 9 songs)
Added 5 new songs to src/lib/songs.ts:
- Mary Had a Little Lamb (Beginner, 110 BPM)
- When the Saints Go Marching In (Easy, 120 BPM)
- Amazing Grace (Easy, 90 BPM)
- Scarborough Fair (Intermediate, 80 BPM — Dorian modal)
- Für Elise (Intermediate, 130 BPM — Beethoven opening theme with sharps)

Verified: `grep -c '^    id: "' src/lib/songs.ts` returns 9 unique songs.

### Track B — localStorage persistence (new file src/lib/persistence.ts)
- Defined versioned schema (PersistedPrefs + PersistedStats).
- `loadPrefs/savePrefs/loadStats/saveStats/bumpStat/recordHighScore/getHighScore/clearAll` helpers, all SSR-safe.
- Refactored `src/lib/store.ts` to:
  - Hydrate initial state from localStorage on first render (SSR-safe).
  - Persist on every pref-mutating setter via a `persistPrefs(state)` helper.
  - Add `theme`, `highScores`, `stats`, `commitHighScore`, `bumpStatField`, `refreshStats`, `resetAll`, `hydrated` fields.
- Wired `useSongPlayer` to:
  - Call `commitHighScore(song.id)` on song completion.
  - Call `bumpStatField('secondsPlayed', elapsedSec)` + `bumpStatField('songsCompleted', 1)` on song completion.
  - Call `bumpStatField('totalNotesPlayed', 1)` on every correct press.
- Wired `Piano.tsx` to bump `totalNotesPlayed` on every Free Play press (so non-Learning clicks count too).
- Wired `AppShell.tsx` to count Free Play sessions (one per mode-transition into "free").
- Verified via Agent Browser:
  - localStorage keys: `piano-app:v1` (prefs + highScores + theme), `piano-app:stats:v1` (lifetime totals).
  - After reload: mode, stats, highScores all preserved.

### Track C — Theme toggle (light/dark/system) with next-themes
- Added `ThemeProvider` to `src/app/layout.tsx` (attribute="class", defaultTheme="dark", enableSystem, disableTransitionOnChange).
- Created `src/components/ThemeToggle.tsx` — segmented control with Light/Dark/Auto options.
  - **Critical bug fix**: initial implementation read `theme` from useTheme() during render → React 19 hydration mismatch. Refactored to a CSS-driven approach: render all 3 buttons always, use `html.light`/`html.dark`/`html:not(.light):not(.dark)` CSS attribute selectors to highlight the active one. No React state needed at render time → no hydration mismatch.
- Added CSS in `globals.css` for `.piano-theme-toggle button[data-theme-choice]` highlighting via `html.light`/`html.dark` selectors.
- Verified via Agent Browser: clicking Light → `<html class="light">`, theme saved to localStorage as "light". Clicking Dark → `<html class="dark">`.

### Track D — Styling polish + 3 new UI components
1. **ModeToggle**: rewrote with a sliding active indicator (gradient amber→orange pill that animates left/right via `transition-[left,width]`). Active icon scales up 110%. Much more tactile than the previous bg-color swap.
2. **Visualizer**: richer canvas rendering — vertical gradient background (darker top → lighter near hit line), horizontal beat gridlines that scroll with song time, multi-stop note gradient (top→mid→bottom), drop shadow, top highlight strip, and an outer glow that intensifies as notes approach the hit line. Hit line now has a glow underlay + crisp line + end caps.
3. **Header**: now `sticky top-0 z-30` so it stays visible while scrolling. Logo has ring + shadow. Compact on mobile.
4. **SongSelector**: 5-column responsive grid (was 4). Added high-score ribbon (top-right corner) showing the score (e.g. "1.2k"). Added personal-best footer on each card showing best accuracy + streak. Logo has ring.
5. **Scoreboard**: shows previous-best chip ("Previous best: 102 · 95%") above the stats grid. On song-complete, shows a "New personal best!" gradient ribbon when the score beats the previous high.
6. **HelpModal** (new): Dialog with all 7 white-key + 5 black-key mappings as visual KeyCaps (letter + note name). Global shortcuts (Z/X). Triggered by a "?" button in the header OR the `?` / `Shift+/` keyboard shortcut. Closes on Escape.
7. **StatsPanel** (new): Sheet (right-side drawer) with:
   - Lifetime totals grid (notes played, songs completed, time played, Free Play sessions).
   - "Best score" hero card (gradient amber, shows the user's top song + accuracy + streak).
   - Scrollable list of all 9 songs with their high scores (or "—" placeholders).
   - "Reset all stats" button with confirmation dialog.
   - Triggered by a "Stats" button in the header.
8. **Piano stage**: added wood-grain frame via `::before` pseudo-element with translate + shadow.

## 3. Verification
- `bun run lint` → clean (0 errors / 0 warnings).
- `bun run typecheck` → clean.
- Agent Browser end-to-end:
  - `/` returns 200, no console errors, no React hydration warnings.
  - 36 white + 25 black = 61 keys (verified via DOM count).
  - Clicked C4 in Free Play → `totalNotesPlayed: 1` in localStorage.
  - Opened Stats panel → shows "Notes played: 1", "0/9 with high score", all 9 songs listed.
  - Switched to Learning mode → all 9 song cards visible (including Intermediate: Für Elise, Scarborough Fair).
  - Selected Ode to Joy → pressed Play → Pause button appears, nextNote hint updates per note.
  - localStorage after song: `songsCompleted: 1`, `secondsPlayed: 18`, `highScores.ode-to-joy` saved.
  - Theme toggle: clicking Light → `<html class="light">`, theme saved to localStorage.
  - Help modal: opens via header button, shows all 12 keyboard mappings + global shortcuts.
  - Reload persistence: state survives page refresh (mode=learn, stats preserved, highScores preserved).
- Screenshots saved: download/before-styling.png, download/before-learning.png, download/after-styling-light.png, download/after-styling-dark.png, download/after-learning.png.

## 4. Files added / modified this round

### New files (4)
- src/lib/persistence.ts (localStorage layer + types)
- src/components/ThemeToggle.tsx
- src/components/HelpModal.tsx
- src/components/StatsPanel.tsx

### Modified files (8)
- src/app/layout.tsx (ThemeProvider)
- src/app/globals.css (theme toggle CSS, piano-stage wood frame, fade-in/pop animations)
- src/lib/store.ts (full rewrite — hydrate from localStorage, persist on every pref change, add stats + highScores + theme + resetAll)
- src/lib/songs.ts (5 new songs; 9 total)
- src/hooks/useSongPlayer.ts (commitHighScore + bumpStatField on song complete + on each hit; playStartTsRef for seconds-played accounting)
- src/components/AppShell.tsx (sticky header, ThemeToggle, StatsButton, HelpModal wiring, Free Play session counter)
- src/components/ModeToggle.tsx (sliding gradient indicator + icon scale animation)
- src/components/Visualizer.tsx (vertical gradient bg, beat gridlines, multi-stop note gradient, drop shadow, hit-line glow + caps, approach-glow on notes near hit line)
- src/components/SongSelector.tsx (5-column grid, high-score ribbon, personal-best footer, logo ring)
- src/components/Scoreboard.tsx (previous-best chip, "New personal best!" ribbon on song-complete)
- src/components/Piano.tsx (bump totalNotesPlayed on Free Play press)

## 5. Unresolved issues / risks for next phase
- The Visualizer canvas still uses `requestAnimationFrame` with `async audio.getTransport()` per frame (~60 fps). Each frame awaits the audio module's promise. Could be optimized by caching the transport reference once the engine is ready, eliminating the per-frame await.
- Songs library is still hardcoded TypeScript. Could be moved to a JSON file (`src/lib/songs.json`) to allow easier community contributions.
- No metronome for Free Play (would help users practise timing without Learning Mode's song structure).
- No "Practice Mode" — slow down a song to learn it without scoring pressure. Tempo slider (0.5×–1.5×) partially addresses this but a dedicated mode with pause/scrub would be more useful.
- Audio engine doesn't lazy-load samples per octave (currently loads all 30 Salamander samples at once, ~5MB total). Could split into per-octave fetches.
- No keyboard shortcut to open the Stats panel.
- The high-score ribbon currently shows the raw number; for very high scores it could format with thousands separators.

Stage Summary:
- Build is feature-stable: 9 songs, persistent stats + high scores + theme + prefs, polished UI with animations, full keyboard-shortcuts help, sticky header, accessible stats drawer.
- Lint clean, typecheck clean, runtime verified end-to-end via Agent Browser.
- Recommended next focus: metronome for Free Play + Practice Mode (song scrubbing) + transport-reference caching in Visualizer.
