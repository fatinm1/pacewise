import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { PaceTrendPoint } from "@/types/strava";

export const dynamic = "force-dynamic";

export async function GET() {
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) throw new Error("Missing required env var: BIGQUERY_PROJECT_ID");

  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(week_start as string) as week_start,
      cast(avg_pace_min_per_km as float64) as avg_pace_min_per_km
    from \`${projectId}.${dataset}.mart_athlete_performance\`
    where avg_pace_min_per_km is not null
    order by week_start
  `;

  const rows = await queryBigQuery<PaceTrendPoint>(sql);
  return NextResponse.json(rows);
}

