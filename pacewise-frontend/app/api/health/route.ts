import { NextResponse } from "next/server";
import { queryBigQuery } from "@/lib/bigquery";

export async function GET() {
  try {
    // Cheap connectivity check
    await queryBigQuery<{ ok: number }>("select 1 as ok");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

