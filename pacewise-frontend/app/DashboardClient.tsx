"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getActivities, getWeeklyPerformance, getAthlete } from "@/lib/api";
import type { Activity, WeeklyPerformance } from "@/types/strava";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricValue } from "@/components/ui/MetricValue";
import { HolographicText } from "@/components/ui/HolographicText";
import { ActivityTypeIcon } from "@/components/ui/ActivityTypeIcon";
import { WeeklyDistanceChart } from "@/components/charts/WeeklyDistanceChart";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function paceDisplay(pace: number | null) {
  if (pace == null) return "—";
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function DashboardClient() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weekly, setWeekly] = useState<WeeklyPerformance[]>([]);
  const [athlete, setAthlete] = useState<{ total_activities: number; member_since: string } | null>(null);

  useEffect(() => {
    getActivities({ limit: 10 }).then(setActivities);
    getWeeklyPerformance().then(setWeekly);
    getAthlete().then((a) => setAthlete(a));
  }, []);

  const totalKm = activities.reduce((s, a) => s + a.distance_meters / 1000, 0);
  const runs = activities.filter((a) => a.activity_type === "Run");
  const avgPace = runs.length
    ? runs.reduce((s, a) => s + (a.pace_min_per_km ?? 0), 0) / runs.length
    : 0;
  const avgHr = runs.length
    ? runs.reduce((s, a) => s + (a.average_heartrate ?? 0), 0) / runs.length
    : 0;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl py-8 scanline-overlay">
        <div className="relative z-10 px-2">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            <HolographicText animated>YOUR PACE. YOUR DATA.</HolographicText>
          </h1>
          <p className="mt-2 font-sans text-text-muted">
            {athlete?.total_activities ?? 0} total activities
            {athlete?.member_since && (
              <> · Member since {new Date(athlete.member_since).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</>
            )}
          </p>
        </div>
      </section>

      {/* KPI Row */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <GlassCard className="p-6" hover={true}>
            <MetricValue value={totalKm.toFixed(1)} unit="km" label="Total Distance" glowColor="orange" animate={false} />
          </GlassCard>
        </motion.div>
        <motion.div variants={item}>
          <GlassCard className="p-6" hover={true}>
            <MetricValue value={athlete?.total_activities ?? 0} unit="activities" label="Total Activities" glowColor="orange" />
          </GlassCard>
        </motion.div>
        <motion.div variants={item}>
          <GlassCard className="p-6" hover={true}>
            <MetricValue
              value={avgPace > 0 ? avgPace.toFixed(2) : "—"}
              unit="min/km"
              label="Avg Pace"
              glowColor="orange"
              animate={false}
            />
          </GlassCard>
        </motion.div>
        <motion.div variants={item}>
          <GlassCard className="p-6" hover={true}>
            <MetricValue
              value={Math.round(avgHr)}
              unit="bpm"
              label="Avg Heart Rate"
              glowColor="red"
              animate={avgHr > 0}
            />
          </GlassCard>
        </motion.div>
      </motion.section>

      {/* Weekly distance chart */}
      <section>
        <WeeklyDistanceChart data={weekly} />
      </section>

      {/* Recent activities */}
      <section>
        <h2 className="mb-4 font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
          Recent activities
        </h2>
        <motion.div
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {activities.map((act, i) => (
            <motion.div key={act.activity_id} variants={item}>
              <GlassCard
                className="relative overflow-hidden border-l-4 border-l-[#FC4C02] p-4 transition-shadow"
                hover={true}
              >
                <motion.div
                  className="flex flex-wrap items-center justify-between gap-4"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <ActivityTypeIcon type={act.activity_type} size={22} />
                    <div>
                      <p className="font-sans font-medium text-text-primary">
                        {act.activity_name || "Untitled"}
                      </p>
                      <p className="font-mono text-xs text-text-muted">
                        {formatDate(act.start_date)} · {(act.distance_meters / 1000).toFixed(1)} km
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-sm">
                    <span className="text-text-primary">
                      {act.activity_type === "Run" ? paceDisplay(act.pace_min_per_km) : `${(act.moving_time_seconds / 60).toFixed(0)} min`}
                    </span>
                    {act.average_heartrate != null && (
                      <span className="text-text-muted">{act.average_heartrate} bpm</span>
                    )}
                  </div>
                </motion.div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </motion.div>
  );
}
