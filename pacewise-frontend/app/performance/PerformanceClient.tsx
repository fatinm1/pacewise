"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getPaceTrend, getHeartRateZones, getPersonalBests } from "@/lib/api";
import type { PaceTrendPoint, HeartRateZoneBucket, PersonalBest } from "@/types/strava";
import { GlassCard } from "@/components/ui/GlassCard";
import { CornerBrackets } from "@/components/ui/CornerBrackets";
import { HolographicText } from "@/components/ui/HolographicText";
import { PaceTrendChart } from "@/components/charts/PaceTrendChart";
import { HeartRateZoneChart } from "@/components/charts/HeartRateZoneChart";

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export function PerformanceClient() {
  const [paceTrend, setPaceTrend] = useState<PaceTrendPoint[]>([]);
  const [hrZones, setHrZones] = useState<HeartRateZoneBucket[]>([]);
  const [pbs, setPbs] = useState<PersonalBest[]>([]);

  useEffect(() => {
    getPaceTrend().then(setPaceTrend);
    getHeartRateZones().then(setHrZones);
    getPersonalBests().then(setPbs);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">Performance</h1>
        <p className="mt-1 font-sans text-text-muted">Pace trends, heart rate zones, and personal bests</p>
      </div>

      <section>
        <PaceTrendChart data={paceTrend} />
      </section>

      <section>
        <HeartRateZoneChart data={hrZones} />
      </section>

      <section>
        <h2 className="mb-4 font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
          Personal bests
        </h2>
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {pbs.map((pb, i) => (
            <motion.div key={pb.label} variants={item}>
              <GlassCard className="relative overflow-hidden p-6" hover={true}>
                <CornerBrackets />
                <p className="font-sans text-sm text-text-muted">{pb.label}</p>
                <p
                  className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary md:text-3xl"
                  style={{
                    background: "linear-gradient(135deg, #FC4C02, #f43f5e, #a855f7, #6366f1)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    animation: "holographic-shift 4s ease-in-out infinite",
                  }}
                >
                  {pb.value}
                </p>
                <p className="font-mono text-sm text-text-muted">{pb.unit}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </motion.div>
  );
}
