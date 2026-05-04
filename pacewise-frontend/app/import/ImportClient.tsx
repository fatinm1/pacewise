"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";

const ACTIVITY_TYPES = ["Run", "Ride", "Walk", "Hike", "Swim"] as const;

export function ImportClient({ allowImport }: { allowImport: boolean }) {
  const [type, setType] = useState<string>("Run");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose a .gpx file first.");
      return;
    }
    if (!allowImport) {
      setError("GPX import is disabled while BigQuery mode is active.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("type", type);
      const res = await fetch("/api/import/gpx", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        activity_name?: string;
        activity_id?: number;
      };
      if (!res.ok) {
        setError(data.error ?? `Import failed (${res.status})`);
        return;
      }
      setMessage(
        `Imported “${data.activity_name ?? "activity"}” (id ${data.activity_id}). Open the dashboard to see updated charts.`
      );
      input.value = "";
    } catch {
      setError("Network error while uploading.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">Import GPX</h1>
        <p className="mt-1 font-sans text-text-muted">
          Add activities from open <span className="font-mono">GPX 1.1</span> files—no paid APIs. Export a GPX from
          OpenTracks, Garmin Connect, Strava (free export), or any tool that writes standard track points with times.
        </p>
      </div>

      {!allowImport && (
        <GlassCard className="border-amber-500/30 bg-amber-500/10 p-4" hover={false}>
          <p className="text-sm text-text-primary">
            This deployment is using <strong>BigQuery</strong> as the data source. To use file-based storage and GPX
            import, unset <span className="font-mono">BIGQUERY_PROJECT_ID</span> or set{" "}
            <span className="font-mono">PACEWISE_DATA_SOURCE=local</span> and redeploy.
          </p>
        </GlassCard>
      )}

      <GlassCard className="p-6" hover={false}>
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-muted">
          <Upload size={18} className="text-[#FC4C02]" />
          Upload track
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted">Activity type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary outline-none focus:border-[#FC4C02]/50"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted">GPX file</label>
            <input
              name="file"
              type="file"
              accept=".gpx,application/gpx+xml"
              className="mt-2 block w-full text-sm text-text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-text-primary"
            />
          </div>
          <GlowButton type="submit" variant="primary" disabled={busy || !allowImport}>
            {busy ? "Importing…" : "Import"}
          </GlowButton>
        </form>
        {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      </GlassCard>

      <GlassCard className="p-6" hover={false}>
        <h2 className="text-sm font-medium uppercase tracking-wider text-text-muted">How it works</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-text-muted">
          <li>Distance uses the haversine formula between consecutive track points (same idea as many open-source parsers).</li>
          <li>Duration uses the first and last <span className="font-mono">&lt;time&gt;</span> on the track.</li>
          <li>Elevation gain sums positive differences when <span className="font-mono">&lt;ele&gt;</span> is present.</li>
          <li>Data is stored in <span className="font-mono">data/activities.json</span> (or <span className="font-mono">PACEWISE_LOCAL_DATA_PATH</span>) on the server.</li>
        </ul>
      </GlassCard>
    </motion.div>
  );
}
