"use client";

import { motion, useMotionValueEvent, useSpring } from "framer-motion";
import { useEffect, useState, useRef } from "react";

const GLOW_STYLES: Record<string, string> = {
  orange: "0 0 20px rgba(252, 76, 2, 0.8)",
  indigo: "0 0 20px rgba(99, 102, 241, 0.6)",
  red: "0 0 20px rgba(244, 63, 94, 0.5)",
  default: "0 0 20px rgba(252, 76, 2, 0.8)",
};

interface MetricValueProps {
  value: number | string;
  unit?: string;
  label?: string;
  glowColor?: "orange" | "indigo" | "red";
  animate?: boolean;
}

export function MetricValue({
  value,
  unit = "",
  label,
  glowColor = "orange",
  animate = true,
}: MetricValueProps) {
  const numeric = typeof value === "number";
  const end = numeric ? value : 0;
  const [display, setDisplay] = useState(animate && numeric ? 0 : end);
  const spring = useSpring(0, { stiffness: 50, damping: 30 });
  const started = useRef(false);

  useEffect(() => {
    if (!numeric || !animate || started.current) return;
    started.current = true;
    spring.set(end);
  }, [end, animate, numeric, spring]);

  useMotionValueEvent(spring, "change", (v) => {
    setDisplay(v);
  });

  const textShadow = GLOW_STYLES[glowColor] ?? GLOW_STYLES.default;
  const showValue = numeric && animate ? display : value;
  const formatted = typeof showValue === "number" ? showValue.toFixed(1) : String(showValue);

  return (
    <div className="space-y-0.5">
      {label && (
        <p className="text-sm font-sans text-text-muted">{label}</p>
      )}
      <div className="flex items-baseline gap-1.5 font-mono text-2xl font-bold tracking-tight md:text-3xl">
        <span
          className="font-mono font-bold tabular-nums"
          style={{ textShadow, color: "#f1f5f9" }}
        >
          {formatted}
        </span>
        {unit && (
          <span className="text-lg text-text-muted font-normal">{unit}</span>
        )}
      </div>
    </div>
  );
}
