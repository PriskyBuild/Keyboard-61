// MIT License — Piano Learning App (Phase 2)
// /parent route — PIN-locked parent dashboard. (Full implementation in P2-C7.)
//
// For P2-C5 this is a placeholder so the /curriculum NoProfileScreen link
// works. P2-C7 will add: PIN gate, profile switcher, progress charts,
// settings panel, export/import.

"use client";

import Link from "next/link";
import { Mascot } from "@/components/listen/Mascot";
import { Button } from "@/components/ui/button";

export default function ParentPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center">
      <Mascot state="idle" size={120} message="Parent zone coming soon!" />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Parent Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The full parent dashboard (PIN gate, profile switcher, progress
          charts, settings) is added in checkpoint P2-C7. For now, you can
          use the curriculum page to start a default profile.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/curriculum">View lessons</Link>
        </Button>
        <Button asChild>
          <Link href="/listen">Listen Mode</Link>
        </Button>
      </div>
    </main>
  );
}
