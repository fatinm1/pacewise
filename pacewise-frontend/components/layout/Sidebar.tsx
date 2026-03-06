"use client";

import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Loader2,
  ListOrdered,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activities", label: "Activities", icon: ListOrdered },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/training-load", label: "Training Load", icon: Loader2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const expanded = hovered;

  return (
    <motion.aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.08] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl"
      initial={false}
      animate={{ width: expanded ? 220 : 64 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <nav className="flex flex-col gap-1 p-3 pt-24">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="relative">
              <motion.span
                className={`flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 font-sans text-sm transition-colors ${
                  active
                    ? "bg-white/5 text-[#FC4C02]"
                    : "text-text-muted hover:bg-white/5 hover:text-text-primary"
                }`}
                whileHover={{ x: 2 }}
              >
                <span
                  className={`flex shrink-0 ${active ? "drop-shadow-[0_0_8px_rgba(252,76,2,0.8)]" : ""}`}
                >
                  <Icon size={22} strokeWidth={2} />
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </motion.span>
              {active && (
                <motion.span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#FC4C02] shadow-[0_0_12px_rgba(252,76,2,0.6)]"
                  layoutId="sidebar-pill"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
