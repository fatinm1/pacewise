import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { PersonalBest } from "@/types/strava";

export const dynamic = "force-dynamic";

export async function GET() {
  const dataset = getAnalyticsDatasetId();
  const project = process.env.BIGQUERY_PROJECT_ID;
  if (!project) {
    // Allow builds/preview deployments to succeed without warehouse config.
    return NextResponse.json([]);
  }

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

  const rows = await queryBigQuery<PersonalBest>(sql);
  return NextResponse.json(rows);
}

