// MIT License — Piano Learning App (Phase 2)
// Profile switcher — manage up to 4 kid profiles. Create, switch, delete.

"use client";

import { useState } from "react";
import {
  
  savePhase2,
  type KidProfile,
  type Phase2Storage,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, Check, User } from "lucide-react";

const AVATAR_OPTIONS = ["🐻", "🐱", "🐧", "🦊", "🐰", "🦁", "🐼", "🐸"];

export interface ProfileSwitcherProps {
  storage: Phase2Storage;
  onStorageChange: (s: Phase2Storage) => void;
}

export function ProfileSwitcher({
  storage,
  onStorageChange,
}: ProfileSwitcherProps) {
  const [showCreate, setShowCreate] = useState(false);
  const maxProfiles = 4;
  const canAddMore = storage.profiles.length < maxProfiles;

  const switchTo = (id: string) => {
    const next = { ...storage, activeProfileId: id };
    if (savePhase2(next)) onStorageChange(next);
  };

  const remove = (id: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Remove this profile and all its progress?")
    ) {
      return;
    }
    const next: Phase2Storage = {
      ...storage,
      profiles: storage.profiles.filter((p) => p.id !== id),
      activeProfileId:
        storage.activeProfileId === id
          ? (storage.profiles.find((p) => p.id !== id)?.id ?? null)
          : storage.activeProfileId,
      progress: { ...storage.progress },
    };
    delete next.progress[id];
    if (savePhase2(next)) onStorageChange(next);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <User className="h-4 w-4 text-amber-500" />
            Kid profiles
          </h2>
          <p className="text-xs text-muted-foreground">
            {storage.profiles.length} of {maxProfiles} used
          </p>
        </div>
        {canAddMore ? (
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add profile
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {storage.profiles.map((p) => (
          <ProfileCard
            key={p.id}
            profile={p}
            active={p.id === storage.activeProfileId}
            onSelect={() => switchTo(p.id)}
            onRemove={() => remove(p.id)}
          />
        ))}
      </div>

      <CreateProfileDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={(name, avatar, age) => {
          const newProfile: KidProfile = {
            id: `profile-${Date.now()}`,
            name,
            avatar,
            age,
            difficulty: "easy",
            timeLimitMin: 15,
            createdAt: new Date().toISOString(),
          };
          const next: Phase2Storage = {
            ...storage,
            profiles: [...storage.profiles, newProfile],
            activeProfileId: storage.activeProfileId ?? newProfile.id,
            progress: {
              ...storage.progress,
              [newProfile.id]: {
                lessons: {},
                stickers: [],
                coins: 0,
                minutesPractised: 0,
                streakDays: [],
                lastSessionDate: null,
                minutesUsedToday: 0,
              },
            },
          };
          if (savePhase2(next)) onStorageChange(next);
          setShowCreate(false);
        }}
      />
    </section>
  );
}

function ProfileCard({
  profile,
  active,
  onSelect,
  onRemove,
}: {
  profile: KidProfile;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition",
        active
          ? "border-amber-400 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
          : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50",
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-2xl shadow dark:bg-slate-900">
        {profile.avatar}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold">{profile.name}</span>
          {active ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/30 dark:text-amber-200">
              <Check className="h-2.5 w-2.5" />
              Active
            </span>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground">
          Age {profile.age} · {profile.timeLimitMin} min/day
        </div>
      </div>
      {!active ? (
        <Button size="sm" variant="outline" onClick={onSelect}>
          Switch
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
        aria-label={`Remove ${profile.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CreateProfileDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, avatar: string, age: number) => void;
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [age, setAge] = useState(7);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), avatar, age);
    setName("");
    setAvatar(AVATAR_OPTIONS[0]);
    setAge(7);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-4 p-6">
        <DialogHeader>
          <DialogTitle>Add a kid profile</DialogTitle>
          <DialogDescription>
            Up to 4 profiles can share this device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="kid-name" className="mb-1.5 block text-xs">
              Name
            </Label>
            <Input
              id="kid-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={20}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Avatar</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg border text-2xl transition",
                    avatar === a
                      ? "border-amber-400 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="kid-age" className="mb-1.5 block text-xs">
              Age
            </Label>
            <Input
              id="kid-age"
              type="number"
              min={3}
              max={12}
              value={age}
              onChange={(e) => setAge(Math.max(3, Math.min(12, Number(e.target.value))))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
