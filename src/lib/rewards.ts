// MIT License — Piano Learning App (Phase 2)
// Rewards logic — sticker earn + coin economy helpers.
//
// Stickers are earned by:
//   - Completing a curriculum lesson (1 sticker per lesson).
//   - Hitting streak milestones (7-day streak = 🔥 sticker).
//   - Scoring perfect (💯 sticker).
//
// Coins are earned by:
//   - Each correct note (1 coin).
//   - Completing a lesson (the lesson's `coins` value).
//   - Hitting streak milestones.
//
// Coins can be spent in the sticker shop (P2-C6 /stickers route — to be
// expanded later; for now we just track the balance).

import { STICKER_CATALOG, type StickerData } from "@/lib/storage";
import { todayDateStr } from "@/lib/streaks";

export interface RewardOutcome {
  /** Sticker id earned this round (or null). */
  stickerId: string | null;
  /** Sticker data (if earned). */
  sticker: StickerData | null;
  /** Whether this sticker was newly earned (false = already had it). */
  stickerIsNew: boolean;
  /** Coins earned this round. */
  coinsEarned: number;
  /** Reasons for each reward (for the celebration screen). */
  reasons: string[];
}

/**
 * Compute the rewards for completing a lesson.
 *
 * @param lessonStickerId   The sticker id tied to this lesson (in the
 *                          curriculum definition).
 * @param alreadyOwnedStickers  Set of sticker ids the profile already has.
 * @param lessonCoins      The coins defined in the lesson definition.
 * @param accuracy         Final accuracy 0-100.
 * @param currentStreak    Current streak length (after this lesson).
 * @returns RewardOutcome.
 */
export function computeLessonRewards(
  lessonStickerId: string,
  alreadyOwnedStickers: Set<string>,
  lessonCoins: number,
  accuracy: number,
  currentStreak: number,
): RewardOutcome {
  const reasons: string[] = [];
  let coinsEarned = lessonCoins;
  reasons.push(`Lesson completed (+${lessonCoins} coins)`);

  // Sticker for the lesson.
  let stickerId: string | null = lessonStickerId;
  let stickerIsNew = !alreadyOwnedStickers.has(lessonStickerId);
  if (stickerIsNew) {
    const sticker = STICKER_CATALOG.find((s) => s.id === lessonStickerId);
    if (sticker) {
      reasons.push(`New sticker: ${sticker.name} ${sticker.emoji}`);
    }
  } else {
    // Already had this sticker — don't re-award.
    stickerId = null;
  }

  // Perfect-score bonus.
  if (accuracy >= 95) {
    coinsEarned += 5;
    reasons.push("Perfect score bonus (+5 coins)");
    if (!alreadyOwnedStickers.has("sticker-perfect")) {
      stickerId = "sticker-perfect";
      stickerIsNew = true;
      reasons.push("New sticker: Perfect Score 💯");
    }
  }

  // 7-day streak bonus.
  if (currentStreak >= 7 && !alreadyOwnedStickers.has("sticker-7-day")) {
    stickerId = "sticker-7-day";
    stickerIsNew = true;
    coinsEarned += 10;
    reasons.push("7-day streak bonus (+10 coins, +🔥 sticker)");
  } else if (currentStreak >= 7) {
    coinsEarned += 5;
    reasons.push("7-day streak ongoing (+5 coins)");
  }

  const sticker =
    stickerId !== null
      ? STICKER_CATALOG.find((s) => s.id === stickerId) ?? null
      : null;

  return {
    stickerId,
    sticker,
    stickerIsNew,
    coinsEarned,
    reasons,
  };
}

/**
 * Award coins per correct note (called by the lesson engine on each hit).
 *
 * @returns The coin delta (always 1 for a single correct note).
 */
export function coinPerCorrectNote(): number {
  return 1;
}

/**
 * Group stickers by theme for display in the album.
 */
export function stickersByTheme(): Record<string, StickerData[]> {
  const out: Record<string, StickerData[]> = {};
  for (const s of STICKER_CATALOG) {
    if (!out[s.theme]) out[s.theme] = [];
    out[s.theme].push(s);
  }
  return out;
}

/** Today's ISO date — used for the streak "completed today" check. */
export function todayIsoDate(): string {
  return todayDateStr();
}
