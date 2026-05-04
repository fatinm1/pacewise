/**
 * Typed API client for PaceWise backend.
 * Uses mock data when backend is not connected so the UI works standalone.
 * `/demo/*` routes use mock data in the browser (no BigQuery required for the UI).
 */

import type {
  Activity,
  WeeklyPerformance,
  TrainingLoadPoint,
  PersonalBest,
  HeartRateZoneBucket,
  PaceTrendPoint,
  AthleteSummary,
} from "@/types/strava";
import { getMockForApiPath } from "@/lib/mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const USE_MOCK =
  (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? "").toLowerCase() === "1" ||
  (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? "").toLowerCase() === "true";

function isBrowserDemoPath(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/demo");
}

async function fetchApi<T>(path: string): Promise<T> {
  if (USE_MOCK || isBrowserDemoPath()) {
    return Promise.resolve(getMockForApiPath(path) as T);
  }

  // If API_BASE is unset, default to same-origin Next.js route handlers.
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getActivities(params?: { type?: string; limit?: number }): Promise<Activity[]> {
  const sp = new URLSearchParams();
  if (params?.type && params.type !== "All") sp.set("type", params.type);
  if (typeof params?.limit === "number") sp.set("limit", String(params.limit));
  const path = `/api/activities${sp.toString() ? `?${sp.toString()}` : ""}`;
  return fetchApi<Activity[]>(path);
}

export async function getWeeklyPerformance(): Promise<WeeklyPerformance[]> {
  return fetchApi<WeeklyPerformance[]>("/api/weekly");
}

export async function getTrainingLoad(): Promise<TrainingLoadPoint[]> {
  return fetchApi<TrainingLoadPoint[]>("/api/training-load");
}

export async function getPersonalBests(): Promise<PersonalBest[]> {
  return fetchApi<PersonalBest[]>("/api/personal-bests");
}

export async function getHeartRateZones(): Promise<HeartRateZoneBucket[]> {
  return fetchApi<HeartRateZoneBucket[]>("/api/heart-rate-zones");
}

export async function getPaceTrend(): Promise<PaceTrendPoint[]> {
  return fetchApi<PaceTrendPoint[]>("/api/pace-trend");
}

export async function getAthlete(): Promise<AthleteSummary> {
  return fetchApi<AthleteSummary>("/api/athlete");
}
