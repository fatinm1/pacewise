import Link from "next/link";
import { HolographicText } from "@/components/ui/HolographicText";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassCard } from "@/components/ui/GlassCard";

const FEATURES = [
  {
    title: "Production-grade ELT",
    body: "Incremental Strava ingestion into BigQuery with Airflow, dbt, and metadata tracking built in.",
  },
  {
    title: "Holographic dashboard",
    body: "Glassmorphism UI, Strava-orange glow, and holographic gradients tuned for athletes who love data.",
  },
  {
    title: "Training load insights",
    body: "Rolling 7-day vs 28-day load, acute:chronic ratio, and heart rate zones surfaced as first-class metrics.",
  },
];

const STACK = [
  "Python 3.11",
  "Apache Airflow 2.8",
  "Google BigQuery",
  "dbt-bigquery",
  "Next.js 14",
  "Tailwind CSS",
  "Framer Motion",
];

export default function LandingPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,23,42,0.85)] px-8 py-10 shadow-[0_0_40px_rgba(15,23,42,0.8)] scanline-overlay">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,76,2,0.16),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.22),transparent_55%)]" />
        <div className="relative z-10 grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-text-muted">
              PaceWise
              <span className="h-1 w-1 rounded-full bg-[#FC4C02] shadow-[0_0_10px_rgba(252,76,2,0.8)]" />
              Strava analytics pipeline
            </p>
            <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              <HolographicText animated>Own your pace data, end to end.</HolographicText>
            </h1>
            <p className="max-w-xl text-balance text-sm text-text-muted md:text-base">
              PaceWise turns raw Strava activities into a production-grade BigQuery warehouse and a
              holographic dashboard. Stop screenshotting the Strava app; start answering real training
              questions with your own SQL and charts.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/">
                <GlowButton variant="primary">Open dashboard</GlowButton>
              </Link>
              <Link href="https://github.com/fatinm1/pacewise" target="_blank">
                <GlowButton variant="ghost">View on GitHub</GlowButton>
              </Link>
            </div>
          </div>

          <div className="relative">
            <GlassCard className="relative overflow-hidden p-5" hover>
              <div className="mb-3 text-xs font-mono uppercase tracking-[0.2em] text-text-muted">
                From API to dashboard
              </div>
              <div className="text-xs font-mono text-text-muted">
                <div className="flex items-center">
                  <span className="w-24 text-text-muted">Strava API</span>
                  <span className="mx-2 text-text-muted">→</span>
                  <span className="w-28 text-text-primary">Python Extract</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-text-muted" />
                  <span className="mx-2 text-text-muted">→</span>
                  <span className="w-28 text-text-primary">BigQuery raw</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-text-muted" />
                  <span className="mx-2 text-text-muted">→</span>
                  <span className="w-28 text-text-primary">dbt marts</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-text-muted" />
                  <span className="mx-2 text-text-muted">→</span>
                  <span className="w-28 text-text-primary">Next.js dashboard</span>
                </div>
              </div>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <p className="mt-3 text-xs text-text-muted">
                Orchestrated by Airflow. Versioned and tested with dbt. Designed for athletes who are
                a little bit obsessed.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.25em] text-text-muted">
          Why PaceWise
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} className="p-5" hover>
              <h3 className="text-sm font-semibold text-text-primary">{f.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{f.body}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Stack strip */}
      <section>
        <GlassCard className="flex flex-wrap items-center gap-2 p-4" hover={false}>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-text-muted">
            Under the hood
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="flex flex-wrap gap-2">
            {STACK.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white/5 px-3 py-1 text-xs font-mono text-text-muted"
              >
                {item}
              </span>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

