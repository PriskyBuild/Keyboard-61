// MIT License — Piano Learning App (Phase 2)
// Mic permission modal — friendly explanation shown BEFORE calling
// getUserMedia. The mascot explains why we need the mic and what we do (and
// don't do) with the audio.
//
// Privacy is paramount here: we explicitly state that no recording happens,
// no upload happens, and the mic stops automatically on tab blur.

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/listen/Mascot";
import { ShieldCheck, Mic, X } from "lucide-react";

export interface MicPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user clicks "Allow microphone". */
  onAllow: () => void;
}

export function MicPermissionModal({
  open,
  onOpenChange,
  onAllow,
}: MicPermissionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mic className="h-5 w-5 text-amber-500" />
            Can Bruno hear your piano?
          </DialogTitle>
          <DialogDescription>
            Bruno the bear wants to listen to you play your real piano and
            cheer you on. Here&apos;s what that means:
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <Mascot state="listening" size={100} message="Hi! I'm Bruno!" />
        </div>

        <ul className="space-y-2 text-sm">
          <PrivacyRow>
            We use your microphone <strong>only while you&apos;re on this page</strong>{" "}
            to hear the notes you play.
          </PrivacyRow>
          <PrivacyRow>
            <strong>Nothing is recorded</strong> and{" "}
            <strong>nothing is uploaded</strong>. The audio stays in your
            browser&apos;s memory.
          </PrivacyRow>
          <PrivacyRow>
            The mic <strong>stops automatically</strong> when you switch tabs
            or close the page.
          </PrivacyRow>
          <PrivacyRow>
            You can turn it off anytime by tapping the <strong>Stop</strong>{" "}
            button.
          </PrivacyRow>
        </ul>

        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your browser will also show its own permission popup. Tap{" "}
            <strong>Allow</strong> so Bruno can hear you.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" /> Not now
          </Button>
          <Button onClick={onAllow} className="gap-2">
            <Mic className="h-4 w-4" /> Allow microphone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrivacyRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
      <span className="text-sm text-foreground/90">{children}</span>
    </li>
  );
}
