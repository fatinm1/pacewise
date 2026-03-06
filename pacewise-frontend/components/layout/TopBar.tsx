"use client";

import { motion } from "framer-motion";
import { User, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { getAthlete } from "@/lib/api";
import type { AthleteSummary } from "@/types/strava";

export function TopBar() {
  const [athlete, setAthlete] = useState<AthleteSummary | null>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    getAthlete().then(setAthlete);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[rgba(8,8,16,0.8)] px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
          PaceWise
        </span>
        <motion.span
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted"
          animate={live ? { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Radio size={10} className="text-[#FC4C02]" />
          <span
            className="bg-gradient-to-r from-[#FC4C02] via-[#f43f5e] to-[#6366f1] bg-clip-text text-transparent"
            style={{ backgroundSize: "200% 200%" }}
          >
            Live sync
          </span>
        </motion.span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-text-primary sm:block">
          {athlete?.name ?? "Athlete"}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
          {athlete?.avatar_url ? (
            <img
              src={athlete.avatar_url}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <User size={16} className="text-text-muted" />
          )}
        </span>
      </div>
    </header>
  );
}
