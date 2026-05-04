import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { Activity } from "@/types/strava";

export const dynamic = "force-dynamic";

function asPositiveInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) {
    // Allow builds/preview deployments to succeed without warehouse config.
    return NextResponse.json([]);
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const limit = asPositiveInt(url.searchParams.get("limit"), 50);

  const dataset = getAnalyticsDatasetId();

  // stg_activities is a view in the analytics dataset.
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

  const rows = await queryBigQuery<Activity>(sql, {
    type: type && type !== "All" ? type : null,
    limit,
  });

  return NextResponse.json(rows);
}

