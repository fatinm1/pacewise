import "server-only";

import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import { resolveServerDataSource } from "@/lib/dataSource";
import {
  localAthleteSummary,
  localHeartRateZones,
  localListActivities,
  localPaceTrend,
  localPersonalBests,
  localTrainingLoad,
  localWeeklyPerformance,
} from "@/lib/localAggregates";
import { getStoreMeta, loadActivities } from "@/lib/localActivitiesStore";
import type {
  Activity,
  AthleteSummary,
  HeartRateZoneBucket,
  PaceTrendPoint,
  PersonalBest,
  TrainingLoadPoint,
  WeeklyPerformance,
} from "@/types/strava";

export async function serverGetActivities(params: {
  type: string | null;
  limit: number;
}): Promise<Activity[]> {
  if (resolveServerDataSource() === "local") {
    return localListActivities(loadActivities(), {
      type: params.type && params.type !== "All" ? params.type : null,
      limit: params.limit,
    });
  }
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) return [];
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(activity_id as int64) as activity_id,
      cast(activity_name as string) as activity_name,
      cast(distance_meters as float64) as distance_meters,
      cast(moving_time_seconds as int64) as moving_time_seconds,
      cast(elapsed_time_seconds as int64) as elapsed_time_seconds,
      cast(total_elevation_gain as float64) as total_elevation_gain,
      cast(activity_type as string) as activity_type,
      cast(start_date as string) as start_date,
      cast(average_heartrate as float64) as average_heartrate,
      cast(max_heartrate as float64) as max_heartrate,
      cast(average_speed_ms as float64) as average_speed_ms,
      cast(pace_min_per_km as float64) as pace_min_per_km
    from \`${projectId}.${dataset}.stg_activities\`
    where (@type is null or activity_type = @type)
    order by start_date desc
    limit @limit
  `;
  return queryBigQuery<Activity>(sql, {
    type: params.type && params.type !== "All" ? params.type : null,
    limit: params.limit,
  });
}

export async function serverGetWeekly(): Promise<WeeklyPerformance[]> {
  if (resolveServerDataSource() === "local") {
    return localWeeklyPerformance(loadActivities());
  }
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) return [];
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(week_start as string) as week_start,
      cast(total_distance_km as float64) as total_distance_km,
      cast(total_moving_time_hours as float64) as total_moving_time_hours,
      cast(avg_pace_min_per_km as float64) as avg_pace_min_per_km,
      cast(avg_heartrate as float64) as avg_heartrate,
      cast(activity_count as int64) as activity_count
    from \`${projectId}.${dataset}.mart_athlete_performance\`
    order by week_start
  `;
  return queryBigQuery<WeeklyPerformance>(sql);
}

export async function serverGetTrainingLoad(): Promise<TrainingLoadPoint[]> {
  if (resolveServerDataSource() === "local") {
    return localTrainingLoad(loadActivities());
  }
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) return [];
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(start_date as string) as start_date,
      cast(distance_km as float64) as distance_km,
      cast(rolling_7d_distance_km as float64) as rolling_7d_distance_km,
      cast(rolling_28d_distance_km as float64) as rolling_28d_distance_km
    from \`${projectId}.${dataset}.mart_training_load\`
    order by start_date
  `;
  return queryBigQuery<TrainingLoadPoint>(sql);
}

export async function serverGetPaceTrend(): Promise<PaceTrendPoint[]> {
  if (resolveServerDataSource() === "local") {
    return localPaceTrend(loadActivities());
  }
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) return [];
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(week_start as string) as week_start,
      cast(avg_pace_min_per_km as float64) as avg_pace_min_per_km
    from \`${projectId}.${dataset}.mart_athlete_performance\`
    where avg_pace_min_per_km is not null
    order by week_start
  `;
  return queryBigQuery<PaceTrendPoint>(sql);
}

export async function serverGetHeartRateZones(): Promise<HeartRateZoneBucket[]> {
  if (resolveServerDataSource() === "local") {
    return localHeartRateZones(loadActivities());
  }
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) return [];
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(week_start as string) as week_start,
      cast(zone_name as string) as zone_name,
      cast(zone_color as string) as zone_color,
      cast(minutes as float64) as minutes,
      cast(percentage as float64) as percentage
    from \`${projectId}.${dataset}.mart_hr_zones_weekly\`
    order by week_start, zone_name
  `;
  return queryBigQuery<HeartRateZoneBucket>(sql);
}

export async function serverGetPersonalBests(): Promise<PersonalBest[]> {
  if (resolveServerDataSource() === "local") {
    return localPersonalBests(loadActivities());
  }
  const project = process.env.BIGQUERY_PROJECT_ID;
  if (!project) return [];
  const dataset = getAnalyticsDatasetId();
  const sql = `
    with runs as (
      select
        activity_id,
        activity_name,
        distance_meters,
        total_elevation_gain,
        average_heartrate,
        pace_min_per_km
      from \`${project}.${dataset}.stg_activities\`
      where activity_type = 'Run'
    ),
    best_5k as (
      select
        'Best 5K Pace' as label,
        format('%.2f', min(pace_min_per_km)) as value,
        'min/km' as unit,
        cast((array_agg(activity_id order by pace_min_per_km asc limit 1))[offset(0)] as int64) as activity_id
      from runs
      where distance_meters >= 5000 and pace_min_per_km is not null
    ),
    longest_run as (
      select
        'Longest Run' as label,
        format('%.1f', max(distance_meters) / 1000.0) as value,
        'km' as unit,
        cast((array_agg(activity_id order by distance_meters desc limit 1))[offset(0)] as int64) as activity_id
      from runs
      where distance_meters is not null
    ),
    most_elev as (
      select
        'Most Elevation' as label,
        format('%.0f', max(total_elevation_gain)) as value,
        'm' as unit,
        cast((array_agg(activity_id order by total_elevation_gain desc limit 1))[offset(0)] as int64) as activity_id
      from runs
      where total_elevation_gain is not null
    ),
    highest_hr as (
      select
        'Highest Avg HR' as label,
        format('%.0f', max(average_heartrate)) as value,
        'bpm' as unit,
        cast((array_agg(activity_id order by average_heartrate desc limit 1))[offset(0)] as int64) as activity_id
      from runs
      where average_heartrate is not null
    )
    select * from best_5k
    union all select * from longest_run
    union all select * from most_elev
    union all select * from highest_hr
  `;
  return queryBigQuery<PersonalBest>(sql);
}

export async function serverGetAthlete(): Promise<AthleteSummary | null> {
  if (resolveServerDataSource() === "local") {
    const meta = getStoreMeta();
    return localAthleteSummary(loadActivities(), { lastImportAt: meta.last_import_at });
  }
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) {
    return {
      name: "PaceWise Athlete",
      avatar_url: null,
      member_since: new Date().toISOString().slice(0, 10),
      total_activities: 0,
      last_sync_at: null,
    };
  }
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(name as string) as name,
      cast(avatar_url as string) as avatar_url,
      cast(member_since as string) as member_since,
      cast(total_activities as int64) as total_activities,
      cast(last_sync_at as string) as last_sync_at
    from \`${projectId}.${dataset}.mart_athlete_summary\`
    limit 1
  `;
  const rows = await queryBigQuery<AthleteSummary>(sql);
  return rows[0] ?? null;
}
