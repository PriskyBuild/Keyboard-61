// MIT License — Piano Learning App (Phase 2)
// Mascot — friendly animated bear. Pure SVG + CSS animation, no external
// assets. Four states:
//   - idle: gentle breathing, occasional blink
//   - listening: ear twitch, "shhh" indicator
//   - happy: bounce + confetti sparkles (correct note)
//   - encourage: warm smile, gentle nod (wrong note — "try again!")
//
// Designed for 6-7 year olds: big eyes, round shapes, soft colors. The bear
// is the same character across all screens so kids build a relationship.

"use client";

import { cn } from "@/lib/utils";

export type MascotState = "idle" | "listening" | "happy" | "encourage";

export interface MascotProps {
  state?: MascotState;
  /** Optional speech-bubble message (kid-friendly copy). */
  message?: string | null;
  /** Size in px (default 120). */
  size?: number;
  className?: string;
}

export function Mascot({
  state = "idle",
  message,
  size = 120,
  className,
}: MascotProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative",
          state === "happy" && "animate-mascot-bounce",
          state === "encourage" && "animate-mascot-nod",
          state === "listening" && "animate-mascot-breathe",
          state === "idle" && "animate-mascot-breathe",
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          className="drop-shadow-md"
        >
          {/* Ears */}
          <circle cx="30" cy="28" r="14" fill="#a16207" />
          <circle cx="90" cy="28" r="14" fill="#a16207" />
          <circle cx="30" cy="28" r="8" fill="#fcd34d" />
          <circle cx="90" cy="28" r="8" fill="#fcd34d" />

          {/* Head */}
          <circle cx="60" cy="60" r="42" fill="#d97706" />

          {/* Snout */}
          <ellipse cx="60" cy="78" rx="22" ry="16" fill="#fef3c7" />

          {/* Eyes */}
          {state === "happy" ? (
            // Happy eyes = upward arcs (^ ^)
            <path
              d="M 38 55 Q 44 48 50 55"
              stroke="#1e293b"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <circle cx="44" cy="56" r="5" fill="#1e293b">
              <animate
                attributeName="r"
                values="5;5;0.5;5;5"
                dur="4s"
                repeatCount="indefinite"
                keyTimes="0;0.45;0.5;0.55;1"
              />
            </circle>
          )}
          {state === "happy" ? (
            <path
              d="M 70 55 Q 76 48 82 55"
              stroke="#1e293b"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <circle cx="76" cy="56" r="5" fill="#1e293b">
              <animate
                attributeName="r"
                values="5;5;0.5;5;5"
                dur="4s"
                repeatCount="indefinite"
                keyTimes="0;0.45;0.5;0.55;1"
              />
            </circle>
          )}

          {/* Nose */}
          <ellipse cx="60" cy="72" rx="4" ry="3" fill="#1e293b" />

          {/* Mouth — state-dependent */}
          {state === "happy" ? (
            // Big open smile
            <path
              d="M 48 80 Q 60 92 72 80"
              stroke="#1e293b"
              strokeWidth="3"
              fill="#f59e0b"
              strokeLinecap="round"
            />
          ) : state === "encourage" ? (
            // Gentle smile
            <path
              d="M 50 82 Q 60 88 70 82"
              stroke="#1e293b"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          ) : state === "listening" ? (
            // Small "o" mouth (concentrating)
            <ellipse cx="60" cy="84" rx="3" ry="4" fill="#1e293b" />
          ) : (
            // Neutral closed mouth
            <path
              d="M 52 84 Q 60 88 68 84"
              stroke="#1e293b"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Cheeks (rosy) — visible in happy + encourage states */}
          {(state === "happy" || state === "encourage") && (
            <>
              <circle cx="36" cy="68" r="5" fill="#fb7185" opacity="0.5" />
              <circle cx="84" cy="68" r="5" fill="#fb7185" opacity="0.5" />
            </>
          )}

          {/* Listening indicator: "sound waves" near the ear */}
          {state === "listening" && (
            <>
              <path
                d="M 102 36 Q 110 36 110 44"
                stroke="#10b981"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.9;0.3"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d="M 106 30 Q 118 32 118 46"
                stroke="#10b981"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0.7;0.2"
                  dur="1.5s"
                  begin="0.3s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}
        </svg>

        {/* Sparkle overlay when happy */}
        {state === "happy" && (
          <div className="pointer-events-none absolute inset-0">
            <Sparkle className="absolute left-2 top-4 h-3 w-3 text-amber-300 animate-sparkle" />
            <Sparkle
              className="absolute right-2 top-6 h-4 w-4 text-amber-300 animate-sparkle"
              delay="0.2s"
            />
            <Sparkle
              className="absolute left-6 top-0 h-2 w-2 text-amber-400 animate-sparkle"
              delay="0.4s"
            />
            <Sparkle
              className="absolute right-4 top-0 h-3 w-3 text-amber-400 animate-sparkle"
              delay="0.1s"
            />
          </div>
        )}
      </div>

      {message ? (
        <div className="relative max-w-[16rem] rounded-2xl bg-white px-4 py-2 text-center text-sm font-medium shadow-md dark:bg-slate-800">
          <span
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white dark:bg-slate-800"
            aria-hidden
          />
          <p className="relative leading-snug">{message}</p>
        </div>
      ) : null}
    </div>
  );
}

function Sparkle({
  className,
  delay = "0s",
}: {
  className?: string;
  delay?: string;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      style={{ animationDelay: delay }}
      aria-hidden
    >
      <path
        d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z"
        fill="currentColor"
      />
    </svg>
  );
}
