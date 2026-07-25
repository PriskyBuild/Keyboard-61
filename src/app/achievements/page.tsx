// MIT License — Piano Learning App
// Achievements route — shows lifetime milestones (notes played, songs
// completed, streaks, perfect scores) as a grid of badge cards. Earned
// badges glow; locked ones are greyed out.
//
// Reads from Phase 1 stats (piano-app:stats:v1) + Phase 2 storage
// (piano-app:phase2:v1) so it works whether or not the user has set up a
// parent profile.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/listen/Mascot";
import { Button } from "@/components/ui/button";
import { loadStats } from "@/lib/persistence";
import {
  loadPhase2,
  getActiveProfile,
  getProfileProgress,
  type Phase2Storage,
} from "@/lib/storage";
import {
  loadAchievementTimestamps,
  persistNewAchievements,
  formatRelativeTime,
} from "@/lib/achievement-timestamps";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Trophy,
  Flame,
  Target,
  Music,
  Clock,
  Star,
  Award,
  Zap,
  Crown,
  GraduationCap,
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  /** Returns true if earned. */
  isEarned: () => boolean;
  /** Progress 0..1 toward earning (for partial-display). */
  progress: () => number;
  /** Big emoji shown on the badge. */
  emoji: string;
  /** Tone when earned. */
  tone: "amber" | "emerald" | "rose" | "blue";
}

export default function AchievementsPage() {
  const [stats, setStats] = useState(() =>
    typeof window !== "undefined" ? loadStats() : null,
  );
  const [storage, setStorage] = useState<Phase2Storage | null>(() =>
    typeof window !== "undefined" ? loadPhase2() : null,
  );

  // Refresh on focus (in case the user earned something elsewhere).
  useEffect(() => {
    const onFocus = () => {
      setStats(loadStats());
      setStorage(loadPhase2());
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Persist timestamps for newly-earned achievements + load existing ones.
  // Declared before the early return so hooks are always called in order.
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  useEffect(() => {
    // Compute earned IDs from current stats + storage.
    const s = loadStats();
    const st = loadPhase2();
    const ap = getActiveProfile(st);
    const prog = ap ? getProfileProgress(st, ap.id) : null;
    const lessonsDone = prog
      ? Object.values(prog.lessons).filter((l) => l.completed).length
      : 0;
    const stickers = prog?.stickers.length ?? 0;
    const streaks = prog?.streakDays.length ?? 0;
    const perfects = prog
      ? Object.values(prog.lessons).filter((l) => l.bestAccuracy >= 95).length
      : 0;
    const coins = prog?.coins ?? 0;

    const earnedIdSet = new Set<string>();
    if (s.totalNotesPlayed >= 1) earnedIdSet.add("first-note");
    if (s.totalNotesPlayed >= 10) earnedIdSet.add("ten-notes");
    if (s.totalNotesPlayed >= 100) earnedIdSet.add("hundred-notes");
    if (s.totalNotesPlayed >= 1000) earnedIdSet.add("thousand-notes");
    if (s.songsCompleted >= 1) earnedIdSet.add("first-song");
    if (s.songsCompleted >= 5) earnedIdSet.add("five-songs");
    if (lessonsDone >= 1) earnedIdSet.add("first-lesson");
    if (lessonsDone >= 12) earnedIdSet.add("all-lessons");
    if (perfects >= 1) earnedIdSet.add("perfect-score");
    if (streaks >= 3) earnedIdSet.add("streak-3");
    if (streaks >= 7) earnedIdSet.add("streak-7");
    if (s.secondsPlayed >= 600) earnedIdSet.add("ten-minutes");
    if (stickers >= 1) earnedIdSet.add("first-sticker");
    if (stickers >= 10) earnedIdSet.add("ten-stickers");
    if (coins >= 50) earnedIdSet.add("fifty-coins");
    if (coins >= 100) earnedIdSet.add("hundred-coins");

    persistNewAchievements(earnedIdSet);
    // Schedule the timestamp load via setTimeout so setState is async.
    const id = window.setTimeout(() => setTimestamps(loadAchievementTimestamps()), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!stats || !storage) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </main>
    );
  }

  const activeProfile = getActiveProfile(storage);
  const progress = activeProfile
    ? getProfileProgress(storage, activeProfile.id)
    : null;

  const lessonsCompleted = progress
    ? Object.values(progress.lessons).filter((l) => l.completed).length
    : 0;
  const stickersEarned = progress?.stickers.length ?? 0;
  const streakDays = progress?.streakDays.length ?? 0;
  const perfectScores = progress
    ? Object.values(progress.lessons).filter((l) => l.bestAccuracy >= 95).length
    : 0;
  const coins = progress?.coins ?? 0;

  const achievements: Achievement[] = [
    {
      id: "first-note",
      title: "First Note",
      description: "Play your first note in Free Play",
      icon: Music,
      isEarned: () => stats.totalNotesPlayed >= 1,
      progress: () => Math.min(1, stats.totalNotesPlayed / 1),
      emoji: "🎵",
      tone: "amber",
    },
    {
      id: "ten-notes",
      title: "Getting Started",
      description: "Play 10 notes total",
      icon: Zap,
      isEarned: () => stats.totalNotesPlayed >= 10,
      progress: () => Math.min(1, stats.totalNotesPlayed / 10),
      emoji: "⚡",
      tone: "amber",
    },
    {
      id: "hundred-notes",
      title: "Century",
      description: "Play 100 notes total",
      icon: Target,
      isEarned: () => stats.totalNotesPlayed >= 100,
      progress: () => Math.min(1, stats.totalNotesPlayed / 100),
      emoji: "💯",
      tone: "emerald",
    },
    {
      id: "thousand-notes",
      title: "Note Master",
      description: "Play 1,000 notes total",
      icon: Crown,
      isEarned: () => stats.totalNotesPlayed >= 1000,
      progress: () => Math.min(1, stats.totalNotesPlayed / 1000),
      emoji: "👑",
      tone: "rose",
    },
    {
      id: "first-song",
      title: "First Recital",
      description: "Complete your first song",
      icon: Trophy,
      isEarned: () => stats.songsCompleted >= 1,
      progress: () => Math.min(1, stats.songsCompleted / 1),
      emoji: "🏆",
      tone: "amber",
    },
    {
      id: "five-songs",
      title: "Concert Pianist",
      description: "Complete 5 songs",
      icon: Trophy,
      isEarned: () => stats.songsCompleted >= 5,
      progress: () => Math.min(1, stats.songsCompleted / 5),
      emoji: "🎤",
      tone: "emerald",
    },
    {
      id: "first-lesson",
      title: "Lesson Learned",
      description: "Complete your first curriculum lesson",
      icon: GraduationCap,
      isEarned: () => lessonsCompleted >= 1,
      progress: () => Math.min(1, lessonsCompleted / 1),
      emoji: "📚",
      tone: "amber",
    },
    {
      id: "all-lessons",
      title: "Curriculum Complete",
      description: "Complete all 12 lessons",
      icon: Crown,
      isEarned: () => lessonsCompleted >= 12,
      progress: () => Math.min(1, lessonsCompleted / 12),
      emoji: "🎓",
      tone: "rose",
    },
    {
      id: "perfect-score",
      title: "Perfectionist",
      description: "Score 95%+ on any lesson",
      icon: Star,
      isEarned: () => perfectScores >= 1,
      progress: () => Math.min(1, perfectScores / 1),
      emoji: "⭐",
      tone: "amber",
    },
    {
      id: "streak-3",
      title: "On a Roll",
      description: "Practise 3 days in a row",
      icon: Flame,
      isEarned: () => streakDays >= 3,
      progress: () => Math.min(1, streakDays / 3),
      emoji: "🔥",
      tone: "rose",
    },
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Practise 7 days in a row",
      icon: Flame,
      isEarned: () => streakDays >= 7,
      progress: () => Math.min(1, streakDays / 7),
      emoji: "🔥",
      tone: "rose",
    },
    {
      id: "ten-minutes",
      title: "Dedicated",
      description: "Practise for 10 minutes total",
      icon: Clock,
      isEarned: () => stats.secondsPlayed >= 600,
      progress: () => Math.min(1, stats.secondsPlayed / 600),
      emoji: "⏰",
      tone: "blue",
    },
    {
      id: "first-sticker",
      title: "Sticker Collector",
      description: "Earn your first sticker",
      icon: Award,
      isEarned: () => stickersEarned >= 1,
      progress: () => Math.min(1, stickersEarned / 1),
      emoji: "🌟",
      tone: "amber",
    },
    {
      id: "ten-stickers",
      title: "Sticker Hoarder",
      description: "Collect 10 stickers",
      icon: Award,
      isEarned: () => stickersEarned >= 10,
      progress: () => Math.min(1, stickersEarned / 10),
      emoji: "✨",
      tone: "emerald",
    },
    {
      id: "fifty-coins",
      title: "Coin Saver",
      description: "Earn 50 coins",
      icon: Trophy,
      isEarned: () => coins >= 50,
      progress: () => Math.min(1, coins / 50),
      emoji: "🪙",
      tone: "amber",
    },
    {
      id: "hundred-coins",
      title: "Coin Magnate",
      description: "Earn 100 coins",
      icon: Crown,
      isEarned: () => coins >= 100,
      progress: () => Math.min(1, coins / 100),
      emoji: "💰",
      tone: "rose",
    },
  ];

  const earned = achievements.filter((a) => a.isEarned());
  const total = achievements.length;
  const percentEarned = Math.round((earned.length / total) * 100);

  // Build the "Recently earned" feed — sorted by timestamp desc, top 5.
  const recentFeed = earned
    .map((a) => ({
      ...a,
      earnedAt: timestamps[a.id] ?? null,
    }))
    .filter((a) => a.earnedAt !== null)
    .sort((a, b) =>
      (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""),
    )
    .slice(0, 5);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Achievements</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Earn badges by playing and practising!
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </header>

      {/* Hero summary card */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-center dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900 sm:flex-row sm:text-left">
        <Mascot state={earned.length >= 5 ? "happy" : "idle"} size={100} />
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            <Trophy className="h-3 w-3" />
            {earned.length} of {total} badges earned
          </div>
          <h2 className="mt-2 text-xl font-bold">
            {percentEarned >= 75
              ? "Piano Master! 🎹"
              : percentEarned >= 50
                ? "You're doing great! 🎶"
                : percentEarned >= 25
                  ? "Keep practising! 🎵"
                  : "Just getting started! 🌟"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {earned.length === 0
              ? "Play notes, complete lessons, and build streaks to earn badges."
              : `${earned.length} badge${earned.length === 1 ? "" : "s"} unlocked so far. Keep going!`}
          </p>
        </div>
        <div className="w-full sm:w-32">
          <div className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {percentEarned}%
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Complete
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-700 progress-shimmer"
              style={{ width: `${percentEarned}%` }}
            />
          </div>
        </div>
      </section>

      {/* Lifetime stats summary */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Music className="h-4 w-4" />} label="Notes played" value={stats.totalNotesPlayed.toLocaleString()} tone="amber" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Songs completed" value={`${stats.songsCompleted}`} tone="emerald" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Minutes played" value={`${Math.round(stats.secondsPlayed / 60)}`} tone="slate" />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Streak days" value={`${streakDays}`} tone="rose" />
      </section>

      {/* Recently earned feed */}
      {recentFeed.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recently earned
          </h2>
          <div className="flex flex-col gap-2">
            {recentFeed.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-3 dark:border-amber-500/20 dark:from-amber-500/5 dark:to-slate-900"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xl text-white shadow">
                    {a.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {a.title}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {a.description}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      <Icon className="h-2.5 w-2.5" />
                      {formatRelativeTime(a.earnedAt!)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Badges grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          All badges
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((a) => {
            const earnedBadge = a.isEarned();
            const Icon = a.icon;
            const toneClasses: Record<typeof a.tone, string> = {
              amber: "from-amber-400 to-orange-500 text-amber-600 dark:text-amber-400",
              emerald: "from-emerald-400 to-teal-500 text-emerald-600 dark:text-emerald-400",
              rose: "from-rose-400 to-pink-500 text-rose-600 dark:text-rose-400",
              blue: "from-blue-400 to-indigo-500 text-blue-600 dark:text-blue-400",
            };
            const [gradientPart, textPart] = toneClasses[a.tone].split(" text-");
            return (
              <div
                key={a.id}
                className={cn(
                  "relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-4 text-center transition-all",
                  earnedBadge
                    ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-sm dark:border-amber-500/40 dark:from-amber-500/10 dark:to-slate-900"
                    : "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50",
                )}
              >
                {/* Badge icon */}
                <div
                  className={cn(
                    "grid h-16 w-16 place-items-center rounded-full text-3xl shadow-md transition-transform",
                    earnedBadge
                      ? `bg-gradient-to-br ${gradientPart} text-white animate-badge-pop`
                      : "bg-slate-200 grayscale dark:bg-slate-700",
                    earnedBadge && "hover:scale-110",
                  )}
                >
                  {earnedBadge ? a.emoji : "🔒"}
                </div>
                <div className="min-w-0">
                  <div className={cn("text-sm font-semibold", earnedBadge && textPart && `text-${textPart}`)}>
                    {a.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.description}
                  </div>
                </div>
                {/* Progress bar (only for locked badges) */}
                {!earnedBadge ? (
                  <div className="mt-1 w-full">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-slate-400 transition-[width] duration-500"
                        style={{ width: `${Math.round(a.progress() * 100)}%` }}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {Math.round(a.progress() * 100)}% there
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    <Icon className="h-2.5 w-2.5" />
                    Earned
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col items-center gap-3">
        <p className="text-center text-xs text-muted-foreground">
          Keep practising to unlock more badges!
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={async () => {
            const text = `🎹 Piano Learning App — My Progress\n\n` +
              `🏆 ${earned.length}/${total} badges earned (${percentEarned}%)\n` +
              `🎵 ${stats.totalNotesPlayed.toLocaleString()} notes played\n` +
              `🎶 ${stats.songsCompleted} songs completed\n` +
              `⏱ ${Math.round(stats.secondsPlayed / 60)} minutes practised\n` +
              `🔥 ${streakDays} streak days\n` +
              `🪙 ${progress?.coins ?? 0} coins\n\n` +
              `Play at: https://piano-learn.vercel.app`;
            const btn = document.activeElement as HTMLButtonElement;
            const orig = btn?.textContent ?? "";
            const showConfirm = (msg: string) => {
              if (btn) {
                btn.textContent = msg;
                window.setTimeout(() => {
                  btn.textContent = orig;
                }, 1500);
              }
            };
            // Try Web Share API first (mobile-friendly native sheet).
            if (typeof navigator !== "undefined" && navigator.share) {
              try {
                await navigator.share({
                  title: "My Piano Progress",
                  text,
                });
              } catch {
                /* user cancelled — no action needed */
              }
            } else {
              // Fallback: copy to clipboard.
              try {
                await navigator.clipboard.writeText(text);
                showConfirm("✓ Copied!");
              } catch {
                showConfirm("✗ Copy failed");
              }
            }
          }}
        >
          <Trophy className="h-3.5 w-3.5" />
          Share progress
        </Button>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "amber" | "emerald" | "rose" | "slate";
}) {
  const toneClasses: Record<typeof tone, string> = {
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    slate: "text-slate-600 dark:text-slate-400",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className={cn("mb-1 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wide", toneClasses[tone])}>
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

// Local import to avoid top-level dependency cycle.
