import { NextResponse } from "next/server";
import { resolveServerDataSource } from "@/lib/dataSource";
import { appendActivity, loadActivities, nextLocalActivityId } from "@/lib/localActivitiesStore";
import { activityFromGpx } from "@/lib/parseGpx";

export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: Request) {
  if (resolveServerDataSource() !== "local") {
    return NextResponse.json(
      {
        error:
          "GPX import only works in local data mode. Unset BIGQUERY_PROJECT_ID or set PACEWISE_DATA_SOURCE=local in your environment.",
      },
      { status: 400 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  const activityType = ((form.get("type") as string | null) ?? "Run").trim() || "Run";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field "file".' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 12 MB)." }, { status: 400 });
  }

  const xml = await file.text();
  const existing = loadActivities();
  const nextId = nextLocalActivityId(existing);

  let activity;
  try {
    activity = activityFromGpx(xml, {
      activity_id: nextId,
      fallbackName: file.name || "imported.gpx",
      activity_type: activityType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to parse GPX.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  appendActivity(activity);

  return NextResponse.json({
    ok: true,
    activity_id: activity.activity_id,
    activity_name: activity.activity_name,
    distance_meters: activity.distance_meters,
    start_date: activity.start_date,
  });
}
