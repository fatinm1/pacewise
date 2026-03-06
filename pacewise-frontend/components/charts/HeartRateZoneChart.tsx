"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { CornerBrackets } from "@/components/ui/CornerBrackets";
import type { HeartRateZoneBucket } from "@/types/strava";

interface HeartRateZoneChartProps {
  data: HeartRateZoneBucket[];
}

export function HeartRateZoneChart({ data }: HeartRateZoneChartProps) {
  const byWeek = data.reduce<Record<string, { week: string; [zone: string]: string | number }>>((acc, row) => {
    if (!acc[row.week_start]) {
      acc[row.week_start] = {
        week: new Date(row.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    }
    acc[row.week_start][row.zone_name] = row.minutes;
    acc[row.week_start][`${row.zone_name}_color`] = row.zone_color;
    return acc;
  }, {});

  const chartData = Object.values(byWeek);
  const zones = ["Z1", "Z2", "Z3", "Z4", "Z5"];
  const colors = ["#06b6d4", "#6366f1", "#a855f7", "#f43f5e", "#FC4C02"];

  const stackedData = chartData.map((row) => ({
    ...row,
    ...Object.fromEntries(zones.map((z) => [z, row[z] ?? 0])),
  }));

  return (
    <GlassCard className="relative overflow-hidden p-6" hover={true}>
      <CornerBrackets />
      <h3 className="mb-6 font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
        Heart rate zone breakdown (min/week)
      </h3>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stackedData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              width={28}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-3 py-2 backdrop-blur-xl">
                    {zones.map((z, i) => (
                      <p key={z} className="flex gap-2 text-xs">
                        <span style={{ color: colors[i] }}>{z}</span>
                        <span className="font-mono text-text-primary">{row[z]} min</span>
                      </p>
                    ))}
                  </div>
                );
              }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            {zones.map((zone, i) => (
              <Bar key={zone} dataKey={zone} stackId="a" fill={colors[i]} radius={[0, 0, 0, 0]}>
                {stackedData.map((_, j) => (
                  <Cell key={j} fill={colors[i]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
