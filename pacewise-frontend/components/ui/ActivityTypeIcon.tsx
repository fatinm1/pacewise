"use client";

import {
  Activity,
  Bike,
  Footprints,
  Waves,
  LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

const TYPE_ICONS: Record<string, LucideIcon> = {
  Run: Footprints,
  Ride: Bike,
  Bike: Bike,
  Swim: Waves,
  default: Activity,
};

const TYPE_COLORS: Record<string, string> = {
  Run: "#FC4C02",
  Ride: "#6366f1",
  Bike: "#6366f1",
  Swim: "#06b6d4",
  default: "#64748b",
};

interface ActivityTypeIconProps {
  type: string;
  size?: number;
  className?: string;
}

export function ActivityTypeIcon({
  type,
  size = 20,
  className = "",
}: ActivityTypeIconProps) {
  const Icon = TYPE_ICONS[type] ?? TYPE_ICONS.default;
  const color = TYPE_COLORS[type] ?? TYPE_COLORS.default;

  return (
    <motion.span
      className={`inline-flex ${className}`}
      whileHover={{
        filter: `drop-shadow(0 0 6px ${color})`,
      }}
    >
      <Icon size={size} style={{ color }} strokeWidth={2} />
    </motion.span>
  );
}
