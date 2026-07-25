// MIT License — Piano Learning App (Phase 2)
// Progress chart — recharts-based per-child chart showing lessons completed,
// accuracy per lesson, and minutes practised. Uses a responsive container so
// it works on mobile.

"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { CURRICULUM } from "@/lib/curriculum";
import type { ProfileProgress } from "@/lib/storage";
import { Trophy, Clock, Target, TrendingUp } from "lucide-react";

export interface ProgressChartProps {
  progress: ProfileProgress;
  profileName: string;
}

export function ProgressChart({ progress, profileName }: ProgressChartProps) {
  // Build the chart data from the curriculum + this profile's lesson progress.
  const data = CURRICULUM.map((lesson) => {
    const lp = progress.lessons[lesson.id];
    return {
      lesson: `L${lesson.number}`,
      title: lesson.title,
      accuracy: lp?.completed ? lp.bestAccuracy : 0,
      attempts: lp?.attempts ?? 0,
      completed: lp?.completed ?? false,
    };
  });

  const completedCount = data.filter((d) => d.completed).length;
  const avgAccuracy =
    completedCount > 0
      ? Math.round(
          data.filter((d) => d.completed).reduce((s, d) => s + d.accuracy, 0) /
            completedCount,
        )
      : 0;
  const totalMinutes = progress.minutesPractised;
  const totalCoins = progress.coins;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          {profileName}&apos;s progress
        </h2>
        <p className="text-xs text-muted-foreground">
          Accuracy per lesson (0% = not yet attempted)
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Lessons done"
          value={`${completedCount}/${CURRICULUM.length}`}
          tone="emerald"
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Avg accuracy"
          value={`${avgAccuracy}%`}
          tone="amber"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Minutes practised"
          value={`${totalMinutes}`}
          tone="slate"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Coins earned"
          value={`${totalCoins}`}
          tone="amber"
        />
      </div>

      {/* Bar chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="lesson"
              tick={{ fontSize: 11, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
              unit="%"
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(148,163,184,0.3)",
                borderRadius: "8px",
                color: "white",
                fontSize: "12px",
              }}
              labelStyle={{ color: "white" }}
              cursor={{ fill: "rgba(245,158,11,0.1)" }}
              formatter={(value) => {
                return [`${value}%`, "Accuracy"];
              }}
              labelFormatter={(label) => {
                const d = data.find((x) => x.lesson === label);
                return d?.title ?? label;
              }}
            />
            <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    !entry.completed
                      ? "rgba(148,163,184,0.25)"
                      : entry.accuracy >= 90
                        ? "#10b981"
                        : entry.accuracy >= 70
                          ? "#f59e0b"
                          : "#f97316"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "slate";
}) {
  const toneClasses = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    slate: "text-slate-600 dark:text-slate-400",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
      <div
        className={`mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${toneClasses[tone]}`}
      >
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
