"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";

export function SettingsClient() {
  const pathname = usePathname();
  const onDemoPath = pathname.startsWith("/demo");
  const envMock =
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? "").toLowerCase() === "1" ||
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? "").toLowerCase() === "true";
  const useMock = envMock || onDemoPath;
  const [health, setHealth] = useState<{
    status: "idle" | "loading" | "done";
    dataSource: "local" | "bigquery" | null;
  }>({ status: "idle", dataSource: null });

  useEffect(() => {
    if (onDemoPath || useMock) {
      setHealth({ status: "done", dataSource: null });
      return;
    }
    setHealth({ status: "loading", dataSource: null });
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { data_source?: string }) => {
        const ds = j.data_source === "local" || j.data_source === "bigquery" ? j.data_source : null;
        setHealth({ status: "done", dataSource: ds });
      })
      .catch(() => setHealth({ status: "done", dataSource: null }));
  }, [onDemoPath, useMock]);

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

      <section className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6" hover={false}>
          <h2 className="font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
            Data mode
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-sans text-text-primary">
              {onDemoPath
                ? "Interactive demo (sample data)"
                : useMock
                  ? "Mock data enabled"
                  : "Real data enabled"}
            </p>
            <p className="font-sans text-text-muted">
              {onDemoPath ? (
                <>
                  You are on <span className="font-mono">/demo</span> routes: charts and tables use built-in sample
                  data only.
                </>
              ) : useMock ? (
                <>
                  The UI is using mock data from <span className="font-mono">NEXT_PUBLIC_USE_MOCK_DATA</span>. Remove
                  it to talk to the real API, or open the{" "}
                  <a href="/demo" className="text-[#FC4C02] underline-offset-2 hover:underline">
                    /demo
                  </a>{" "}
                  routes for a guided sample experience.
                </>
              ) : health.status === "loading" ? (
                <>Checking server data source…</>
              ) : health.dataSource === "local" ? (
                <>
                  Server is using <strong>local file storage</strong> (no Google Cloud). Activities come from bundled
                  samples until you import GPX files.{" "}
                  <Link href="/import" className="text-[#FC4C02] underline-offset-2 hover:underline">
                    Import GPX
                  </Link>
                  .
                </>
              ) : health.dataSource === "bigquery" ? (
                <>
                  API routes read from <strong>BigQuery</strong> (warehouse + dbt marts). For free, self-hosted data
                  without Google Cloud, unset <span className="font-mono">BIGQUERY_PROJECT_ID</span> or set{" "}
                  <span className="font-mono">PACEWISE_DATA_SOURCE=local</span>. To force UI-only mock mode, set{" "}
                  <span className="font-mono">NEXT_PUBLIC_USE_MOCK_DATA=1</span> or open the{" "}
                  <a href="/demo" className="text-[#FC4C02] underline-offset-2 hover:underline">
                    live demo
                  </a>
                  .
                </>
              ) : (
                <>
                  Could not read the server data mode. Open <span className="font-mono">/api/health</span> to debug, or
                  check <span className="font-mono">PACEWISE_DATA_SOURCE</span> and{" "}
                  <span className="font-mono">BIGQUERY_PROJECT_ID</span>.
                </>
              )}
            </p>
            {!onDemoPath && !useMock && health.status === "done" && health.dataSource && (
              <p className="font-mono text-xs text-text-muted">Server reports: {health.dataSource}</p>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <GlowButton
              variant="ghost"
              onClick={() => window.open("/api/health", "_blank")}
            >
              Open /api/health
            </GlowButton>
            {!onDemoPath && !useMock && health.dataSource === "local" && (
              <Link href="/import">
                <GlowButton variant="primary">Import GPX</GlowButton>
              </Link>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <h2 className="font-sans text-sm font-medium uppercase tracking-wider text-text-muted">
            Heart rate zones (current model)
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-sans text-text-muted">
              HR zones are an approximation from <span className="font-mono">average_heartrate</span> per activity
              (GPX imports do not include per-second HR buckets). Moving time is split across Z1–Z5 using a max HR and
              zone thresholds—same idea as the dbt mart in BigQuery mode.
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-text-muted">
              <li>HR_MAX_BPM (default 190)</li>
              <li>HR_ZONE_Z1_MAX (default 0.60)</li>
              <li>HR_ZONE_Z2_MAX (default 0.70)</li>
              <li>HR_ZONE_Z3_MAX (default 0.80)</li>
              <li>HR_ZONE_Z4_MAX (default 0.90)</li>
            </ul>
            <p className="font-sans text-text-muted">
              In BigQuery mode these come from the dbt model <span className="font-mono">mart_hr_zones_weekly</span>; in
              local mode the API computes the same bucketing in TypeScript.
            </p>
          </div>
        </GlassCard>
      </section>
    </motion.div>
  );
}
