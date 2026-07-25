// MIT License — Piano Learning App (Phase 2)
// /stickers route — full sticker album + coin counter + streak calendar.
//
// Reads the active profile's earned stickers, coins, and streak from
// localStorage. If no profile exists, shows a friendly prompt to set one up.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StickerAlbum } from "@/components/rewards/StickerAlbum";
import { CoinCounter } from "@/components/rewards/CoinCounter";
import { StreakCalendar } from "@/components/rewards/StreakCalendar";
import { Mascot } from "@/components/listen/Mascot";
import { Button } from "@/components/ui/button";
import {
  getActiveProfile,
  getProfileProgress,
  loadPhase2,
  type Phase2Storage,
} from "@/lib/storage";
import { computeStreak } from "@/lib/streaks";
import { ArrowLeft } from "lucide-react";

export default function StickersPage() {
  const [storage, setStorage] = useState<Phase2Storage | null>(() => {
    if (typeof window === "undefined") return null;
    return loadPhase2();
  });

  // Refresh when the tab regains focus (in case the kid earned a sticker elsewhere).
  useEffect(() => {
    const onFocus = () => setStorage(loadPhase2());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!storage) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </main>
    );
  }

  const profile = getActiveProfile(storage);
  if (!profile) {
    return <NoProfileScreen />;
  }

  const progress = getProfileProgress(storage, profile.id);
  const earnedStickerIds = new Set(progress.stickers);
  const streak = computeStreak(progress.streakDays);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Sticker Album</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Collect stickers by completing lessons and hitting streaks!
          </p>
        </div>
        <Link
          href="/curriculum"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Lessons
        </Link>
      </header>

      {/* Top row: coin counter + streak calendar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-4 dark:border-yellow-500/30 dark:from-yellow-500/10 dark:to-slate-900">
          <div className="text-xs font-medium uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
            Coins
          </div>
          <CoinCounter coins={progress.coins} size="lg" />
          <p className="text-center text-[10px] text-muted-foreground">
            Earn 1 coin per correct note + lesson bonuses
          </p>
        </div>
        <div className="sm:col-span-2">
          <StreakCalendar streak={streak} />
        </div>
      </div>

      {/* Sticker album */}
      <StickerAlbum earnedStickerIds={earnedStickerIds} />

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Complete lessons in the curriculum to earn more stickers!
      </p>
    </main>
  );
}

function NoProfileScreen() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <Mascot state="idle" size={120} message="No profile yet!" />
      <div>
        <h1 className="text-2xl font-bold">Sticker Album</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask a grown-up to set up your profile in the Parent dashboard.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/parent">Set up profile</Link>
      </Button>
    </main>
  );
}
