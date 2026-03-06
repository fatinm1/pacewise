"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getTrainingLoad } from "@/lib/api";
import type { TrainingLoadPoint } from "@/types/strava";
import { GlassCard } from "@/components/ui/GlassCard";
import { TrainingLoadChart } from "@/components/charts/TrainingLoadChart";

export function TrainingLoadClient() {
  const [data, setData] = useState<TrainingLoadPoint[]>([]);

  useEffect(() => {
    getTrainingLoad().then(setData);
  }, []);

  const latest = data[data.length - 1];
  const ratio = latest
    ? latest.rolling_28d_distance_km > 0
      ? latest.rolling_7d_distance_km / latest.rolling_28d_distance_km
      : 0
    : 0;

  const ringColor = ratio <= 1.0 ? "#22c55e" : ratio <= 1.3 ? "#eab308" : "#ef4444";
  const ringGlow = ratio <= 1.0 ? "rgba(34,197,94,0.6)" : ratio <= 1.3 ? "rgba(234,179,8,0.6)" : "rgba(239,68,68,0.6)";
  const circumference = 2 * Math.PI * 45;
  const strokeDash = (ratio / 1.5) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">Training load</h1>
        <p className="mt-1 font-sans text-text-muted">7-day vs 28-day rolling distance and acute:chronic ratio</p>
      </div>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrainingLoadChart data={data} />
        </div>
        <GlassCard className="relative flex flex-col items-center justify-center p-8" hover={true}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Acute:Chronic ratio
          </p>
          <motion.div
            className="relative mt-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <svg width={120} height={120} className="-rotate-90">
              <circle
                cx={60}
                cy={60}
                r={45}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={8}
              />
              <motion.circle
                cx={60}
                cy={60}
                r={45}
                fill="none"
                stroke={ringColor}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: Math.max(0, circumference - strokeDash) }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  filter: `drop-shadow(0 0 12px ${ringGlow})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: ringColor, textShadow: `0 0 20px ${ringGlow}` }}
              >
                {ratio.toFixed(2)}
              </span>
            </div>
          </motion.div>
          <p className="mt-4 text-center font-sans text-xs text-text-muted">
            {ratio <= 1.0 && "Optimal load"}
            {ratio > 1.0 && ratio <= 1.3 && "Moderate increase"}
            {ratio > 1.3 && "High injury risk"}
          </p>
        </GlassCard>
      </section>
    </motion.div>
  );
}
