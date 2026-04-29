import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { TrainingLoadPoint } from "@/types/strava";

export async function GET() {
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(start_date as string) as start_date,
      cast(distance_km as float64) as distance_km,
      cast(rolling_7d_distance_km as float64) as rolling_7d_distance_km,
      cast(rolling_28d_distance_km as float64) as rolling_28d_distance_km
    from \`${process.env.BIGQUERY_PROJECT_ID}.${dataset}.mart_training_load\`
    order by start_date
  `;

  const rows = await queryBigQuery<TrainingLoadPoint>(sql);
  return NextResponse.json(rows);
}

