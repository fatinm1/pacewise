import { NextResponse } from "next/server";
import { serverGetHeartRateZones } from "@/lib/serverData";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await serverGetHeartRateZones();
  return NextResponse.json(rows);
}
