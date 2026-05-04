import "server-only";

import { BigQuery } from "@google-cloud/bigquery";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function getServiceAccountJsonObject(): Record<string, unknown> | null {
  // Common patterns for PaaS deployments (Railway/Heroku-style) where mounting a file is awkward.
  const direct =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    process.env.BIGQUERY_SERVICE_ACCOUNT_JSON ??
    process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (direct) {
    try {
      return JSON.parse(direct) as Record<string, unknown>;
    } catch {
      throw new Error(
        "Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON (or related *_JSON) as JSON."
      );
    }
  }

  const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf8");
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      throw new Error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_B64 after base64 decode.");
    }
  }

  return null;
}

export function getBigQueryClient(): BigQuery {
  const projectId = requiredEnv("BIGQUERY_PROJECT_ID");
  const credentials = getServiceAccountJsonObject();
  if (credentials) {
    return new BigQuery({ projectId, credentials });
  }

  // File-based auth (local dev / containers with a mounted key)
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      "BigQuery auth is not configured. Set GOOGLE_APPLICATION_CREDENTIALS to a file path in the container, " +
        "or set GOOGLE_APPLICATION_CREDENTIALS_JSON (or *_JSON / *_B64) to the service account JSON."
    );
  }

  return new BigQuery({ projectId, keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
}

export function getRawDatasetId(): string {
  return process.env.BIGQUERY_DATASET ?? "pacewise_raw";
}

export function getAnalyticsDatasetId(): string {
  return process.env.BIGQUERY_ANALYTICS_DATASET ?? "pacewise";
}

export type QueryParam =
  | { name: string; parameterType: { type: string }; parameterValue: { value: unknown } }
  | { name: string; parameterType: { type: string }; parameterValue: { value: string } };

function formatBigQueryIamHint(projectId: string, original: string): string {
  const trimmed = original.length > 800 ? `${original.slice(0, 800)}…` : original;
  return (
    `BigQuery denied access for project "${projectId}". ` +
      "The credential needs at least: (1) roles/bigquery.jobUser — includes bigquery.jobs.create — and " +
      "(2) roles/bigquery.dataViewer or roles/bigquery.dataEditor on the datasets you query (or project-level Data Viewer/Editor). " +
      "In GCP Console: IAM & Admin → grant those roles to your service account. " +
      "To run the dashboard without BigQuery, unset BIGQUERY_PROJECT_ID or set PACEWISE_DATA_SOURCE=local. " +
      `API detail: ${trimmed}`
  );
}

export async function queryBigQuery<T>(
  sql: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const projectId = process.env.BIGQUERY_PROJECT_ID ?? "";
  const client = getBigQueryClient();

  try {
    const [job] = await client.createQueryJob({
      query: sql,
      location: process.env.BIGQUERY_LOCATION ?? "US",
      params,
    });

    const [rows] = await job.getQueryResults();
    return rows as T[];
  } catch (err) {
    const raw =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
    if (
      /403|PERMISSION_DENIED|accessDenied|bigquery\.jobs\.create|Access Denied/i.test(raw) &&
      projectId
    ) {
      throw new Error(formatBigQueryIamHint(projectId, raw));
    }
    throw err;
  }
}

