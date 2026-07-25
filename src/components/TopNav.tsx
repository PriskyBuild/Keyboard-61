// MIT License — Piano Learning App (Phase 2)
// Top navigation — lets users jump between Phase 1 (Play) and Phase 2
// routes (Listen, Curriculum, Stickers, Parent). Always visible (including
// on the home route) so users can discover Phase 2 from anywhere.
//
// On the home route we render a more compact version to avoid stacking
// with AppShell's own header.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music2, Ear, GraduationCap, Trophy, Lock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Music2;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Play", icon: Music2 },
  { href: "/listen", label: "Listen", icon: Ear },
  { href: "/curriculum", label: "Lessons", icon: GraduationCap },
  { href: "/stickers", label: "Stickers", icon: Trophy },
  { href: "/achievements", label: "Awards", icon: Award },
  { href: "/parent", label: "Parent", icon: Lock },
];

export function TopNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // On the home route, render a compact pill-nav (icon-only on mobile,
  // icon+label on desktop) so it sits nicely under AppShell's header.
  // On other routes, render the full nav with the brand logo.

  if (isHome) {
    return (
      <nav
        aria-label="Phase 2 navigation"
        className="z-20 border-b border-slate-200/60 bg-slate-50/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-1.5 sm:px-6">
          <span className="mr-1 hidden text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
            Explore:
          </span>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                title={label}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-amber-100 hover:text-amber-700 dark:text-slate-300 dark:hover:bg-amber-500/20 dark:hover:text-amber-300",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <span className="ml-auto hidden text-[10px] text-muted-foreground sm:inline">
            Press <kbd className="rounded bg-slate-200 px-1 font-mono dark:bg-slate-800">⌘K</kbd> for commands
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6">
        <Link
          href="/"
          className="mr-2 flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
            <Music2 className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Piano</span>
        </Link>
        {NAV_ITEMS.slice(1).map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
