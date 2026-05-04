import { NextResponse } from "next/server";
import { serverGetActivities } from "@/lib/serverData";

export const dynamic = "force-dynamic";

function asPositiveInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const limit = asPositiveInt(url.searchParams.get("limit"), 50);

  const rows = await serverGetActivities({
    type,
    limit,
  });

  return NextResponse.json(rows);
}
