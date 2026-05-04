import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PaceWise — Demo (sample data)",
  description: "Explore the PaceWise dashboard with built-in sample activities and charts.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#FC4C02]/30 bg-[#FC4C02]/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-primary">
          <span className="font-mono text-xs uppercase tracking-wider text-[#FC4C02]">Demo mode</span>
          <span className="mx-2 text-text-muted">·</span>
          All metrics below use <strong className="font-medium text-text-primary">sample data</strong>—no Strava or
          BigQuery required.
        </p>
        <Link
          href="/landing"
          className="shrink-0 text-sm font-medium text-[#FC4C02] underline-offset-4 hover:underline"
        >
          Back to marketing
        </Link>
      </div>
      {children}
    </>
  );
}
