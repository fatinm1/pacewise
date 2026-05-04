import "server-only";

/**
 * Where API routes load activity analytics from.
 * - `local`: JSON file on disk (no Google Cloud; good with GPX import).
 * - `bigquery`: warehouse + dbt marts (requires BIGQUERY_PROJECT_ID and credentials).
 *
 * Auto: BigQuery if BIGQUERY_PROJECT_ID is set, else local.
 */
export type ServerDataSource = "local" | "bigquery";

export function resolveServerDataSource(): ServerDataSource {
  const explicit = process.env.PACEWISE_DATA_SOURCE?.trim().toLowerCase();
  if (explicit === "local") return "local";
  if (explicit === "bigquery") return "bigquery";
  return process.env.BIGQUERY_PROJECT_ID ? "bigquery" : "local";
}
