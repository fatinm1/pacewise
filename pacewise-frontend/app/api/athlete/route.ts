import { NextResponse } from "next/server";
import { getAnalyticsDatasetId, queryBigQuery } from "@/lib/bigquery";
import type { AthleteSummary } from "@/types/strava";

export async function GET() {
  const dataset = getAnalyticsDatasetId();
  const sql = `
    select
      cast(name as string) as name,
      cast(avatar_url as string) as avatar_url,
      cast(member_since as string) as member_since,
      cast(total_activities as int64) as total_activities,
      cast(last_sync_at as string) as last_sync_at
    from \`${process.env.BIGQUERY_PROJECT_ID}.${dataset}.mart_athlete_summary\`
    limit 1
  `;

  const rows = await queryBigQuery<AthleteSummary>(sql);
  return NextResponse.json(rows[0] ?? null);
}

