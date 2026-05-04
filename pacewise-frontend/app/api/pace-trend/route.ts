import { NextResponse } from "next/server";
import { serverGetPaceTrend } from "@/lib/serverData";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await serverGetPaceTrend();
  return NextResponse.json(rows);
}
