---
Task ID: webDevReview-round-7
Agent: GLM-5.2 webDevReview cron (every 15 min)
Task: Seventh recurring QA + feature-expansion round. Read worklog, run QA, then independently choose the work focus (fix bugs or add features) and continue development. Mandated: improve styling with more details + add more features/functionality.

## 1. Current project status assessment

The project has six prior rounds of work:
- **Phase 1 (C0-C6)**: scaffold, audio, 61-key piano, Free Play + Learning Mode, deploy.
- **Phase 1 polish (Round 2)**: 9 songs, persistence, theme toggle, sticky header, HelpModal, StatsPanel, sliding mode toggle, visualizer polish.
- **Phase 2 (P2-C0 → P2-C9)**: mic listening (YIN + AudioWorklet), Listen Mode UI (Bruno mascot), 12-lesson curriculum, gamification (35 stickers + coins + streak calendar), PIN-locked parent dashboard.
- **Round 3 polish**: metronome, practice mode toggle, command palette (⌘K), visualizer transport-cache optimization, gradient header, mascot glow animations, TopNav disconnect fix.
- **Round 4**: 14 songs, achievements page (16 badges), hero banner, practice-mode loop wired, command-palette song-jump.
- **Round 5**: A-B loop markers, lesson-jump in command palette, 6 CSS animations.
- **Round 6**: song preview, A-B loop time labels, sticker-themes palette, 5 CSS animations.

**QA findings this round:**
- `bun run lint` clean.
- `bun run typecheck` clean.
- All 8 routes return 200 via curl.
- No bugs found — code is stable.

## 2. Work focus chosen

### Track A — Daily Challenge feature (new)
- New `src/lib/daily-challenge.ts`: deterministic daily song picker seeded by YYYY-MM-DD. All users on the same day see the same challenge. Bonus coins = 10..29 (deterministic per day). `getDailyChallenge()` + `completeDailyChallenge()` + `timeUntilNextChallenge()` helpers. Completion persisted to localStorage.
- New `src/components/DailyChallengeCard.tsx`: eye-catching card shown on the home page (Free Play mode) below the HeroBanner. Shows: challenge label, featured song title/artist/difficulty/BPM, bonus coins badge, countdown timer to next challenge. "Play" button sets mode=learn + currentSong and navigates to home Learning Mode. When completed: shows "✓ Done!" with emerald styling + time until next challenge.
- Wired `completeDailyChallenge()` into `useSongPlayer` — fires when the daily challenge song is completed.
- Card has a gentle `animate-daily-pulse` attention-grabber when not yet completed.

### Track B — Styling polish (4 new CSS animations + footer redesign)
Added 4 new animations to `src/app/globals.css`:
1. **`glass-card`** — frosted glass effect (backdrop-blur + semi-transparent background). Ready for future card redesigns.
2. **`animate-mode-fade`** — smooth fade + slide-up transition when switching between Free Play and Learning modes. Applied to both mode content wrappers in AppShell.
3. **`footer-gradient-line`** — a 2px gradient line (amber → teal → rose) above the footer. Applied to the new footer design.
4. **`animate-daily-pulse`** — gentle scale pulse (1.0 → 1.02) for the Daily Challenge card when not yet completed. 3s ease-in-out loop.

**Footer redesign**: replaced the plain text footer with a gradient line + two-column layout. Left side: "Built with Next.js 16 · Tone.js · Tailwind CSS". Right side: quick links (🔒 Privacy → /help/microphone, 🏆 Achievements → /achievements, MIT License).

**Mode transitions**: wrapped both Free Play and Learning Mode content in `<div className="animate-mode-fade">` with unique keys so React re-mounts the content on mode switch, triggering the fade animation.

## 3. Verification
- `bun run lint` → clean (0 errors / 0 warnings).
- `bun run typecheck` → clean.
- All 8 routes return 200 via curl.
- Verified all 4 new CSS classes are compiled into the production stylesheet.
- Home page HTML contains footer links ("Privacy", "Achievements", "MIT License") and `footer-gradient-line` class.

## 4. Files added / modified this round

### New files (2)
- `src/lib/daily-challenge.ts`
- `src/components/DailyChallengeCard.tsx`

### Modified files (4)
- `src/components/AppShell.tsx` (DailyChallengeCard wiring, footer redesign, mode-fade transitions)
- `src/hooks/useSongPlayer.ts` (completeDailyChallenge on song completion)
- `src/app/globals.css` (4 new CSS animations: glass-card, mode-fade, footer-gradient-line, daily-pulse)
- `src/components/DailyChallengeCard.tsx` (animate-daily-pulse on incomplete challenge)

## 5. Unresolved issues / risks for next phase
- **Songs library**: still hardcoded TypeScript (14 songs). Could be moved to JSON for easier community contributions.
- **Audio engine**: still loads all 30 Salamander samples at once (~5MB). Could split into per-octave fetches.
- **Achievements**: badges are computed live (no persistence) — they re-derive from existing stats on every page load. Could persist earned-badge timestamps for a "recently unlocked" feed.
- **Daily Challenge**: bonus coins are declared but not actually awarded yet (the `bonusCoins` value is displayed but not added to the coin balance on completion). Need to wire it into the reward computation.
- **Metronome accent**: uses a higher pitch (C5) for the accent — could be improved with a proper woodblock sample.
- **Song Preview**: uses setTimeout-based scheduling (not sample-accurate). Could use Tone.Transport for tighter timing.

Stage Summary:
- Build is feature-rich: 14 songs, 12 lessons, mic listening, parent dashboard, sticker album, achievements page (16 badges), metronome, practice mode with A-B loop + time labels, command palette with song-jump + lesson-jump + sticker-themes, song preview, daily challenge, theme toggle, stats panel, keyboard-shortcuts help, animated mascot with glow effects, hero banner on home, 15 CSS animations total, redesigned footer with gradient line + quick links, smooth mode transitions.
- Lint clean, typecheck clean.
- Recommended next focus: wire daily challenge bonus coins + persist achievement timestamps + move songs to JSON.
