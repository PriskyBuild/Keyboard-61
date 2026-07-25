// MIT License — Piano Learning App (Phase 2)
// PIN gate — 4-digit PIN entry pad. Used to gate the parent dashboard.
//
// Shows different UIs depending on whether a PIN is set:
//   - no-pin: "Set up a PIN" with confirm field
//   - locked: numeric keypad entry
//   - unlocked: nothing (the dashboard is rendered)
//
// Adds a 1-second throttle on failed attempts (handled in useParentPin).

"use client";

import { useEffect, useState } from "react";
import { useParentPin } from "@/hooks/useParentPin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lock, ShieldCheck, Delete, AlertCircle } from "lucide-react";

export interface PinGateProps {
  pin: ReturnType<typeof useParentPin>;
  /** Called once the gate is unlocked (or no PIN was set, so set one). */
  onUnlocked?: () => void;
  children: React.ReactNode;
}

export function PinGate({ pin, onUnlocked, children }: PinGateProps) {
  // When unlocked, render the children (the actual dashboard).
  if (pin.state.status === "unlocked") {
    return <>{children}</>;
  }

  // Otherwise render the appropriate gate.
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
        <Lock className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">
          {pin.state.status === "no-pin" ? "Set up a PIN" : "Parent PIN"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pin.state.status === "no-pin"
            ? "Pick a 4-digit PIN so only grown-ups can see the dashboard."
            : "Enter your 4-digit PIN to continue."}
        </p>
      </div>

      {pin.state.status === "no-pin" ? (
        <SetupPad onSet={async (pin2) => {
          await pin.set(pin2);
          onUnlocked?.();
        }} />
      ) : (
        <EntryPad
          onVerify={async (p) => {
            const ok = await pin.verify(p);
            if (ok) onUnlocked?.();
            return ok;
          }}
          failedAttempts={pin.failedAttempts}
          throttled={pin.throttled}
        />
      )}
    </main>
  );
}

function SetupPad({ onSet }: { onSet: (pin: string) => Promise<void> }) {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [stage, setStage] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);

  const submit = async (pin: string) => {
    if (stage === 1) {
      setFirst(pin);
      setStage(2);
      return;
    }
    if (pin !== first) {
      setError("PINs don't match. Try again.");
      setSecond("");
      setStage(1);
      setFirst("");
      return;
    }
    await onSet(pin);
  };

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <p className="text-sm font-medium">
        {stage === 1 ? "Enter a 4-digit PIN" : "Enter it again to confirm"}
      </p>
      <PinDots
        value={stage === 1 ? first : second}
        onChange={stage === 1 ? setFirst : setSecond}
        onSubmit={submit}
      />
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ) : null}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        The PIN is hashed with SHA-256 — we never store the digits.
      </p>
    </div>
  );
}

function EntryPad({
  onVerify,
  failedAttempts,
  throttled,
}: {
  onVerify: (pin: string) => Promise<boolean>;
  failedAttempts: number;
  throttled: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (pin: string) => {
    if (throttled) return;
    setError(null);
    const ok = await onVerify(pin);
    if (!ok) {
      setError(
        failedAttempts >= 2
          ? "That's not right. Please wait a moment before trying again."
          : "That's not right. Try again.",
      );
      setValue("");
    }
  };

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <PinDots value={value} onChange={setValue} onSubmit={submit} />
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ) : null}
      {throttled ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⏰ Please wait a moment…
        </p>
      ) : null}
    </div>
  );
}

function PinDots({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void | Promise<void>;
}) {
  // When the value reaches 4 digits, auto-submit.
  useEffect(() => {
    if (value.length === 4) {
      void onSubmit(value);
    }
  }, [value, onSubmit]);

  const tap = (digit: string) => {
    if (value.length >= 4) return;
    onChange(value + digit);
  };
  const backspace = () => {
    if (value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 4 dots */}
      <div className="flex gap-3" aria-label="PIN entry">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-all",
              i < value.length
                ? "border-amber-500 bg-amber-500"
                : "border-slate-300 dark:border-slate-700",
            )}
          />
        ))}
      </div>
      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => tap(d)}
            className="grid h-14 w-14 place-items-center rounded-xl border border-slate-200 bg-white text-xl font-bold shadow-sm transition hover:bg-amber-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            {d}
          </button>
        ))}
        <div className="h-14 w-14" aria-hidden />
        <button
          type="button"
          onClick={() => tap("0")}
          className="grid h-14 w-14 place-items-center rounded-xl border border-slate-200 bg-white text-xl font-bold shadow-sm transition hover:bg-amber-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          className="grid h-14 w-14 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          aria-label="Delete"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
