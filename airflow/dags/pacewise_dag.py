"""
PaceWise daily DAG: extract Strava activities into BigQuery, then run dbt transform and tests.

Schedule: daily at 06:00 UTC.
Tasks: extract_and_load -> dbt_run -> dbt_test.
Idempotent; uses incremental loads and metadata tracking.
"""

import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator


def _extract_and_load() -> None:
    """
    Call PaceWise extract-and-load: Strava API -> BigQuery (incremental).
    Reads config from environment variables.
    """
    # Ensure project root is on path when DAG runs (e.g. /opt/pacewise mounted)
    import sys
    project_root = os.environ.get("PACEWISE_PROJECT_ROOT", "/opt/pacewise")
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    from extract.runner import run_extract_and_load

    run_extract_and_load(
        strava_client_id=os.environ["STRAVA_CLIENT_ID"],
        strava_client_secret=os.environ["STRAVA_CLIENT_SECRET"],
        strava_refresh_token=os.environ.get("STRAVA_REFRESH_TOKEN") or None,
        project_id=os.environ["BIGQUERY_PROJECT_ID"],
        dataset_id=os.environ.get("BIGQUERY_DATASET", "pacewise_raw"),
        token_path=os.environ.get("STRAVA_TOKEN_FILE"),
    )


# Default args: retries and email on failure (configurable via env)
DEFAULT_ARGS = {
    "owner": "pacewise",
    "depends_on_past": False,
    "email": [os.environ.get("AIRFLOW_ADMIN_EMAIL", "")] if os.environ.get("AIRFLOW_ADMIN_EMAIL") else [],
    "email_on_failure": bool(os.environ.get("AIRFLOW_ADMIN_EMAIL")),
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="pacewise_daily",
    default_args=DEFAULT_ARGS,
    description="Daily Strava -> BigQuery ELT pipeline with dbt",
    schedule="0 6 * * *",  # 06:00 UTC daily (cron)
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["pacewise", "strava", "bigquery", "dbt"],
) as dag:
    extract_and_load = PythonOperator(
        task_id="extract_and_load",
        python_callable=_extract_and_load,
    )

    dbt_run = BashOperator(
        task_id="dbt_run",
        bash_command="cd /opt/pacewise/dbt && dbt run",
        env={
            **os.environ,
            "DBT_PROFILES_DIR": "/opt/pacewise/dbt",
        },
    )

    dbt_test = BashOperator(
        task_id="dbt_test",
        bash_command="cd /opt/pacewise/dbt && dbt test",
        env={
            **os.environ,
            "DBT_PROFILES_DIR": "/opt/pacewise/dbt",
        },
    )

    extract_and_load >> dbt_run >> dbt_test
