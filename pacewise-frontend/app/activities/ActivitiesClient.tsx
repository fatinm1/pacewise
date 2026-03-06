"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { getActivities } from "@/lib/api";
import type { Activity } from "@/types/strava";
import { GlassCard } from "@/components/ui/GlassCard";
import { ActivityTypeIcon } from "@/components/ui/ActivityTypeIcon";
import { GlowButton } from "@/components/ui/GlowButton";

const TYPES = ["All", "Run", "Ride", "Swim"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function paceDisplay(pace: number | null) {
  if (pace == null) return "—";
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

const ITEMS_PER_PAGE = 10;

export function ActivitiesClient() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<typeof TYPES[number]>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    getActivities({ type: filter === "All" ? undefined : filter }).then(setActivities);
  }, [filter]);

  const filtered = activities.filter(
    (a) =>
      !search ||
      (a.activity_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const pageActivities = filtered.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">Activities</h1>
        <p className="mt-1 font-sans text-text-muted">Filter and search all activities</p>
      </div>

      <GlassCard className="flex flex-wrap items-center gap-4 p-4" hover={false}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-[#FC4C02] focus:outline-none focus:ring-2 focus:ring-[#FC4C02]/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <GlowButton
              key={t}
              variant={filter === t ? "primary" : "ghost"}
              onClick={() => {
                setFilter(t);
                setPage(0);
              }}
            >
              {t}
            </GlowButton>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 font-sans font-medium text-text-muted">Date</th>
                <th className="p-4 font-sans font-medium text-text-muted">Name</th>
                <th className="p-4 font-sans font-medium text-text-muted">Type</th>
                <th className="p-4 font-sans font-medium text-text-muted">Distance</th>
                <th className="p-4 font-sans font-medium text-text-muted">Pace</th>
                <th className="p-4 font-sans font-medium text-text-muted">Time</th>
                <th className="p-4 font-sans font-medium text-text-muted">HR</th>
              </tr>
            </thead>
            <tbody>
              {pageActivities.map((act, i) => (
                <motion.tr
                  key={act.activity_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="p-4 font-mono text-text-muted">{formatDate(act.start_date)}</td>
                  <td className="p-4 font-sans text-text-primary">{act.activity_name || "—"}</td>
                  <td className="p-4">
                    <ActivityTypeIcon type={act.activity_type} size={18} />
                  </td>
                  <td className="p-4 font-mono text-text-primary">{(act.distance_meters / 1000).toFixed(1)} km</td>
                  <td className="p-4 font-mono text-text-primary">
                    {act.activity_type === "Run" ? paceDisplay(act.pace_min_per_km) : "—"}
                  </td>
                  <td className="p-4 font-mono text-text-muted">{(act.moving_time_seconds / 60).toFixed(0)} min</td>
                  <td className="p-4 font-mono text-text-muted">
                    {act.average_heartrate != null ? `${act.average_heartrate}` : "—"}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <p className="font-sans text-xs text-text-muted">
            {filtered.length} activities
          </p>
          <div className="flex gap-2">
            <GlowButton
              variant="ghost"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </GlowButton>
            <GlowButton
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </GlowButton>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
