"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlowButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

export function GlowButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled = false,
}: GlowButtonProps) {
  if (variant === "ghost") {
    return (
      <motion.button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`
          rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-sans text-sm
          text-text-primary backdrop-blur-sm
          hover:border-[rgba(252,76,2,0.5)] hover:shadow-[0_0_20px_rgba(252,76,2,0.15)]
          transition-colors disabled:opacity-50
          ${className}
        `}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        rounded-xl bg-[#FC4C02] px-4 py-2 font-sans text-sm font-medium text-white
        shadow-[0_0_30px_rgba(252,76,2,0.4)]
        hover:shadow-[0_0_50px_rgba(252,76,2,0.6)]
        transition-shadow disabled:opacity-50
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.02, boxShadow: disabled ? undefined : "0 0 50px rgba(252,76,2,0.6)" }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  );
}
