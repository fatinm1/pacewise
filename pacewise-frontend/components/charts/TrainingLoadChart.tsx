"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import type { TrainingLoadPoint } from "@/types/strava";

interface TrainingLoadChartProps {
  data: TrainingLoadPoint[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrainingLoadChart({ data }: TrainingLoadChartProps) {
  const chartData = data.map((d) => ({
    name: formatDate(d.start_date),
    "7d": Math.round(d.rolling_7d_distance_km * 10) / 10,
    "28d": Math.round(d.rolling_28d_distance_km * 10) / 10,
  }));

  return (
    <GlassCard className="p-6" hover={true}>
      <h3 className="mb-6 font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
        7-day vs 28-day rolling distance (km)
      </h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
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
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-3 py-2 backdrop-blur-xl">
                    <p className="font-mono text-sm">
                      <span className="text-[#FC4C02]">7d:</span> {p["7d"]} km
                    </p>
                    <p className="font-mono text-sm">
                      <span className="text-[#6366f1]">28d:</span> {p["28d"]} km
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <Legend
              formatter={(value) => (
                <span className="font-mono text-xs text-text-muted">
                  {value === "7d" ? "7-day" : "28-day"}
                </span>
              )}
              wrapperStyle={{ paddingTop: 8 }}
            />
            <Line
              type="monotone"
              dataKey="7d"
              name="7d"
              stroke="#FC4C02"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#FC4C02" }}
              style={{ filter: "drop-shadow(0 0 6px rgba(252,76,2,0.6))" }}
            />
            <Line
              type="monotone"
              dataKey="28d"
              name="28d"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1" }}
              style={{ filter: "drop-shadow(0 0 6px rgba(99,102,241,0.6))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
