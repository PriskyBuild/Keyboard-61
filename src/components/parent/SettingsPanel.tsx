// MIT License — Piano Learning App (Phase 2)
// Settings panel — parent-configurable controls. Includes:
//   - Pitch-detection tolerance (cents)
//   - Octave forgiveness toggle
//   - Daily time-limit override
//   - Export / Import progress as JSON
//   - Reset all data
//
// Changes are persisted to localStorage immediately via the storage layer.

"use client";

import { useRef, useState } from "react";
import {
  loadPhase2,
  savePhase2,
  type ParentSettings,
  type Phase2Storage,
} from "@/lib/storage";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Download, Upload, Trash2, AlertTriangle } from "lucide-react";

export interface SettingsPanelProps {
  storage: Phase2Storage;
  onStorageChange: (s: Phase2Storage) => void;
}

export function SettingsPanel({
  storage,
  onStorageChange,
}: SettingsPanelProps) {
  const settings = storage.settings;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importOk, setImportOk] = useState(false);

  const update = (patch: Partial<ParentSettings>) => {
    const next: Phase2Storage = {
      ...storage,
      settings: { ...settings, ...patch },
    };
    if (savePhase2(next)) onStorageChange(next);
  };

  const exportData = () => {
    const json = JSON.stringify(storage, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `piano-app-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    setImportError(null);
    setImportOk(false);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Phase2Storage;
        if (!parsed.schemaVersion || !Array.isArray(parsed.profiles)) {
          throw new Error("Invalid file format");
        }
        if (savePhase2(parsed)) {
          onStorageChange(parsed);
          setImportOk(true);
        }
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : "Could not read this file.",
        );
      }
    };
    reader.onerror = () => setImportError("Could not read this file.");
    reader.readAsText(file);
  };

  const resetAll = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "Erase ALL profiles, progress, stickers, and settings? This cannot be undone.",
      )
    ) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("piano-app:phase2:v1");
      }
      onStorageChange(loadPhase2());
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Settings className="h-4 w-4 text-amber-500" />
          Settings
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Pitch tolerance */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="tolerance" className="text-xs">
              Pitch tolerance
            </Label>
            <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              ±{settings.centsTolerance} cents
            </span>
          </div>
          <Slider
            id="tolerance"
            value={[settings.centsTolerance]}
            onValueChange={(v) => update({ centsTolerance: v[0] })}
            min={10}
            max={100}
            step={5}
            aria-label="Pitch tolerance in cents"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            How forgiving note detection is. Lower = stricter, higher = more
            forgiving. Default: ±50 cents.
          </p>
        </div>

        {/* Octave forgiveness */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
          <div>
            <Label htmlFor="octave" className="text-xs font-medium">
              Octave forgiveness
            </Label>
            <p className="text-[11px] text-muted-foreground">
              When ON, playing the right note in the wrong octave still counts
              (e.g. C5 matches C4).
            </p>
          </div>
          <Switch
            id="octave"
            checked={settings.octaveForgiveness}
            onCheckedChange={(v) => update({ octaveForgiveness: v })}
          />
        </div>

        {/* Daily time-limit override */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="timelimit" className="text-xs">
              Daily time limit (0 = use profile default)
            </Label>
            <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {settings.timeLimitOverride === 0
                ? "off"
                : `${settings.timeLimitOverride} min`}
            </span>
          </div>
          <Slider
            id="timelimit"
            value={[settings.timeLimitOverride]}
            onValueChange={(v) => update({ timeLimitOverride: v[0] })}
            min={0}
            max={60}
            step={5}
            aria-label="Daily time limit override"
          />
        </div>

        {/* Export / Import */}
        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={exportData} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export progress
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="ml-auto gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset all
          </Button>
        </div>

        {importOk ? (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <AlertTriangle className="h-3 w-3" />
            Import successful!
          </p>
        ) : null}
        {importError ? (
          <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            {importError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
