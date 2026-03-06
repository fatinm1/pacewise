"""
BigQuery loader for raw Strava activity data.

Creates dataset and activities table, loads records via insert_rows_json,
and tracks last run timestamp in a _metadata table for incremental loads.
"""

from __future__ import annotations

import os
from typing import Any

from google.cloud import bigquery
from google.cloud.bigquery import SchemaField

# Default pipeline name for metadata tracking
PIPELINE_NAME = "pacewise_strava_activities"
METADATA_TABLE = "_metadata"


def get_client(project_id: str | None = None) -> bigquery.Client:
    """
    Create a BigQuery client, optionally with explicit project.

    Uses GOOGLE_APPLICATION_CREDENTIALS for auth if set.

    Args:
        project_id: Optional GCP project ID. Defaults to client default.

    Returns:
        bigquery.Client instance.
    """
    if project_id:
        return bigquery.Client(project=project_id)
    return bigquery.Client()


def ensure_dataset(client: bigquery.Client, dataset_id: str) -> bigquery.Dataset:
    """
    Create the dataset if it does not exist.

    Args:
        client: BigQuery client.
        dataset_id: Dataset ID (e.g. pacewise_raw).

    Returns:
        The Dataset reference (created or existing).
    """
    dataset_ref = f"{client.project}.{dataset_id}"
    dataset = bigquery.Dataset(dataset_ref)
    dataset.location = os.environ.get("BIGQUERY_LOCATION", "US")
    try:
        return client.get_dataset(dataset_ref)
    except Exception:
        return client.create_dataset(dataset, exists_ok=False)


def activities_schema() -> list[SchemaField]:
    """
    Return BigQuery schema for Strava activities table.

    Aligned with typical GET /athlete/activities response fields.
    """
    return [
        SchemaField("id", "INTEGER", mode="REQUIRED"),
        SchemaField("name", "STRING", mode="NULLABLE"),
        SchemaField("distance", "FLOAT", mode="NULLABLE"),
        SchemaField("moving_time", "INTEGER", mode="NULLABLE"),
        SchemaField("elapsed_time", "INTEGER", mode="NULLABLE"),
        SchemaField("total_elevation_gain", "FLOAT", mode="NULLABLE"),
        SchemaField("type", "STRING", mode="NULLABLE"),
        SchemaField("start_date", "TIMESTAMP", mode="NULLABLE"),
        SchemaField("average_heartrate", "FLOAT", mode="NULLABLE"),
        SchemaField("max_heartrate", "FLOAT", mode="NULLABLE"),
        SchemaField("average_speed", "FLOAT", mode="NULLABLE"),
        SchemaField("max_speed", "FLOAT", mode="NULLABLE"),
        SchemaField("kudos_count", "INTEGER", mode="NULLABLE"),
        SchemaField("comment_count", "INTEGER", mode="NULLABLE"),
        SchemaField("athlete", "RECORD", mode="NULLABLE", fields=()),
        SchemaField("map", "RECORD", mode="NULLABLE", fields=()),
        SchemaField("gear_id", "STRING", mode="NULLABLE"),
        SchemaField("workout_type", "INTEGER", mode="NULLABLE"),
    ]


def ensure_activities_table(
    client: bigquery.Client, project_id: str, dataset_id: str
) -> str:
    """
    Create the activities table if it does not exist.

    Args:
        client: BigQuery client.
        project_id: GCP project ID.
        dataset_id: Dataset ID.

    Returns:
        Full table ID: project.dataset.activities.
    """
    table_id = f"{project_id}.{dataset_id}.activities"
    schema = activities_schema()
    table = bigquery.Table(table_id, schema=schema)
    table.time_partitioning = bigquery.TimePartitioning(
        type_=bigquery.TimePartitioningType.DAY,
        field="start_date",
    )
    try:
        client.get_table(table_id)
        return table_id
    except Exception:
        client.create_table(table, exists_ok=False)
        return table_id


def ensure_metadata_table(
    client: bigquery.Client, project_id: str, dataset_id: str
) -> str:
    """
    Create the _metadata table if it does not exist.

    Schema: pipeline_name (STRING), last_run_at (TIMESTAMP).

    Args:
        client: BigQuery client.
        project_id: GCP project ID.
        dataset_id: Dataset ID.

    Returns:
        Full table ID: project.dataset._metadata.
    """
    meta_id = f"{project_id}.{dataset_id}.{METADATA_TABLE}"
    schema = [
        SchemaField("pipeline_name", "STRING", mode="REQUIRED"),
        SchemaField("last_run_at", "TIMESTAMP", mode="REQUIRED"),
    ]
    table = bigquery.Table(meta_id, schema=schema)
    try:
        client.get_table(meta_id)
        return meta_id
    except Exception:
        client.create_table(table, exists_ok=False)
        return meta_id


def get_last_run_at(
    client: bigquery.Client, project_id: str, dataset_id: str
) -> int | None:
    """
    Read last_run_at for this pipeline from _metadata (as Unix timestamp).

    Args:
        client: BigQuery client.
        project_id: GCP project ID.
        dataset_id: Dataset ID.

    Returns:
        Last run Unix timestamp, or None if no row exists.
    """
    meta_id = f"{project_id}.{dataset_id}.{METADATA_TABLE}"
    query = f"""
        SELECT last_run_at
        FROM `{meta_id}`
        WHERE pipeline_name = @pipeline_name
        ORDER BY last_run_at DESC
        LIMIT 1
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("pipeline_name", "STRING", PIPELINE_NAME)
        ]
    )
    result = list(client.query(query, job_config=job_config).result())
    if not result:
        return None
    ts = result[0].last_run_at
    return int(ts.timestamp()) if ts else None


def upsert_metadata(
    client: bigquery.Client,
    project_id: str,
    dataset_id: str,
    last_run_at: int,
) -> None:
    """
    Insert or update the pipeline's last_run_at in _metadata.

    Implemented as an INSERT; for a single pipeline_name you may want
    to dedupe in downstream queries (e.g. MAX(last_run_at) per pipeline).

    Args:
        client: BigQuery client.
        project_id: GCP project ID.
        dataset_id: Dataset ID.
        last_run_at: Unix timestamp of this run.
    """
    from datetime import datetime, timezone

    meta_id = f"{project_id}.{dataset_id}.{METADATA_TABLE}"
    dt = datetime.fromtimestamp(last_run_at, tz=timezone.utc)
    row = {
        "pipeline_name": PIPELINE_NAME,
        "last_run_at": dt.isoformat(),
    }
    errors = client.insert_rows_json(meta_id, [row])
    if errors:
        raise RuntimeError(f"Failed to upsert metadata: {errors}")


def _activity_to_row(activity: dict[str, Any]) -> dict[str, Any]:
    """
    Map a Strava activity dict to a flat row for BigQuery.

    Keeps only fields that match our schema; start_date as ISO string.
    """
    row: dict[str, Any] = {}
    for key in (
        "id",
        "name",
        "distance",
        "moving_time",
        "elapsed_time",
        "total_elevation_gain",
        "type",
        "average_heartrate",
        "max_heartrate",
        "average_speed",
        "max_speed",
        "kudos_count",
        "comment_count",
        "gear_id",
        "workout_type",
    ):
        if key in activity and activity[key] is not None:
            row[key] = activity[key]
    if "start_date" in activity and activity["start_date"]:
        # Strava returns ISO 8601; BigQuery TIMESTAMP accepts it
        row["start_date"] = activity["start_date"]
    return row


def load_activities(
    project_id: str,
    dataset_id: str,
    activities: list[dict[str, Any]],
    *,
    upsert_metadata_after: bool = True,
    last_run_at: int | None = None,
) -> tuple[int, int]:
    """
    Ensure dataset and activities table exist, load rows, then update _metadata.

    Args:
        project_id: GCP project ID.
        dataset_id: Dataset ID (e.g. pacewise_raw).
        activities: List of raw Strava activity dicts.
        upsert_metadata_after: If True, write last_run_at to _metadata after load.
        last_run_at: Unix timestamp for this run (used for metadata). Defaults to now.

    Returns:
        (rows_inserted, rows_failed) from insert_rows_json.
    """
    import time as time_module

    if last_run_at is None:
        last_run_at = int(time_module.time())

    client = get_client(project_id)
    ensure_dataset(client, dataset_id)
    ensure_activities_table(client, project_id, dataset_id)
    ensure_metadata_table(client, project_id, dataset_id)

    table_id = f"{project_id}.{dataset_id}.activities"
    rows = [_activity_to_row(a) for a in activities]
    if not rows:
        if upsert_metadata_after:
            upsert_metadata(client, project_id, dataset_id, last_run_at)
        return 0, 0

    errors = client.insert_rows_json(table_id, rows)
    inserted = len(rows) - len(errors)
    if errors and len(errors) == len(rows):
        raise RuntimeError(f"All rows failed to insert: {errors[:3]}...")
    if upsert_metadata_after:
        upsert_metadata(client, project_id, dataset_id, last_run_at)
    return inserted, len(errors)


