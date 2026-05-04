import { NextResponse } from "next/server";
import { resolveServerDataSource } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data_source: resolveServerDataSource(),
  });
}
