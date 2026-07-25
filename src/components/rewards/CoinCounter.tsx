// MIT License — Piano Learning App (Phase 2)
// Coin counter — animated coin balance with a pop effect when it increases.

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface CoinCounterProps {
  /** Current coin balance. */
  coins: number;
  /** Delta to animate (e.g. +5). When set, plays a pop animation. */
  delta?: number;
  /** Size variant. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CoinCounter({
  coins,
  delta,
  size = "md",
  className,
}: CoinCounterProps) {
  const [displayedCoins, setDisplayedCoins] = useState(coins);
  const [popKey, setPopKey] = useState(0);
  const [prevCoins, setPrevCoins] = useState(coins);

  // When the coin count rises, fire the pop animation. Uses the
  // adjust-state-during-render pattern (read prevCoins in render, sync
  // to current via setState during render) so we don't trigger a
  // setState-in-effect lint.
  if (prevCoins !== coins) {
    if (coins > prevCoins) {
      setPopKey((k) => k + 1);
    }
    setPrevCoins(coins);
  }

  // Animate the count up over ~400ms. The setState calls happen inside the
  // requestAnimationFrame callback (async), so this is OK per the lint rule.
  useEffect(() => {
    if (coins === displayedCoins) return;
    const start = displayedCoins;
    const end = coins;
    const duration = 400;
    const startTime = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = Math.round(start + (end - start) * eased);
      setDisplayedCoins(end <= start ? end : value);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [coins, displayedCoins]);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <span
      className={cn(
        "relative inline-flex items-center rounded-full bg-yellow-100 font-bold text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
        sizeClasses[size],
        className,
      )}
      aria-label={`${coins} coins`}
    >
      <span aria-hidden className="animate-coin-spin inline-block">🪙</span>
      <span className="tabular-nums">{displayedCoins.toLocaleString()}</span>
      {delta && delta > 0 ? (
        <span
          key={popKey}
          className="animate-coin-pop pointer-events-none absolute -top-2 right-1 text-xs font-bold text-yellow-600 dark:text-yellow-400"
          aria-hidden
        >
          +{delta}
        </span>
      ) : null}
    </span>
  );
}
