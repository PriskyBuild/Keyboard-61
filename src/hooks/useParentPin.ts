// MIT License — Piano Learning App (Phase 2)
// Parent PIN management hook — set, verify, change, remove a 4-digit PIN.
//
// The PIN is hashed with SHA-256 via crypto.subtle before being stored.
// This is NOT cryptographic security (4-digit PINs are brute-forceable in
// 10k tries) but it prevents casual shoulder-surfing of the stored value.
// We add a 1-second delay between failed attempts to slow brute force.

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hashPin,
  loadPhase2,
  savePhase2,
  verifyPin,
} from "@/lib/storage";

export type PinGateState =
  | { status: "no-pin" } // PIN not set yet — first run
  | { status: "locked" } // PIN set, not yet verified
  | { status: "unlocked" } // PIN set + verified
  | { status: "setting" }; // In the middle of setting a new PIN

export interface UseParentPin {
  state: PinGateState;
  /** Verify a PIN against the stored hash. Returns true if it matches. */
  verify: (pin: string) => Promise<boolean>;
  /** Set a new PIN (overwrites any existing). */
  set: (pin: string) => Promise<void>;
  /** Change the PIN — requires the current PIN to match. */
  change: (currentPin: string, newPin: string) => Promise<boolean>;
  /** Remove the PIN entirely. */
  remove: (currentPin: string) => Promise<boolean>;
  /** Lock the dashboard (forces re-verification). */
  lock: () => void;
  /** Number of failed attempts since last success (for throttling). */
  failedAttempts: number;
  /** True if the user is currently throttled (must wait before retrying). */
  throttled: boolean;
}

const THROTTLE_AFTER = 3; // after 3 fails, start throttling
const THROTTLE_MS = 1000; // 1 second per attempt

export function useParentPin(): UseParentPin {
  // Lazy-initialise from localStorage so the first render already reflects
  // whether a PIN is set (avoids setState-in-effect + hydration mismatch).
  const [hasPin, setHasPin] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return loadPhase2().parentPinHash !== null;
  });
  const [unlocked, setUnlocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [throttled, setThrottled] = useState(false);

  // Compute the gate state.
  let state: PinGateState;
  if (!hasPin) state = { status: "no-pin" };
  else if (unlocked) state = { status: "unlocked" };
  else state = { status: "locked" };

  // Apply throttle when failed attempts cross the threshold. We schedule
  // the throttle start + end via setTimeout so the setState calls happen
  // asynchronously (not during the effect body).
  useEffect(() => {
    if (failedAttempts < THROTTLE_AFTER) return;
    const startId = window.setTimeout(() => setThrottled(true), 0);
    const endId = window.setTimeout(() => setThrottled(false), THROTTLE_MS);
    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(endId);
    };
  }, [failedAttempts]);

  const verify = useCallback(
    async (pin: string): Promise<boolean> => {
      if (pin.length !== 4) return false;
      const storage = loadPhase2();
      if (!storage.parentPinHash) return false;
      const ok = await verifyPin(pin, storage.parentPinHash);
      if (ok) {
        setUnlocked(true);
        setFailedAttempts(0);
      } else {
        setFailedAttempts((n) => n + 1);
      }
      return ok;
    },
    [],
  );

  const set = useCallback(async (pin: string): Promise<void> => {
    if (pin.length !== 4) return;
    const hash = await hashPin(pin);
    const storage = loadPhase2();
    storage.parentPinHash = hash;
    savePhase2(storage);
    setHasPin(true);
    setUnlocked(true);
    setFailedAttempts(0);
  }, []);

  const change = useCallback(
    async (currentPin: string, newPin: string): Promise<boolean> => {
      const storage = loadPhase2();
      if (!storage.parentPinHash) return false;
      const ok = await verifyPin(currentPin, storage.parentPinHash);
      if (!ok) {
        setFailedAttempts((n) => n + 1);
        return false;
      }
      const hash = await hashPin(newPin);
      storage.parentPinHash = hash;
      savePhase2(storage);
      setFailedAttempts(0);
      return true;
    },
    [],
  );

  const remove = useCallback(
    async (currentPin: string): Promise<boolean> => {
      const storage = loadPhase2();
      if (!storage.parentPinHash) return false;
      const ok = await verifyPin(currentPin, storage.parentPinHash);
      if (!ok) {
        setFailedAttempts((n) => n + 1);
        return false;
      }
      storage.parentPinHash = null;
      savePhase2(storage);
      setHasPin(false);
      setUnlocked(false);
      setFailedAttempts(0);
      return true;
    },
    [],
  );

  const lock = useCallback(() => {
    setUnlocked(false);
    setFailedAttempts(0);
  }, []);

  return {
    state,
    verify,
    set,
    change,
    remove,
    lock,
    failedAttempts,
    throttled,
  };
}
