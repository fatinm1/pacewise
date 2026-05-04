import { NextResponse } from "next/server";
import { serverGetWeekly } from "@/lib/serverData";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await serverGetWeekly();
  return NextResponse.json(rows);
}
