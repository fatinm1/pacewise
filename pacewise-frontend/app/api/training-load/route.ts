import { NextResponse } from "next/server";
import { serverGetTrainingLoad } from "@/lib/serverData";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await serverGetTrainingLoad();
  return NextResponse.json(rows);
}
