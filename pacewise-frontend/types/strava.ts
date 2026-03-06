/**
 * Types matching PaceWise dbt mart schemas and API responses.
 */

export interface Activity {
  activity_id: number;
  activity_name: string | null;
  distance_meters: number;
  moving_time_seconds: number;
  elapsed_time_seconds: number;
  total_elevation_gain: number;
  activity_type: string;
  start_date: string; // ISO timestamp
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_speed_ms: number;
  pace_min_per_km: number | null;
}

export interface WeeklyPerformance {
  week_start: string; // ISO date
  total_distance_km: number;
  total_moving_time_hours: number;
  avg_pace_min_per_km: number | null;
  avg_heartrate: number | null;
  activity_count: number;
}

export interface TrainingLoadPoint {
  start_date: string;
  distance_km: number;
  rolling_7d_distance_km: number;
  rolling_28d_distance_km: number;
}

export interface PersonalBest {
  label: string;
  value: string;
  unit: string;
  activity_id?: number;
}

export interface HeartRateZoneBucket {
  week_start: string;
  zone_name: string;
  zone_color: string;
  minutes: number;
  percentage: number;
}

export interface PaceTrendPoint {
  week_start: string;
  avg_pace_min_per_km: number;
}

export interface AthleteSummary {
  name: string;
  avatar_url: string | null;
  member_since: string;
  total_activities: number;
  last_sync_at: string | null;
}
