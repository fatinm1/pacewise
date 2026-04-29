import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { WeeklyPerformance } from "@/types/strava";

export async function GET() {
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(week_start as string) as week_start,
      cast(total_distance_km as float64) as total_distance_km,
      cast(total_moving_time_hours as float64) as total_moving_time_hours,
      cast(avg_pace_min_per_km as float64) as avg_pace_min_per_km,
      cast(avg_heartrate as float64) as avg_heartrate,
      cast(activity_count as int64) as activity_count
    from \`${process.env.BIGQUERY_PROJECT_ID}.${dataset}.mart_athlete_performance\`
    order by week_start
  `;

  const rows = await queryBigQuery<WeeklyPerformance>(sql);
  return NextResponse.json(rows);
}

