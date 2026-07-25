---
Task ID: webDevReview-round-9
Agent: GLM-5.2 webDevReview cron (every 15 min)
Task: Ninth recurring QA + feature-expansion round. Read worklog, run QA, then independently choose the work focus (fix bugs or add features) and continue development. Mandated: improve styling with more details + add more features/functionality.

## 1. Current project status assessment

Eight prior rounds of work. Project is feature-rich: 14 songs, 12 lessons, mic listening, parent dashboard, sticker album, achievements page (16 badges), metronome, practice mode with A-B loop + time labels, command palette with song-jump + lesson-jump + sticker-themes, song preview, daily challenge with working bonus coins, quick stats bar, theme toggle, stats panel, keyboard-shortcuts help, animated mascot with glow effects, hero banner on home, 15 CSS animations, redesigned footer, smooth mode transitions, difficulty-colored song card borders.

**QA findings this round:**
- `bun run lint` clean.
- `bun run typecheck` clean.
- All 8 routes return 200 via curl.
- No bugs found — code is stable.

## 2. Work focus chosen

### Track A — Favorites/Bookmark system (new feature)
- New `src/lib/favorites.ts`: `loadFavorites()`, `saveFavorites()`, `toggleFavorite()` helpers. Persisted to localStorage under `piano-app:favorites:v1`.
- Updated `src/components/SongSelector.tsx`:
  - Added a heart button (top-left corner) on each song card. Clicking toggles the favorite state. Heart fills rose-red when favorited.
  - Songs are sorted with favorites first (alphabetical), then non-favorites (original order). Pinned favorites are instantly visible at the top of the grid.
  - `handleToggleFavorite` uses `e.stopPropagation()` so clicking the heart doesn't select the song.

### Track B — Styling polish (5 new CSS animations)
Added 5 new CSS utilities to `src/app/globals.css`:
1. **`animate-note-wave`** — decorative sine-wave bobbing for floating music notes (translateY + rotate, 3s loop).
2. **`gradient-text-amber`** — amber-to-orange gradient text fill for headlines. Applied to HeroBanner's "real piano" text.
3. **`gradient-text-emerald`** — emerald gradient text variant (ready for future use).
4. **`empty-state`** — friendly flex-column placeholder for sections with no data.
5. **`animate-heart-pop`** — scale pop (1 → 1.3 → 1) for the favorite heart when toggled.

Also replaced HeroBanner's inline `bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent` with the reusable `gradient-text-amber` class.

## 3. Verification
- `bun run lint` → clean (0 errors / 0 warnings).
- `bun run typecheck` → clean.
- All 8 routes return 200 via curl.
- All 5 new CSS classes confirmed compiled into the production stylesheet.

## 4. Files added / modified this round

### New files (1)
- `src/lib/favorites.ts`

### Modified files (3)
- `src/components/SongSelector.tsx` (favorites system: heart button, sorting, toggleFavorite)
- `src/components/HeroBanner.tsx` (gradient-text-amber class)
- `src/app/globals.css` (5 new CSS animations + utilities)

## 5. Unresolved issues / risks for next phase
- **Songs library**: still hardcoded TypeScript (14 songs). Could be moved to JSON for easier community contributions.
- **Audio engine**: still loads all 30 Salamander samples at once (~5MB). Could split into per-octave fetches.
- **Achievements**: badges are computed live (no persistence) — they re-derive from existing stats on every page load. Could persist earned-badge timestamps for a "recently unlocked" feed.
- **Metronome accent**: uses a higher pitch (C5) for the accent — could be improved with a proper woodblock sample.
- **Song Preview**: uses setTimeout-based scheduling (not sample-accurate). Could use Tone.Transport for tighter timing.
- **Favorites**: sorting is stable but doesn't persist a custom order. Could add drag-to-reorder.

Stage Summary:
- Build is feature-rich: 14 songs, 12 lessons, mic listening, parent dashboard, sticker album, achievements page (16 badges), metronome, practice mode with A-B loop + time labels, command palette with song-jump + lesson-jump + sticker-themes, song preview, daily challenge with working bonus coins, quick stats bar, favorites/bookmarks, theme toggle, stats panel, keyboard-shortcuts help, animated mascot with glow effects, hero banner on home, 20 CSS animations total, redesigned footer, smooth mode transitions, difficulty-colored song card borders, gradient text headings.
- Lint clean, typecheck clean.
- Recommended next focus: persist achievement timestamps + move songs to JSON + metronome woodblock sample.
