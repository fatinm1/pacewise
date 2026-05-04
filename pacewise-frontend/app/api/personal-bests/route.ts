import { NextResponse } from "next/server";
import { serverGetPersonalBests } from "@/lib/serverData";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await serverGetPersonalBests();
  return NextResponse.json(rows);
}
