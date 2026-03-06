"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { CornerBrackets } from "@/components/ui/CornerBrackets";
import type { PaceTrendPoint } from "@/types/strava";

interface PaceTrendChartProps {
  data: PaceTrendPoint[];
}

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PaceTrendChart({ data }: PaceTrendChartProps) {
  const chartData = data.map((d) => ({
    name: formatWeek(d.week_start),
    pace: Math.round(d.avg_pace_min_per_km * 100) / 100,
  }));

  return (
    <GlassCard className="relative overflow-hidden p-6" hover={true}>
      <CornerBrackets />
      <h3 className="mb-6 font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
        Pace trend (min/km)
      </h3>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="paceArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC4C02" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FC4C02" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              width={36}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const v = payload[0].value as number;
                return (
                  <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-3 py-2 backdrop-blur-xl">
                    <p className="font-mono text-sm font-bold text-[#FC4C02]">
                      {v.toFixed(2)} min/km
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: "rgba(252,76,2,0.3)" }}
            />
            <Area
              type="monotone"
              dataKey="pace"
              fill="url(#paceArea)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="pace"
              stroke="#FC4C02"
              strokeWidth={2}
              dot={{ fill: "#FC4C02", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#FC4C02", stroke: "rgba(252,76,2,0.5)", strokeWidth: 2 }}
              style={{ filter: "drop-shadow(0 0 8px rgba(252,76,2,0.6))" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
