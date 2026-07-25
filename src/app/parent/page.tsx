// MIT License — Piano Learning App (Phase 2)
// /parent route — PIN-locked parent dashboard with:
//   - PIN gate (4-digit, SHA-256 hashed)
//   - Multi-child profile switcher (up to 4)
//   - Per-child progress chart (recharts)
//   - Settings panel (tolerance, octave-forgiveness, time limit, export/import)
//
// The whole dashboard is gated behind <PinGate>. Once unlocked, the parent
// sees the ProfileSwitcher + ProgressChart + SettingsPanel.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PinGate } from "@/components/parent/PinGate";
import { ProfileSwitcher } from "@/components/parent/ProfileSwitcher";
import { ProgressChart } from "@/components/parent/ProgressChart";
import { SettingsPanel } from "@/components/parent/SettingsPanel";
import { useParentPin } from "@/hooks/useParentPin";
import {
  getActiveProfile,
  getProfileProgress,
  loadPhase2,
  migrateFromPhase1,
  type Phase2Storage,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft, BookOpen, Trophy } from "lucide-react";

export default function ParentPage() {
  const pin = useParentPin();
  const [storage, setStorage] = useState<Phase2Storage | null>(() => {
    if (typeof window === "undefined") return null;
    migrateFromPhase1();
    return loadPhase2();
  });

  // Refresh when the tab regains focus (in case the kid earned a sticker).
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

  // PIN gate first.
  return (
    <PinGate pin={pin}>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Lock className="h-6 w-6 text-amber-500" />
              Parent Dashboard
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Manage profiles, view progress, and adjust settings.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={pin.lock}>
            Lock
          </Button>
        </header>

        <ProfileSwitcher storage={storage} onStorageChange={setStorage} />

        {/* Progress chart for the active profile */}
        {storage.activeProfileId ? (
          (() => {
            const profile = getActiveProfile(storage);
            if (!profile) return null;
            const progress = getProfileProgress(storage, profile.id);
            return (
              <ProgressChart
                progress={progress}
                profileName={profile.name}
              />
            );
          })()
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/50">
            No active profile. Create one above to start tracking progress.
          </div>
        )}

        <SettingsPanel storage={storage} onStorageChange={setStorage} />

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/curriculum">
              <BookOpen className="h-3.5 w-3.5" />
              View lessons
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/stickers">
              <Trophy className="h-3.5 w-3.5" />
              Sticker album
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to app
            </Link>
          </Button>
        </div>
      </main>
    </PinGate>
  );
}
