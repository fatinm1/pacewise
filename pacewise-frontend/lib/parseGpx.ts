import "server-only";

import { XMLParser } from "fast-xml-parser";
import { buildActivityFromGpxMetrics } from "@/lib/localAggregates";
import type { Activity } from "@/types/strava";

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, a)));
}

export interface ParsedGpxTrack {
  points: { lat: number; lon: number; ele: number | null; time: string | null }[];
  name: string | null;
}

export function parseGpxXml(xml: string): ParsedGpxTrack {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const gpx = (doc.gpx ?? doc.GPX) as Record<string, unknown> | undefined;
  if (!gpx) {
    throw new Error("Not a GPX document (missing root <gpx> element).");
  }

  const tracks = asArray(gpx.trk as Record<string, unknown> | Record<string, unknown>[] | undefined);
  if (!tracks.length) {
    throw new Error("No <trk> segments found in GPX.");
  }

  const points: ParsedGpxTrack["points"] = [];
  let name: string | null = null;

  for (const trk of tracks) {
    const t = trk as Record<string, unknown>;
    if (!name && typeof t.name === "string") name = t.name;
    const segments = asArray(t.trkseg as Record<string, unknown> | undefined);
    for (const seg of segments) {
      const segObj = seg as Record<string, unknown>;
      const pts = asArray(segObj.trkpt as Record<string, unknown> | undefined);
      for (const p of pts) {
        const pt = p as Record<string, unknown>;
        const lat = toNum(pt["@_lat"]);
        const lon = toNum(pt["@_lon"]);
        if (lat == null || lon == null) continue;
        const ele = toNum(pt.ele ?? (pt as { Ele?: unknown }).Ele);
        const time =
          typeof pt.time === "string"
            ? pt.time
            : typeof (pt as { Time?: unknown }).Time === "string"
              ? ((pt as { Time: string }).Time as string)
              : null;
        points.push({ lat, lon, ele, time });
      }
    }
  }

  return { points, name };
}

export function activityFromGpx(
  xml: string,
  opts: { activity_id: number; fallbackName: string; activity_type?: string }
): Activity {
  const { points, name } = parseGpxXml(xml);
  if (points.length < 2) {
    throw new Error("GPX track needs at least two points with valid lat/lon.");
  }

  let distance = 0;
  let elevGain = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    distance += haversineMeters(a.lat, a.lon, b.lat, b.lon);
    if (a.ele != null && b.ele != null && b.ele > a.ele) {
      elevGain += b.ele - a.ele;
    }
  }

  const times = points.map((p) => p.time).filter((t): t is string => !!t);
  if (times.length < 2) {
    throw new Error("GPX track needs <time> on points to compute duration (open GPX 1.1).");
  }
  const t0 = new Date(times[0]).getTime();
  const t1 = new Date(times[times.length - 1]).getTime();
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) {
    throw new Error("Invalid timestamps in GPX.");
  }
  const elapsedSec = Math.round((t1 - t0) / 1000);
  const movingSec = Math.max(1, elapsedSec);

  const start = times[0];
  const label = name?.trim() || opts.fallbackName.replace(/\.gpx$/i, "");
  const type = opts.activity_type?.trim() || "Run";

  return buildActivityFromGpxMetrics({
    activity_id: opts.activity_id,
    name: label,
    activity_type: type,
    start_date_iso: new Date(start).toISOString(),
    distance_meters: Math.round(distance),
    moving_time_seconds: movingSec,
    elapsed_time_seconds: elapsedSec,
    total_elevation_gain: Math.round(elevGain * 10) / 10,
  });
}
