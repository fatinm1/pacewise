/**
 * Typed API client for PaceWise backend.
 * Uses mock data when backend is not connected so the UI works standalone.
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

const MOCK_ACTIVITIES: Activity[] = [
  {
    activity_id: 1,
    activity_name: "Morning Run",
    distance_meters: 10000,
    moving_time_seconds: 2700,
    elapsed_time_seconds: 2720,
    total_elevation_gain: 85,
    activity_type: "Run",
    start_date: "2025-03-04T07:00:00Z",
    average_heartrate: 152,
    max_heartrate: 168,
    average_speed_ms: 3.7,
    pace_min_per_km: 4.5,
  },
  {
    activity_id: 2,
    activity_name: "Long Run",
    distance_meters: 21097,
    moving_time_seconds: 6300,
    elapsed_time_seconds: 6360,
    total_elevation_gain: 120,
    activity_type: "Run",
    start_date: "2025-03-02T08:30:00Z",
    average_heartrate: 148,
    max_heartrate: 165,
    average_speed_ms: 3.35,
    pace_min_per_km: 4.97,
  },
  {
    activity_id: 3,
    activity_name: "Recovery Run",
    distance_meters: 5000,
    moving_time_seconds: 1500,
    elapsed_time_seconds: 1520,
    total_elevation_gain: 25,
    activity_type: "Run",
    start_date: "2025-03-01T18:00:00Z",
    average_heartrate: 138,
    max_heartrate: 152,
    average_speed_ms: 3.33,
    pace_min_per_km: 5.0,
  },
  {
    activity_id: 4,
    activity_name: "Tempo Run",
    distance_meters: 8000,
    moving_time_seconds: 1920,
    elapsed_time_seconds: 1940,
    total_elevation_gain: 40,
    activity_type: "Run",
    start_date: "2025-02-28T06:45:00Z",
    average_heartrate: 162,
    max_heartrate: 178,
    average_speed_ms: 4.17,
    pace_min_per_km: 4.0,
  },
  {
    activity_id: 5,
    activity_name: "Easy Ride",
    distance_meters: 35000,
    moving_time_seconds: 5400,
    elapsed_time_seconds: 5520,
    total_elevation_gain: 200,
    activity_type: "Ride",
    start_date: "2025-02-27T10:00:00Z",
    average_heartrate: 132,
    max_heartrate: 148,
    average_speed_ms: 6.48,
    pace_min_per_km: 2.57,
  },
  {
    activity_id: 6,
    activity_name: "5K Test",
    distance_meters: 5000,
    moving_time_seconds: 1140,
    elapsed_time_seconds: 1160,
    total_elevation_gain: 15,
    activity_type: "Run",
    start_date: "2025-02-25T07:15:00Z",
    average_heartrate: 172,
    max_heartrate: 185,
    average_speed_ms: 4.39,
    pace_min_per_km: 3.8,
  },
  {
    activity_id: 7,
    activity_name: "Swim",
    distance_meters: 2000,
    moving_time_seconds: 2400,
    elapsed_time_seconds: 2700,
    total_elevation_gain: 0,
    activity_type: "Swim",
    start_date: "2025-02-24T17:00:00Z",
    average_heartrate: 128,
    max_heartrate: 142,
    average_speed_ms: 0.83,
    pace_min_per_km: 20.0,
  },
  {
    activity_id: 8,
    activity_name: "Trail Run",
    distance_meters: 15000,
    moving_time_seconds: 4500,
    elapsed_time_seconds: 4620,
    total_elevation_gain: 350,
    activity_type: "Run",
    start_date: "2025-02-22T09:00:00Z",
    average_heartrate: 155,
    max_heartrate: 172,
    average_speed_ms: 3.33,
    pace_min_per_km: 5.0,
  },
  {
    activity_id: 9,
    activity_name: "Intervals",
    distance_meters: 12000,
    moving_time_seconds: 3000,
    elapsed_time_seconds: 3600,
    total_elevation_gain: 60,
    activity_type: "Run",
    start_date: "2025-02-20T06:30:00Z",
    average_heartrate: 165,
    max_heartrate: 182,
    average_speed_ms: 4.0,
    pace_min_per_km: 4.17,
  },
  {
    activity_id: 10,
    activity_name: "Long Run",
    distance_meters: 25000,
    moving_time_seconds: 7500,
    elapsed_time_seconds: 7620,
    total_elevation_gain: 180,
    activity_type: "Run",
    start_date: "2025-02-18T08:00:00Z",
    average_heartrate: 145,
    max_heartrate: 162,
    average_speed_ms: 3.33,
    pace_min_per_km: 5.0,
  },
];

const MOCK_WEEKLY: WeeklyPerformance[] = [
  { week_start: "2025-02-17", total_distance_km: 42, total_moving_time_hours: 4.2, avg_pace_min_per_km: 4.8, avg_heartrate: 152, activity_count: 5 },
  { week_start: "2025-02-24", total_distance_km: 38, total_moving_time_hours: 3.9, avg_pace_min_per_km: 5.0, avg_heartrate: 148, activity_count: 4 },
  { week_start: "2025-03-03", total_distance_km: 36, total_moving_time_hours: 3.5, avg_pace_min_per_km: 4.9, avg_heartrate: 150, activity_count: 4 },
];

const MOCK_TRAINING_LOAD: TrainingLoadPoint[] = [
  { start_date: "2025-02-18", distance_km: 25, rolling_7d_distance_km: 52, rolling_28d_distance_km: 145 },
  { start_date: "2025-02-20", distance_km: 12, rolling_7d_distance_km: 48, rolling_28d_distance_km: 152 },
  { start_date: "2025-02-22", distance_km: 15, rolling_7d_distance_km: 55, rolling_28d_distance_km: 158 },
  { start_date: "2025-02-24", distance_km: 2, rolling_7d_distance_km: 42, rolling_28d_distance_km: 162 },
  { start_date: "2025-02-25", distance_km: 5, rolling_7d_distance_km: 38, rolling_28d_distance_km: 165 },
  { start_date: "2025-02-27", distance_km: 35, rolling_7d_distance_km: 52, rolling_28d_distance_km: 168 },
  { start_date: "2025-02-28", distance_km: 8, rolling_7d_distance_km: 58, rolling_28d_distance_km: 172 },
  { start_date: "2025-03-01", distance_km: 5, rolling_7d_distance_km: 55, rolling_28d_distance_km: 175 },
  { start_date: "2025-03-02", distance_km: 21, rolling_7d_distance_km: 62, rolling_28d_distance_km: 178 },
  { start_date: "2025-03-04", distance_km: 10, rolling_7d_distance_km: 59, rolling_28d_distance_km: 182 },
];

const MOCK_PERSONAL_BESTS: PersonalBest[] = [
  { label: "Best 5K Pace", value: "3:48", unit: "min/km", activity_id: 6 },
  { label: "Longest Run", value: "25.0", unit: "km", activity_id: 10 },
  { label: "Most Elevation", value: "350", unit: "m", activity_id: 8 },
  { label: "Highest HR", value: "185", unit: "bpm", activity_id: 6 },
];

const MOCK_HR_ZONES: HeartRateZoneBucket[] = [
  { week_start: "2025-02-17", zone_name: "Z1", zone_color: "#06b6d4", minutes: 60, percentage: 25 },
  { week_start: "2025-02-17", zone_name: "Z2", zone_color: "#6366f1", minutes: 90, percentage: 38 },
  { week_start: "2025-02-17", zone_name: "Z3", zone_color: "#a855f7", minutes: 50, percentage: 21 },
  { week_start: "2025-02-17", zone_name: "Z4", zone_color: "#f43f5e", minutes: 30, percentage: 12 },
  { week_start: "2025-02-17", zone_name: "Z5", zone_color: "#FC4C02", minutes: 10, percentage: 4 },
  { week_start: "2025-02-24", zone_name: "Z1", zone_color: "#06b6d4", minutes: 45, percentage: 20 },
  { week_start: "2025-02-24", zone_name: "Z2", zone_color: "#6366f1", minutes: 100, percentage: 43 },
  { week_start: "2025-02-24", zone_name: "Z3", zone_color: "#a855f7", minutes: 55, percentage: 24 },
  { week_start: "2025-02-24", zone_name: "Z4", zone_color: "#f43f5e", minutes: 25, percentage: 11 },
  { week_start: "2025-02-24", zone_name: "Z5", zone_color: "#FC4C02", minutes: 8, percentage: 2 },
];

const MOCK_PACE_TREND: PaceTrendPoint[] = [
  { week_start: "2025-02-17", avg_pace_min_per_km: 4.85 },
  { week_start: "2025-02-24", avg_pace_min_per_km: 5.02 },
  { week_start: "2025-03-03", avg_pace_min_per_km: 4.92 },
];

const MOCK_ATHLETE: AthleteSummary = {
  name: "PaceWise Athlete",
  avatar_url: null,
  member_since: "2024-01-15",
  total_activities: 127,
  last_sync_at: new Date().toISOString(),
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchApi<T>(path: string): Promise<T> {
  if (!API_BASE) {
    return Promise.resolve(getMock(path) as T);
  }
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

function getMock(path: string): unknown {
  if (path.includes("activities")) return MOCK_ACTIVITIES;
  if (path.includes("weekly")) return MOCK_WEEKLY;
  if (path.includes("training-load")) return MOCK_TRAINING_LOAD;
  if (path.includes("personal-bests")) return MOCK_PERSONAL_BESTS;
  if (path.includes("heart-rate-zones")) return MOCK_HR_ZONES;
  if (path.includes("pace-trend")) return MOCK_PACE_TREND;
  if (path.includes("athlete")) return MOCK_ATHLETE;
  return [];
}

export async function getActivities(params?: { type?: string; limit?: number }): Promise<Activity[]> {
  const path = API_BASE ? `/api/activities?${new URLSearchParams(params as Record<string, string>)}` : "activities";
  const data = await fetchApi<Activity[]>(path);
  const list = (data || MOCK_ACTIVITIES) as Activity[];
  if (params?.type && params.type !== "All") {
    return list.filter((a) => a.activity_type === params.type).slice(0, params?.limit ?? 50);
  }
  return (params?.limit ? list.slice(0, params.limit) : list) as Activity[];
}

export async function getWeeklyPerformance(): Promise<WeeklyPerformance[]> {
  const data = await fetchApi<WeeklyPerformance[]>(API_BASE ? "/api/weekly" : "weekly");
  return (data || MOCK_WEEKLY) as WeeklyPerformance[];
}

export async function getTrainingLoad(): Promise<TrainingLoadPoint[]> {
  const data = await fetchApi<TrainingLoadPoint[]>(API_BASE ? "/api/training-load" : "training-load");
  return (data || MOCK_TRAINING_LOAD) as TrainingLoadPoint[];
}

export async function getPersonalBests(): Promise<PersonalBest[]> {
  const data = await fetchApi<PersonalBest[]>(API_BASE ? "/api/personal-bests" : "personal-bests");
  return (data || MOCK_PERSONAL_BESTS) as PersonalBest[];
}

export async function getHeartRateZones(): Promise<HeartRateZoneBucket[]> {
  const data = await fetchApi<HeartRateZoneBucket[]>(API_BASE ? "/api/heart-rate-zones" : "heart-rate-zones");
  return (data || MOCK_HR_ZONES) as HeartRateZoneBucket[];
}

export async function getPaceTrend(): Promise<PaceTrendPoint[]> {
  const data = await fetchApi<PaceTrendPoint[]>(API_BASE ? "/api/pace-trend" : "pace-trend");
  return (data || MOCK_PACE_TREND) as PaceTrendPoint[];
}

export async function getAthlete(): Promise<AthleteSummary> {
  const data = await fetchApi<AthleteSummary>(API_BASE ? "/api/athlete" : "athlete");
  return (data || MOCK_ATHLETE) as AthleteSummary;
}
