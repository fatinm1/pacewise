"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import type { WeeklyPerformance } from "@/types/strava";

const GRADIENT_COLORS = ["#FC4C02", "#f43f5e", "#a855f7", "#6366f1", "#06b6d4"];

interface WeeklyDistanceChartProps {
  data: WeeklyPerformance[];
}

function formatWeekStart(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WeeklyDistanceChart({ data }: WeeklyDistanceChartProps) {
  const chartData = data.map((w) => ({
    name: formatWeekStart(w.week_start),
    km: Math.round(w.total_distance_km * 10) / 10,
    full: w,
  }));

  return (
    <GlassCard className="p-6" hover={true}>
      <h3 className="mb-6 font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
        Weekly distance (km)
      </h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              width={32}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload.full as WeeklyPerformance;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-3 py-2 backdrop-blur-xl"
                  >
                    <p className="font-mono text-sm font-bold text-text-primary">
                      {p.total_distance_km.toFixed(1)} km
                    </p>
                    <p className="text-xs text-text-muted">
                      {p.activity_count} activities · {p.total_moving_time_hours.toFixed(1)}h
                    </p>
                  </motion.div>
                );
              }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar
              dataKey="km"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
