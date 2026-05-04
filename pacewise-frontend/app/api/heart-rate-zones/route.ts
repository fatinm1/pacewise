import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { HeartRateZoneBucket } from "@/types/strava";

export const dynamic = "force-dynamic";

export async function GET() {
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  if (!projectId) {
    // Allow builds/preview deployments to succeed without warehouse config.
    return NextResponse.json([]);
  }

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

  const rows = await queryBigQuery<HeartRateZoneBucket>(sql);
  return NextResponse.json(rows);
}

