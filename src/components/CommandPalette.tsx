// MIT License — Piano Learning App
// Command palette — quick-access Cmd+K (or Ctrl+K) overlay for jumping
// between routes + toggling common features. Uses the existing cmdk lib.
//
// Includes:
//   - Route navigation (Play, Listen, Lessons, Stickers, Parent)
//   - Toggle Free Play / Learning mode
//   - Toggle theme (light/dark/system)
//   - Toggle note names / key hints / sustain
//   - Open Help / Stats
//
// Triggered by Cmd+K / Ctrl+K or the "/" key.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePianoStore } from "@/lib/store";
import { SONGS } from "@/lib/songs";
import { CURRICULUM } from "@/lib/curriculum";
import { useTheme } from "next-themes";
import {
  Music2,
  Ear,
  GraduationCap,
  Trophy,
  Lock,
  Sun,
  Moon,
  Monitor,
  Tag,
  Keyboard,
  Footprints,
  HelpCircle,
  BarChart3,
  Sparkles,
  Award,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const setMode = usePianoStore((s) => s.setMode);
  const setCurrentSong = usePianoStore((s) => s.setCurrentSong);
  const toggleNoteNames = usePianoStore((s) => s.toggleNoteNames);
  const toggleKeyHints = usePianoStore((s) => s.toggleKeyHints);
  const toggleSustain = usePianoStore((s) => s.toggleSustain);
  const { setTheme } = useTheme();

  // Cmd+K / Ctrl+K / "/" to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Only trigger "/" when not focused in a form field.
        const t = e.target as HTMLElement | null;
        if (
          !t ||
          (t.tagName !== "INPUT" &&
            t.tagName !== "TEXTAREA" &&
            !t.isContentEditable)
        ) {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem
            onSelect={() => go("/")}
            className="gap-2"
          >
            <Music2 className="h-4 w-4 text-amber-500" />
            <span>Play (home)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => go("/listen")}
            className="gap-2"
          >
            <Ear className="h-4 w-4 text-amber-500" />
            <span>Listen Mode (mic)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => go("/curriculum")}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4 text-amber-500" />
            <span>Lessons</span>
          </CommandItem>
          <CommandItem
            onSelect={() => go("/stickers")}
            className="gap-2"
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>Sticker Album</span>
          </CommandItem>
          <CommandItem
            onSelect={() => go("/parent")}
            className="gap-2"
          >
            <Lock className="h-4 w-4 text-amber-500" />
            <span>Parent Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => go("/achievements")}
            className="gap-2"
          >
            <Award className="h-4 w-4 text-amber-500" />
            <span>Achievements</span>
          </CommandItem>
          <CommandItem
            onSelect={() => go("/help/microphone")}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4 text-amber-500" />
            <span>Microphone Privacy Help</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Modes">
          <CommandItem
            onSelect={() => {
              setMode("free");
              setOpen(false);
            }}
            className="gap-2"
          >
            <Music2 className="h-4 w-4 text-emerald-500" />
            <span>Switch to Free Play</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setMode("learn");
              setOpen(false);
            }}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4 text-emerald-500" />
            <span>Switch to Learning Mode</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jump to song (Learning Mode)">
          {SONGS.map((song) => (
            <CommandItem
              key={song.id}
              onSelect={() => {
                setMode("learn");
                setCurrentSong(song);
                setOpen(false);
                router.push("/");
              }}
              className="gap-2"
            >
              <Music2 className="h-4 w-4 text-amber-500" />
              <span className="flex-1 truncate">{song.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {song.bpm} BPM
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jump to lesson (Listen Mode)">
          {CURRICULUM.map((lesson) => (
            <CommandItem
              key={lesson.id}
              onSelect={() => {
                setOpen(false);
                router.push(`/listen?lesson=${lesson.id}`);
              }}
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4 text-emerald-500" />
              <span className="flex-1 truncate">
                L{lesson.number}: {lesson.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {lesson.stickerEmoji}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Toggles">
          <CommandItem
            onSelect={() => {
              toggleNoteNames();
              setOpen(false);
            }}
            className="gap-2"
          >
            <Tag className="h-4 w-4 text-blue-500" />
            <span>Toggle note names on keys</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              toggleKeyHints();
              setOpen(false);
            }}
            className="gap-2"
          >
            <Keyboard className="h-4 w-4 text-blue-500" />
            <span>Toggle keyboard hints</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              toggleSustain();
              setOpen(false);
            }}
            className="gap-2"
          >
            <Footprints className="h-4 w-4 text-blue-500" />
            <span>Toggle sustain pedal</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => {
              setTheme("light");
              setOpen(false);
            }}
            className="gap-2"
          >
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Switch to Light theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("dark");
              setOpen(false);
            }}
            className="gap-2"
          >
            <Moon className="h-4 w-4 text-amber-500" />
            <span>Switch to Dark theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("system");
              setOpen(false);
            }}
            className="gap-2"
          >
            <Monitor className="h-4 w-4 text-amber-500" />
            <span>Follow system theme</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Help">
          <CommandItem
            onSelect={() => go("/help/microphone")}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span>Open microphone privacy help</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Small badge that hints at the Cmd+K shortcut. */
export function CommandPaletteHint() {
  return (
    <span className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex dark:border-slate-800 dark:bg-slate-900">
      <Sparkles className="h-3 w-3 text-amber-500" />
      <kbd className="font-mono">⌘K</kbd>
    </span>
  );
}
