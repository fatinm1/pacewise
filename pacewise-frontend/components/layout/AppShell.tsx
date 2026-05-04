"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

function isLandingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/landing" || pathname.startsWith("/landing/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const landing = isLandingPath(pathname);

  return (
    <>
      {!landing && <Sidebar />}
      <div className={landing ? "relative" : "relative pl-16"}>
        <TopBar />
        <main className="min-h-[calc(100vh-3.5rem)] p-6">{children}</main>
      </div>
    </>
  );
}
