import "server-only";

import type {
  Activity,
  AthleteSummary,
  HeartRateZoneBucket,
  PaceTrendPoint,
  PersonalBest,
  TrainingLoadPoint,
  WeeklyPerformance,
} from "@/types/strava";

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function parseYmd(s: string): number {
  return new Date(s + "T12:00:00.000Z").getTime();
}

function addDaysYmd(ymd: string, delta: number): string {
  const d = new Date(ymd + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Monday-based ISO date (YYYY-MM-DD) for week bucket. */
function weekStartMondayUtc(iso: string): string {
  const d = new Date(iso);
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return mon.toISOString().slice(0, 10);
}

function paceFromSpeedMs(speedMs: number): number | null {
  if (!speedMs || speedMs <= 0) return null;
  return (1000 / speedMs / 60) * 1.0;
}

export function localListActivities(
  activities: Activity[],
  opts: { type?: string | null; limit: number }
): Activity[] {
  let rows = [...activities];
  if (opts.type && opts.type !== "All") {
    rows = rows.filter((a) => a.activity_type === opts.type);
  }
  rows.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  return rows.slice(0, opts.limit).map((a) => ({ ...a }));
}

export function localWeeklyPerformance(activities: Activity[]): WeeklyPerformance[] {
  const runs = activities.filter((a) => a.activity_type === "Run");
  const byWeek = new Map<string, Activity[]>();
  for (const a of runs) {
    const w = weekStartMondayUtc(a.start_date);
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(a);
  }
  const out: WeeklyPerformance[] = [];
  Array.from(byWeek.entries()).forEach(([week_start, list]) => {
    const total_distance_km = list.reduce((s, a) => s + a.distance_meters / 1000, 0);
    const total_moving_time_hours = list.reduce((s, a) => s + a.moving_time_seconds / 3600, 0);
    const paces = list.map((a) => a.pace_min_per_km).filter((p): p is number => p != null && p > 0);
    const avg_pace_min_per_km = paces.length ? paces.reduce((s, p) => s + p, 0) / paces.length : null;
    const hrs = list.map((a) => a.average_heartrate).filter((h): h is number => h != null);
    const avg_heartrate = hrs.length ? hrs.reduce((s, h) => s + h, 0) / hrs.length : null;
    out.push({
      week_start,
      total_distance_km,
      total_moving_time_hours,
      avg_pace_min_per_km,
      avg_heartrate,
      activity_count: list.length,
    });
  });
  out.sort((a, b) => a.week_start.localeCompare(b.week_start));
  return out;
}

export function localPaceTrend(activities: Activity[]): PaceTrendPoint[] {
  return localWeeklyPerformance(activities)
    .filter((w) => w.avg_pace_min_per_km != null)
    .map((w) => ({
      week_start: w.week_start,
      avg_pace_min_per_km: w.avg_pace_min_per_km as number,
    }));
}

/** Calendar-day rolling windows aligned with dbt mart_training_load (7 / 28 days inclusive). */
export function localTrainingLoad(activities: Activity[]): TrainingLoadPoint[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const out: TrainingLoadPoint[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = dateOnly(sorted[i].start_date);
    const curT = parseYmd(cur);
    const min7 = parseYmd(addDaysYmd(cur, -6));
    const min28 = parseYmd(addDaysYmd(cur, -27));
    let roll7 = 0;
    let roll28 = 0;
    for (const a of sorted) {
      const d = parseYmd(dateOnly(a.start_date));
      const km = a.distance_meters / 1000;
      if (d >= min7 && d <= curT) roll7 += km;
      if (d >= min28 && d <= curT) roll28 += km;
    }
    out.push({
      start_date: cur,
      distance_km: sorted[i].distance_meters / 1000,
      rolling_7d_distance_km: roll7,
      rolling_28d_distance_km: roll28,
    });
  }
  return out;
}

export function localPersonalBests(activities: Activity[]): PersonalBest[] {
  const runs = activities.filter((a) => a.activity_type === "Run");
  const out: PersonalBest[] = [];

  const fiveK = runs.filter((a) => a.distance_meters >= 5000 && a.pace_min_per_km != null);
  if (fiveK.length) {
    const best = fiveK.reduce((a, b) => (a.pace_min_per_km! <= b.pace_min_per_km! ? a : b));
    out.push({
      label: "Best 5K Pace",
      value: (best.pace_min_per_km as number).toFixed(2),
      unit: "min/km",
      activity_id: best.activity_id,
    });
  }

  const withDist = runs.filter((a) => a.distance_meters != null);
  if (withDist.length) {
    const best = withDist.reduce((a, b) => (a.distance_meters >= b.distance_meters ? a : b));
    out.push({
      label: "Longest Run",
      value: (best.distance_meters / 1000).toFixed(1),
      unit: "km",
      activity_id: best.activity_id,
    });
  }

  const withElev = runs.filter((a) => a.total_elevation_gain != null);
  if (withElev.length) {
    const best = withElev.reduce((a, b) =>
      (a.total_elevation_gain ?? 0) >= (b.total_elevation_gain ?? 0) ? a : b
    );
    out.push({
      label: "Most Elevation",
      value: String(Math.round(best.total_elevation_gain ?? 0)),
      unit: "m",
      activity_id: best.activity_id,
    });
  }

  const withHr = runs.filter((a) => a.average_heartrate != null);
  if (withHr.length) {
    const best = withHr.reduce((a, b) =>
      (a.average_heartrate ?? 0) >= (b.average_heartrate ?? 0) ? a : b
    );
    out.push({
      label: "Highest Avg HR",
      value: String(Math.round(best.average_heartrate ?? 0)),
      unit: "bpm",
      activity_id: best.activity_id,
    });
  }

  return out;
}

function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function localHeartRateZones(activities: Activity[]): HeartRateZoneBucket[] {
  const maxHr = envNum("HR_MAX_BPM", 190);
  const z1 = envNum("HR_ZONE_Z1_MAX", 0.6);
  const z2 = envNum("HR_ZONE_Z2_MAX", 0.7);
  const z3 = envNum("HR_ZONE_Z3_MAX", 0.8);
  const z4 = envNum("HR_ZONE_Z4_MAX", 0.9);

  const zoneColor: Record<string, string> = {
    Z1: "#06b6d4",
    Z2: "#6366f1",
    Z3: "#a855f7",
    Z4: "#f43f5e",
    Z5: "#FC4C02",
  };

  type Row = { week_start: string; zone_name: string; minutes: number };
  const rows: Row[] = [];

  for (const a of activities) {
    if (a.average_heartrate == null || a.moving_time_seconds <= 0) continue;
    const week = weekStartMondayUtc(a.start_date);
    const minutes = a.moving_time_seconds / 60;
    const hr = a.average_heartrate;
    let zone: string;
    if (hr <= maxHr * z1) zone = "Z1";
    else if (hr <= maxHr * z2) zone = "Z2";
    else if (hr <= maxHr * z3) zone = "Z3";
    else if (hr <= maxHr * z4) zone = "Z4";
    else zone = "Z5";
    rows.push({ week_start: week, zone_name: zone, minutes });
  }

  const weekTotals = new Map<string, number>();
  const weekZone = new Map<string, Map<string, number>>();
  for (const r of rows) {
    weekTotals.set(r.week_start, (weekTotals.get(r.week_start) ?? 0) + r.minutes);
    if (!weekZone.has(r.week_start)) weekZone.set(r.week_start, new Map());
    const zm = weekZone.get(r.week_start)!;
    zm.set(r.zone_name, (zm.get(r.zone_name) ?? 0) + r.minutes);
  }

  const out: HeartRateZoneBucket[] = [];
  Array.from(weekZone.entries()).forEach(([week_start, zm]) => {
    const total = weekTotals.get(week_start) ?? 0;
    Array.from(zm.entries()).forEach(([zone_name, minutes]) => {
      out.push({
        week_start,
        zone_name,
        zone_color: zoneColor[zone_name] ?? "#94a3b8",
        minutes,
        percentage: total > 0 ? (minutes / total) * 100 : 0,
      });
    });
  });
  out.sort((a, b) => a.week_start.localeCompare(b.week_start) || a.zone_name.localeCompare(b.zone_name));
  return out;
}

export function localAthleteSummary(
  activities: Activity[],
  opts: { lastImportAt: string | null }
): AthleteSummary {
  const name = process.env.PACEWISE_ATHLETE_NAME?.trim() || "Local Athlete";
  if (activities.length === 0) {
    return {
      name,
      avatar_url: null,
      member_since: new Date().toISOString().slice(0, 10),
      total_activities: 0,
      last_sync_at: opts.lastImportAt,
    };
  }
  const dates = activities.map((a) => new Date(a.start_date).getTime());
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  return {
    name,
    avatar_url: null,
    member_since: min.toISOString().slice(0, 10),
    total_activities: activities.length,
    last_sync_at: opts.lastImportAt ?? max.toISOString(),
  };
}

/** Build Activity row from GPX-derived metrics (open GPX 1.1; no proprietary APIs). */
export function buildActivityFromGpxMetrics(input: {
  activity_id: number;
  name: string;
  activity_type: string;
  start_date_iso: string;
  distance_meters: number;
  moving_time_seconds: number;
  elapsed_time_seconds: number;
  total_elevation_gain: number;
}): Activity {
  const average_speed_ms =
    input.moving_time_seconds > 0 ? input.distance_meters / input.moving_time_seconds : 0;
  return {
    activity_id: input.activity_id,
    activity_name: input.name,
    distance_meters: input.distance_meters,
    moving_time_seconds: input.moving_time_seconds,
    elapsed_time_seconds: input.elapsed_time_seconds,
    total_elevation_gain: input.total_elevation_gain,
    activity_type: input.activity_type,
    start_date: input.start_date_iso,
    average_heartrate: null,
    max_heartrate: null,
    average_speed_ms,
    pace_min_per_km: paceFromSpeedMs(average_speed_ms),
  };
}
