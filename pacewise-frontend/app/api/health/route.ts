import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Liveness check only (Railway health checks should not depend on BigQuery auth).
  return NextResponse.json({ ok: true });
}

