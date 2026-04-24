"""
Orchestrates Strava extract and BigQuery load for idempotent incremental runs.

Uses last_run_at from BigQuery _metadata to fetch only new activities.
"""

from __future__ import annotations

import os
import time
from typing import Any

from extract import bigquery_loader
from extract import strava_client


def run_extract_and_load(
    strava_client_id: str,
    strava_client_secret: str,
    strava_refresh_token: str | None,
    project_id: str,
    dataset_id: str,
    token_path: str | None = None,
) -> tuple[int, int]:
    """
    Idempotent extract-and-load: get last_run_at, fetch activities after,
    load into BigQuery, update metadata.

    If strava_refresh_token is provided and token file is missing, bootstraps
    tokens by refreshing and saving to token_path.

    Args:
        strava_client_id: Strava OAuth client ID.
        strava_client_secret: Strava OAuth client secret.
        strava_refresh_token: Optional; if provided and no token file, bootstrap.
        project_id: BigQuery project ID.
        dataset_id: BigQuery dataset ID.
        token_path: Optional path to Strava token JSON file.

    Returns:
        (rows_inserted, rows_failed).
    """
    path = token_path or os.environ.get("STRAVA_TOKEN_FILE", "strava_tokens.json")
    if strava_refresh_token:
        try:
            strava_client.load_tokens(path)
        except FileNotFoundError:
            strava_client.refresh_access_token(
                strava_client_id, strava_client_secret, strava_refresh_token, path
            )

    client = bigquery_loader.get_client(project_id)
    bigquery_loader.ensure_dataset(client, dataset_id)
    bigquery_loader.ensure_metadata_table(client, project_id, dataset_id)
    after = bigquery_loader.get_last_run_at(client, project_id, dataset_id)

    activities = strava_client.fetch_all_activities(
        strava_client_id, strava_client_secret, after=after, token_path=path
    )
    return bigquery_loader.load_activities(
        project_id,
        dataset_id,
        activities,
        upsert_metadata_after=True,
        last_run_at=int(time.time()),
    )
