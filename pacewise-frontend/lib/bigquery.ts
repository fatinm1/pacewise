import "server-only";

import { BigQuery } from "@google-cloud/bigquery";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function getBigQueryClient(): BigQuery {
  const projectId = requiredEnv("BIGQUERY_PROJECT_ID");
  // Auth is handled by GOOGLE_APPLICATION_CREDENTIALS (or ADC in some envs)
  return new BigQuery({ projectId });
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

export async function queryBigQuery<T>(
  sql: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const client = getBigQueryClient();

  const [job] = await client.createQueryJob({
    query: sql,
    location: process.env.BIGQUERY_LOCATION ?? "US",
    params,
  });

  const [rows] = await job.getQueryResults();
  return rows as T[];
}

