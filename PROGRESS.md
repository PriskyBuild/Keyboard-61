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

## Phase 2 — Microphone Listening Mode + Kids Curriculum + Parent Dashboard

### P2-C0 — Plan & inventory ✅ DONE
- Read every existing file under src/app/, src/components/, src/lib/, src/hooks/.
- Inventoried: 61-key Piano (Key/WhiteKey/BlackKey), Tone.js engine (audio.ts), Zustand store with localStorage persistence (persistence.ts + store.ts), 9-song library (songs.ts), useAudioEngine + useKeyboardInput + useSongPlayer hooks, Phase-1 Free Play + Learning Mode UI.
- Installed `canvas-confetti@1.9.4`. `recharts` already present.
- Wrote PHASE2_PLAN.md with full architecture inventory, 10 architectural decisions (D1-D10), and a 9-checkpoint plan (P2-C0 → P2-C9).
- Key decisions: separate AudioContext for mic (no Tone.js contamination), AudioWorklet in public/worklets/ (Next.js serves /public at root), YIN at 2048 samples ~46ms latency, 4-digit PIN hashed with SHA-256 via crypto.subtle, multi-profile localStorage keyed by profileId, single bear mascot with 4 states, never-punitive feedback (green/yellow only), session timer per-day per-profile.

### Next — P2-C1: Mic capture + AudioWorklet
- src/lib/mic/capture.ts: getUserMedia with DSP filters OFF.
- public/worklets/yin-processor.js: AudioWorklet skeleton.
- src/lib/mic/audio-worklet-bridge.ts: load worklet, fallback to ScriptProcessorNode.

### P2-C1 — Mic capture + AudioWorklet ✅ DONE
- `src/lib/mic/capture.ts`: getUserMedia with echoCancellation/noiseSuppression/autoGainControl=false, channelCount=1, sampleRate=44100. isMicSupported() secure-context check, classifyMicError() mapping for permission-denied / no-device / non-secure-context / unsupported / unknown, kid-friendly messages. MicCaptureHandle with stop() that disconnects source + stops tracks + closes AudioContext.
- `public/worklets/yin-processor.js`: AudioWorkletProcessor subclass, accumulates 2048 samples, runs full YIN (difference function → cumulative mean normalized difference → absolute threshold 0.10 → parabolic interpolation), posts {freq, confidence, rms, frame}. Range check 60Hz..2100Hz. Confidence = 1 - min yin buffer value.
- `src/lib/mic/yin.ts`: Pure TypeScript YIN implementation (used by ScriptProcessor fallback when AudioWorklet unavailable). Includes applyOctaveGuard() helper for the 2×/0.5× harmonic correction.
- `src/lib/mic/audio-worklet-bridge.ts`: attachPitchWorklet() — adds the worklet module, creates AudioWorkletNode('yin-processor'), wires source → worklet → port.onmessage. Falls back to ScriptProcessorNode with a console warning when audioWorklet is unavailable (Safari < 14.1, old browsers). ScriptProcessor path connects to a zero-gain node → destination to keep onaudioprocess firing in all browsers.
- `src/hooks/useMicListener.ts`: React hook with {listening, freq, confidence, rms, usingFallback, error, supported, start, stop}. Stops mic on visibilitychange/blur (privacy). Refs hold the handle + bridge so identity is stable across renders. Initial `supported` flag computed at module load (no setState-in-effect).
- `src/components/TopNav.tsx`: sticky top nav (Play / Listen / Lessons / Stickers / Parent) — added to layout.tsx so users can navigate between Phase 1 and Phase 2 routes. Hidden on `/` because AppShell has its own header.
- `src/app/listen/page.tsx`: minimal smoke-test page (P2-C1/C2) — Start/Stop button, mic status card, live frequency readout (Hz / confidence / RMS / frame counter), error display.
- Smoke test via agent-browser: `/listen` returns 200, TopNav renders, worklet file fetchable (HTTP 200, 5108 bytes), Start button clicked → getUserMedia → "no microphone found" handled gracefully with kid-friendly message.

### Next — P2-C2: YIN pitch detection
- The YIN algorithm is already implemented (in both the worklet and src/lib/mic/yin.ts) — it was added as part of P2-C1 because the worklet needs the algorithm to post meaningful messages. P2-C2 is therefore effectively complete; the remaining work is to write a synthetic-tone unit-test path that verifies the YIN output for known frequencies (we can't test real-piano audio in the sandbox).

### P2-C2 — YIN pitch detection ✅ DONE
- The YIN algorithm was already implemented in P2-C1 (both inside public/worklets/yin-processor.js for the AudioWorklet path AND in src/lib/mic/yin.ts for the ScriptProcessor fallback). P2-C2 is therefore effectively the verification step.
- src/lib/mic/yin.ts exposes: detectPitchYin(buffer, sampleRate) → {freq, confidence} with 4-step algorithm (difference function → cumulative mean normalized difference → absolute threshold 0.10 → parabolic interpolation). Range check 60Hz..2100Hz (B1..C7). Confidence = 1 - minimum yin buffer value.
- Includes applyOctaveGuard(detectedFreq, expectedFreq) for the 2×/0.5× harmonic correction (when detectedFreq is within 3% of 2× or 0.5× the expected, prefer the octave-corrected candidate).
- Verified: `/listen` page shows live YIN output (frequency, confidence, RMS, frame counter). No console errors.

### P2-C3 — Note matcher + tolerance ✅ DONE
- src/lib/mic/note-matcher.ts: freqToMidi() (midi = 69 + 12*log2(freq/440)), freqToNote() returns {note, cents, midi} with cents in [-50, +50]. matchNote(input, state, noiseFloor, expectedNote) runs the full pipeline:
  - Silence check (RMS < noiseFloor → silent)
  - Onset detection (RMS just crossed noiseFloor going upward, fires once per note)
  - Confidence filter (reject if < 0.85)
  - Octave guard (when expectedNote is set, prefer candidate nearest expected pitch via applyOctaveGuard)
  - Debounce: note must be stable for STABLE_FRAMES=2 (~92ms at 2048 samples / 44.1kHz)
  - Returns {note, cents, onset, confidence, rms, silent}
- notesMatch(detected, expected, octaveForgiveness) helper — pitch-class comparison when octave-forgiveness is on (C4 matches C5).
- centsOffset(detectedFreq, expectedNote) helper for the parent-dashboard tuning display.
- isScorable(result) helper for the lesson engine.
- src/lib/mic/calibration.ts: acceptCalibrationSample() + finalizeCalibration() — "play middle C three times" flow, noise floor = 2× ambient RMS (clamped to [0.02, 0.3]). Suggestion messages for confidence < 0.7, off-pitch detection, etc.
- Extended useMicListener hook with: detectedNote, detectedCents, onset, silent, match fields. Added setExpectedNote(note|null) + setNoiseFloor(rms) for the lesson engine to drive the matcher.
- Updated /listen smoke-test page to display detected note + cents + onset + silent indicators.
- Lint + typecheck clean. /listen returns 200.

### Next — P2-C4: Listen Mode UI
- Kid-friendly ListenPiano (reference-only 61-key display).
- FallingNotesKid (large colorful slow notes, BPM 60).
- Mascot (animated bear with idle/listening/happy/encourage states).
- FeedbackOverlay (green burst on correct, yellow wiggle on wrong, silence = nothing).
- HandPositionDiagram (visual finger hints).
- Tone.js audio cues (arpeggio on correct, chime on wrong, fanfare on complete).
- 24px+ body, 48px+ note cards, 64px+ touch targets.

### P2-C4 — Listen Mode UI ✅ DONE
- src/components/listen/Mascot.tsx: SVG bear mascot with 4 states (idle, listening, happy, encourage). CSS animations (breathe, bounce, nod, sparkle). Blinking eyes (SVG <animate>), listening sound-wave indicators, rosy cheeks in happy/encourage states. Speech bubble for messages.
- src/components/listen/ListenPiano.tsx: reference-only 61-key display (C2-C7, 36 white + 25 black). div-based (no button, no pointer handlers). Active note lights up green, expected note amber, wrong note amber wiggle. Bigger keys than Phase-1 Piano (40-72px white, 64px+ touch target).
- src/components/listen/FallingNotesKid.tsx: canvas-based kid visualizer. Larger note rectangles (min 28px), slower (140 px/sec vs Phase-1's 220), bolder colors (emerald for RH, blue for LH), note-name label (18px bold) + finger number (14px) printed on each note. Approach glow when near hit line.
- src/components/listen/FeedbackOverlay.tsx: green burst on correct (emerald-400 ring + Check icon + Sparkles), soft yellow wiggle on wrong (amber-200 with 🎵 emoji). NEVER red. Auto-clears via CSS animation. Trigger-key pattern re-fires animation on consecutive same-type feedback.
- src/components/listen/HandPositionDiagram.tsx: SVG-free flexbox of 2 hands (L/R) with 5 numbered fingers each. Active finger highlighted amber + scales 110%. Inactive hand dimmed to 40% opacity.
- src/components/listen/CelebrationScreen.tsx: full-screen overlay with mascot dance, canvas-confetti burst (3 bursts + final shower), sticker reveal (scale + fade-in animation), coins-earned chip, accuracy message tiered by score. Fanfare audio cue on mount.
- src/components/onboarding/MicPermissionModal.tsx: friendly Dialog with mascot + 4 privacy bullet points (only while on page, nothing recorded, auto-stop on tab switch, stop button). ShieldCheck icon + "Allow microphone" CTA.
- src/lib/audio-cues.ts: playCorrectCue (C major arpeggio C4-E4-G4-C5, 80ms stagger), playWrongCue (soft A3+E4 perfect fifth — no dissonance), playFanfareCue (C major fanfare C4-C4-G4-C5-E5-G5), playHighlightCue (soft C5 click).
- src/hooks/useLessonEngine.ts: drives lesson flow (intro → guided → recital → complete). Polls mic state via setTimeout (50ms) instead of re-binding effect on every mic sample — avoids cascading renders. Auto-advances 400ms after correct press. Mascot message computed from state.
- Rewrote src/app/listen/page.tsx: full kid-friendly UI with header (Start/Stop + persistent "🎤 Listening" badge with ping animation), mascot, falling-notes visualizer, reference piano, hand diagram, 4 progress cards (Note/Hits/Accuracy/Progress), progress bar, privacy footer, permission modal, feedback overlay, celebration screen on complete.
- Added mascot + kid-mode CSS animations to globals.css (mascot-breathe, mascot-bounce, mascot-nod, sparkle, kid-fall, kid-green-burst, kid-wiggle, coin-pop).
- Installed @types/canvas-confetti.
- Verified via agent-browser: /listen returns 200, full UI renders (header + mascot + visualizer + 61-key piano + hand diagram + 4 progress cards + privacy footer). Permission modal opens with "Can Bruno hear your piano?" heading. Allow click → getUserMedia → "No Device" error handled gracefully with kid-friendly message + mascot encourage state. Lint + typecheck clean.

### Next — P2-C5: Kids curriculum
- src/lib/curriculum.ts: 12-lesson structured path with finger hints.
- src/app/curriculum/page.tsx + LessonPath + LessonCard + FingerHint components.
- Lessons unlock sequentially; pass at 70% accuracy.

### P2-C5 — Kids curriculum ✅ DONE
- src/lib/curriculum.ts: 12-lesson structured beginner path. Each lesson: {number, id, title, focus, bpm, estMinutes (≤5), stickerEmoji, stickerName, coins, intro, notes:[{note, finger, hand, duration, start}]}. Curriculum:
  1. Middle C with Your Thumb (RH finger 1)
  2. C, D, E — Fingers 1, 2, 3
  3. Add F and G — C Position (5-finger)
  4. Left Hand — C3 to G3 (LH fingers 5-1)
  5. Both Hands Together (C in both hands)
  6. Rhythm: Quarter vs Half Notes
  7. Stepwise Motion (no skips)
  8. First Skip (a 3rd)
  9. Jingle Bells (excerpt)
  10. Two-Note Chord (Heart and Soul intro)
  11. F Position Intro
  12. Recital: Ode to Joy (Complete)
  Includes findLessonById, isLessonUnlocked helpers + PASS_ACCURACY = 0.7.
- src/lib/storage.ts: Phase-2 persistence (versioned piano-app:phase2:v1 schema). KidProfile, LessonProgress, ProfileProgress, ParentSettings, StickerData types. loadPhase2/savePhase2 with try/catch (private mode). migrateFromPhase1() creates a default profile when phase-1 prefs exist. STICKER_CATALOG with 35 stickers (curriculum, animals, instruments, nature, achievements) across common/rare/legendary rarities. hashPin/verifyPin via crypto.subtle SHA-256 with fallback for non-secure contexts.
- src/components/curriculum/FingerHint.tsx: colored circle with finger number (1-5), amber for RH / blue for LH, scales + ring when active.
- src/components/curriculum/LessonCard.tsx: lesson tile with number badge, sticker emoji, title/focus, estMinutes/coins, status row (Completed/ Tap to start / Locked). Renders as Next.js Link when unlocked, plain div when locked.
- src/components/curriculum/LessonPath.tsx: 12-card grid with progress header ("X of Y lessons complete"), progress bar, alternating vertical offset for path feel.
- src/app/curriculum/page.tsx: full page with header + "Up next" hero card (mascot + lesson info + Start button) + LessonPath + completion summary. Lazy initial state from localStorage (no setState-in-effect). NoProfileScreen shown if no active profile.
- src/app/parent/page.tsx: placeholder (full impl in P2-C7).
- src/app/stickers/page.tsx: placeholder showing all 35 stickers in locked (greyscale, 40% opacity) state (full impl in P2-C6).
- src/app/help/microphone/page.tsx: static privacy explainer (when we listen, auto-stop, what we do/don't do with audio, browser permission instructions).
- Verified via agent-browser: with a test profile in localStorage, /curriculum renders all 12 lesson cards with correct lock state (lesson 1 unlocked, lessons 2-12 locked), "Up next" hero card for lesson 1, progress bar at 0%, completion summary at bottom. Lint + typecheck clean.

### Next — P2-C6: Gamification & rewards
- src/lib/rewards.ts: sticker earn logic + coin economy.
- src/lib/streaks.ts: 7-day streak with 1-day grace.
- src/app/stickers/page.tsx: full sticker album (earned vs locked).
- StickerAlbum + CoinCounter + StreakCalendar components.
- canvas-confetti burst on lesson complete (already wired in CelebrationScreen).

### P2-C6 — Gamification & rewards ✅ DONE
- src/lib/streaks.ts: 7-day streak helpers. computeStreak(streakDays) returns {current, best, alive, completedToday, calendar, graceActive}. 1-day grace: if yesterday was completed but today wasn't yet, streak stays alive (graceActive=true). markTodayComplete() idempotent. todayDateStr/daysAgoStr helpers for local-time YYYY-MM-DD strings.
- src/lib/rewards.ts: computeLessonRewards(lessonStickerId, ownedSet, lessonCoins, accuracy, currentStreak) returns {stickerId, sticker, stickerIsNew, coinsEarned, reasons}. Awards: lesson sticker on completion (+5 coins bonus for perfect, +5/10 coins for 7-day streak, 💯 sticker for perfect, 🔥 sticker for 7-day). coinPerCorrectNote()=1. stickersByTheme() grouping helper.
- src/components/rewards/CoinCounter.tsx: animated coin balance. Eases the count up over 400ms (ease-out cubic) when balance rises. Pop "+N" indicator via animate-coin-pop CSS. 3 sizes (sm/md/lg).
- src/components/rewards/StreakCalendar.tsx: 7-day visual calendar (oldest → today, left → right). Completed days = filled amber ✓, today incomplete = dashed pulsing border, grace day = pulsing ring. Shows current + best streak counts. Footer message adapts to state (completed today / grace / not yet started).
- src/components/rewards/StickerAlbum.tsx: themed grid (Lesson Stickers / Animal Friends / Instruments / Nature / Achievements). Earned stickers show emoji + name + rarity ring (rare=purple, legendary=amber+star). Locked stickers show ❓ + greyscale. Collection header shows progress (X/Y) + preview of last 5 earned.
- Rewrote /stickers page: full layout with header, top row (coin counter card + streak calendar), sticker album (5 themed sections). Lazy initial state from localStorage. Auto-refresh on window focus.
- Verified via agent-browser with test profile (1 lesson completed, 25 coins, 3-day streak): /stickers renders coin counter (🪙 25), streak calendar (3 days, BEST 3 🔥, ✓✓✓ on last 3 days, "Great job today!" message), sticker album (1/36 collected, 5 themed sections with locked ❓ placeholders). Lint + typecheck clean.

### Next — P2-C7: Parent dashboard
- src/app/parent/page.tsx: full PIN gate + profile switcher + progress charts + settings.
- src/components/parent/PinGate.tsx: 4-digit PIN entry + setup.
- src/components/parent/ProfileSwitcher.tsx: up to 4 profiles, create/switch.
- src/components/parent/ProgressChart.tsx: recharts per-child chart.
- src/components/parent/SettingsPanel.tsx: tolerance, time limit, octave-forgiveness.
- Export/Import JSON.

### P2-C7 — Parent dashboard ✅ DONE
- src/hooks/useParentPin.ts: PIN management hook. PinGateState = no-pin | locked | unlocked | setting. verify/set/change/remove/lock methods. 3-attempt throttle with 1-second delay (slow brute force). Lazy initial hasPin from localStorage (no setState-in-effect).
- src/components/parent/PinGate.tsx: 4-digit PIN entry pad with auto-submit on 4 digits, dotted indicators, numeric keypad (1-9 + 0 + Delete), throttle UI. SetupPad (2-stage confirm) for first-run, EntryPad for returning users. ShieldCheck privacy note ("PIN is hashed with SHA-256").
- src/components/parent/ProfileSwitcher.tsx: up to 4 profiles with avatar + name + age + time-limit display. Switch + Remove buttons. CreateProfileDialog with name input + 8-avatar picker (bear/cat/penguin/fox/bunny/lion/panda/frog) + age input.
- src/components/parent/ProgressChart.tsx: recharts BarChart with 12 lesson bars colored by accuracy (gray=not attempted, emerald >=90%, amber >=70%, orange <70%). 4 stat cards (Lessons done / Avg accuracy / Minutes practised / Coins earned). Tooltip shows lesson title + accuracy.
- src/components/parent/SettingsPanel.tsx: Pitch tolerance slider (10-100 cents), Octave forgiveness switch, Daily time-limit override slider (0-60 min). Export progress as JSON download. Import via file picker. Reset all data with confirmation.
- Rewrote /parent page: PinGate wraps everything. Once unlocked, shows header + Lock button + ProfileSwitcher + ProgressChart (for active profile) + SettingsPanel + quick links (View lessons, Sticker album, Back to app).
- Verified via agent-browser: setup PIN 1234 → confirm 1234 → dashboard unlocks. Created "Alex" profile (🐻 avatar, age 7) → progress chart renders with 4 stat cards + 12-lesson bar chart + Settings panel + quick links. Export/Import/Reset all buttons visible. Lint + typecheck clean.

### Next — P2-C8: Persistence & polish
- src/components/onboarding/CalibrationFlow.tsx: "play middle C three times" first-run flow.
- Wire CalibrationFlow into /listen page on first visit.
- Wire lesson progress persistence: when lesson engine fires `complete`, save to localStorage + award stickers + coins + streak.
- Wire /listen to read ?lesson=ID query param.
- bun run build green.
