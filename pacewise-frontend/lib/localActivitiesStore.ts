import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { Activity } from "@/types/strava";
import { MOCK_ACTIVITIES } from "@/lib/mockData";

export interface LocalStoreFile {
  activities: Activity[];
  /** ISO timestamp of last successful GPX import */
  last_import_at?: string | null;
}

function defaultPath(): string {
  return process.env.PACEWISE_LOCAL_DATA_PATH || join(process.cwd(), "data", "activities.json");
}

function emptyStore(): LocalStoreFile {
  return { activities: [], last_import_at: null };
}

function readRaw(path: string): LocalStoreFile {
  if (!existsSync(path)) return emptyStore();
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as LocalStoreFile;
    if (!parsed || !Array.isArray(parsed.activities)) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeRaw(path: string, data: LocalStoreFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Activities from disk, or bundled sample data in memory when no file exists yet.
 * Does not write to disk (safe during `next build`).
 */
export function loadActivities(): Activity[] {
  const path = defaultPath();
  const store = readRaw(path);
  if (store.activities.length > 0) {
    return store.activities.map((a) => ({ ...a }));
  }
  return MOCK_ACTIVITIES.map((a) => ({ ...a }));
}

/**
 * Append one activity. If the store file is still empty, persist bundled samples first
 * so the file stays consistent with what the UI was showing.
 */
export function appendActivity(activity: Activity): void {
  const path = defaultPath();
  const store = readRaw(path);
  if (!store.activities.length) {
    store.activities = MOCK_ACTIVITIES.map((a) => ({ ...a }));
  }
  store.activities.push(activity);
  store.last_import_at = new Date().toISOString();
  writeRaw(path, store);
}

export function nextLocalActivityId(activities: Activity[]): number {
  return activities.reduce((m, a) => Math.max(m, a.activity_id), 0) + 1;
}

export function getStoreMeta(): { last_import_at: string | null } {
  const path = defaultPath();
  const store = readRaw(path);
  return { last_import_at: store.last_import_at ?? null };
}
