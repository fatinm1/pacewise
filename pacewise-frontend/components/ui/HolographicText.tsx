"use client";

import type { ReactNode } from "react";

const HOLO_GRADIENT =
  "linear-gradient(135deg, #FC4C02, #f43f5e, #a855f7, #6366f1, #06b6d4)";

interface HolographicTextProps {
  children: ReactNode;
  animated?: boolean;
  className?: string;
}

export function HolographicText({
  children,
  animated = true,
  className = "",
}: HolographicTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: HOLO_GRADIENT,
        backgroundSize: "200% 200%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        ...(animated ? { animation: "holographic-shift 4s ease-in-out infinite" } : {}),
      }}
    >
      {children}
    </span>
  );
}
