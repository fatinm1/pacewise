"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

export function SettingsClient() {
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
      <GlassCard className="p-8" hover={false}>
        <p className="font-sans text-text-muted">Settings and integrations (e.g. Strava, BigQuery) can be configured here.</p>
      </GlassCard>
    </motion.div>
  );
}
