"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const GLOW_COLORS: Record<string, string> = {
  orange: "rgba(252, 76, 2, 0.3)",
  indigo: "rgba(99, 102, 241, 0.3)",
  default: "rgba(252, 76, 2, 0.3)",
};

interface GlassCardProps {
  children: ReactNode;
  glowColor?: "orange" | "indigo";
  className?: string;
  hover?: boolean;
}

export function GlassCard({
  children,
  glowColor = "orange",
  className = "",
  hover = true,
}: GlassCardProps) {
  const borderHover = GLOW_COLORS[glowColor] ?? GLOW_COLORS.default;

  return (
    <motion.div
      className={`
        rounded-2xl border bg-[rgba(255,255,255,0.03)] backdrop-blur-[20px]
        shadow-[0_0_40px_rgba(252,76,2,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]
        border-white/[0.08]
        ${className}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={
        hover
          ? {
              boxShadow: `0 0 60px ${borderHover.replace("0.3", "0.15")}, inset 0 1px 0 rgba(255,255,255,0.06)`,
              borderColor: borderHover,
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
