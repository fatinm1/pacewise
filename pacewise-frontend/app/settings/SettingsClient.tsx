"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";

export function SettingsClient() {
  const useMock =
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? "").toLowerCase() === "1" ||
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? "").toLowerCase() === "true";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">Settings</h1>
        <p className="mt-1 font-sans text-text-muted">Manage your PaceWise preferences</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6" hover={false}>
          <h2 className="font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
            Data mode
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-sans text-text-primary">
              {useMock ? "Mock data enabled" : "Real data enabled"}
            </p>
            <p className="font-sans text-text-muted">
              Default is real data via the built-in Next.js API routes (`/api/*`). To force mock mode,
              set `NEXT_PUBLIC_USE_MOCK_DATA=1`.
            </p>
          </div>
          <div className="mt-5">
            <GlowButton
              variant="ghost"
              onClick={() => window.open("/api/health", "_blank")}
            >
              Open /api/health
            </GlowButton>
          </div>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <h2 className="font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
            Heart rate zones (current model)
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-sans text-text-muted">
              HR zones are currently an approximation built from <span className="font-mono">average_heartrate</span>{" "}
              per activity (Strava’s activities endpoint does not provide time-in-zone). The model converts
              each activity’s moving time into minutes and buckets it into Z1–Z5 using a configured max HR.
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-text-muted">
              <li>HR_MAX_BPM (default 190)</li>
              <li>HR_ZONE_Z1_MAX (default 0.60)</li>
              <li>HR_ZONE_Z2_MAX (default 0.70)</li>
              <li>HR_ZONE_Z3_MAX (default 0.80)</li>
              <li>HR_ZONE_Z4_MAX (default 0.90)</li>
            </ul>
            <p className="font-sans text-text-muted">
              These are applied in the dbt model <span className="font-mono">mart_hr_zones_weekly</span>.
            </p>
          </div>
        </GlassCard>
      </section>
    </motion.div>
  );
}
