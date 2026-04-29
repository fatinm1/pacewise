import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { TrainingLoadPoint } from "@/types/strava";

export const dynamic = "force-dynamic";

export async function GET() {
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) throw new Error("Missing required env var: BIGQUERY_PROJECT_ID");

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

  const rows = await queryBigQuery<TrainingLoadPoint>(sql);
  return NextResponse.json(rows);
}

