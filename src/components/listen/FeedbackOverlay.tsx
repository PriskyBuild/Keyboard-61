// MIT License — Piano Learning App (Phase 2)
// Feedback overlay — shows a transient green burst on correct, a soft yellow
// "try again" wiggle on wrong, and nothing on silence. NEVER red.
//
// This component is purely visual; the lesson engine drives it via the
// `feedback` prop. It auto-clears via CSS animation duration.

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles } from "lucide-react";

export type KidFeedback = "correct" | "wrong" | null;

export interface FeedbackOverlayProps {
  feedback: KidFeedback;
  /** Optional message to show under the icon. */
  message?: string | null;
  /** A unique counter that increments each time feedback fires — used to
   *  re-trigger the CSS animation even if the same feedback type repeats. */
  triggerKey?: number;
}

export function FeedbackOverlay({
  feedback,
  message,
  triggerKey = 0,
}: FeedbackOverlayProps) {
  // Track which (triggerKey, feedback) pair we've last "consumed". When the
  // triggerKey changes, we sync our local visible state to the new feedback
  // — this re-fires the CSS animation. (Adjust-state-during-render pattern,
  // avoids the setState-in-effect lint.)
  const [consumedKey, setConsumedKey] = useState<number>(-1);
  const [visible, setVisible] = useState<KidFeedback>(null);

  if (consumedKey !== triggerKey && feedback !== null) {
    setConsumedKey(triggerKey);
    setVisible(feedback);
  }

  // Auto-clear after the animation duration. The setTimeout callback fires
  // asynchronously (not during render), so this is OK per the lint rule.
  const clearTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (visible === null) return;
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = window.setTimeout(
      () => setVisible(null),
      visible === "correct" ? 1200 : 900,
    );
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [visible, triggerKey]);

  if (visible === null) return null;

  if (visible === "correct") {
    return (
      <div
        key={`correct-${triggerKey}`}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        aria-live="polite"
      >
        <div className="animate-green-burst flex flex-col items-center gap-3 rounded-3xl bg-emerald-400/90 px-12 py-8 shadow-2xl ring-4 ring-emerald-200">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-lg">
            <Check className="h-12 w-12 text-emerald-500" strokeWidth={3} />
          </div>
          {message ? (
            <p className="text-center text-xl font-bold text-white drop-shadow">
              {message}
            </p>
          ) : null}
          <Sparkles className="h-6 w-6 text-amber-200" />
        </div>
      </div>
    );
  }

  // Wrong: soft yellow wiggle, friendly message
  return (
    <div
      key={`wrong-${triggerKey}`}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      aria-live="polite"
    >
      <div className="animate-wiggle flex flex-col items-center gap-2 rounded-2xl bg-amber-200/95 px-8 py-5 shadow-xl ring-4 ring-amber-300">
        <span className="text-3xl">🎵</span>
        {message ? (
          <p className="text-center text-lg font-semibold text-amber-900">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
