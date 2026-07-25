// MIT License — Piano Learning App (Phase 2)
// /help/microphone route — static help explaining mic privacy.

import Link from "next/link";
import { ShieldCheck, Mic, Eye, EyeOff } from "lucide-react";

export default function MicrophoneHelpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">
          Microphone Privacy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          How we use your microphone — and how we don&apos;t.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
            The short version
          </h2>
          <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">
            Your microphone audio is processed entirely in your browser&apos;s
            memory. We never record, upload, or store it.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <PrivacyItem
            icon={<Mic className="h-5 w-5 text-amber-500" />}
            title="When we listen"
            body="The microphone is active only while you're on the /listen page with the 'Start' button pressed. A persistent '🎤 Listening' badge is always visible when the mic is on."
          />
          <PrivacyItem
            icon={<EyeOff className="h-5 w-5 text-amber-500" />}
            title="Auto-stop"
            body="The mic stops automatically when you switch tabs, close the page, or tap the Stop button. We never leave it running in the background."
          />
          <PrivacyItem
            icon={<Eye className="h-5 w-5 text-amber-500" />}
            title="What we do with the audio"
            body="The audio is fed into a YIN pitch-detection algorithm running inside an AudioWorklet (a separate audio-processing thread). It outputs only a single number: the detected frequency in Hertz. No audio data ever leaves the AudioWorklet."
          />
          <PrivacyItem
            icon={<ShieldCheck className="h-5 w-5 text-amber-500" />}
            title="What we don't do"
            body="We don't record. We don't upload. We don't store audio. We don't send anything to a server. This app is fully client-side."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-base font-semibold">Browser permission</h2>
        <p className="text-sm text-muted-foreground">
          Your browser will show a permission popup the first time you press
          Start. Tap <strong>Allow</strong> to let Bruno hear your piano. You
          can revoke this at any time via your browser&apos;s site-settings
          (the lock icon next to the URL).
        </p>
      </section>

      <Link
        href="/listen"
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      >
        ← Back to Listen Mode
      </Link>
    </main>
  );
}

function PrivacyItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
