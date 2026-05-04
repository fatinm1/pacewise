import { NextResponse } from "next/server";
import { queryBigQuery } from "@/lib/bigquery";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.BIGQUERY_PROJECT_ID?.trim()) {
    return NextResponse.json({
      ok: false,
      skipped: true,
      reason: "BIGQUERY_PROJECT_ID is not set",
    });
  }
  try {
    const rows = await queryBigQuery<{ ok: number }>("select 1 as ok");
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "BigQuery returned no rows" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

