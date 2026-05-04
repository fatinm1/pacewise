import { NextResponse } from "next/server";
import { serverGetAthlete } from "@/lib/serverData";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await serverGetAthlete();
  return NextResponse.json(row ?? null);
}
