# PaceWise

PaceWise is an ELT pipeline that ingests Strava activity data into BigQuery, transforms it with dbt, and orchestrates runs with Airflow. It is designed to run locally with Python 3.11 and Docker Compose.

## Architecture

```
                    +------------------+
                    |   Strava API     |
                    | (OAuth 2.0)      |
                    +--------+---------+
                             |
                             | GET /athlete/activities
                             | (paginated, incremental)
                             v
    +------------+   +------------------+   +------------------+
    |  Airflow   |   |  extract         |   |  BigQuery        |
    |  (DAG)     |-->|  strava_client   |-->|  pacewise_raw    |
    |            |   |  bigquery_loader |   |  .activities     |
    +------------+   +------------------+   |  ._metadata      |
           |                                +--------+---------+
           |                                         |
           |  dbt run / dbt test                     v
           +---------------------------------> +------------------+
                                               |  dbt             |
                                               |  stg_activities  |
                                               |  marts           |
                                               +------------------+
```

- **Extract**: Strava OAuth client fetches activities (with optional `after` timestamp); BigQuery loader writes raw JSON to `pacewise_raw.activities` and tracks `last_run_at` in `pacewise_raw._metadata`.
- **Transform**: dbt staging and marts build `stg_activities`, `mart_athlete_performance`, and `mart_training_load`.
- **Orchestrate**: Airflow DAG `pacewise_daily` runs extract_and_load → dbt run → dbt test daily at 06:00 UTC.

## Setup

1. **Clone and enter the project**
   ```bash
   git clone <repo-url> pacewise && cd pacewise
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`.
   - Fill in Strava OAuth credentials, BigQuery project/dataset, and (optionally) `AIRFLOW_ADMIN_EMAIL` for failure alerts.
   - For BigQuery, set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON key (inside the container this path must be valid, e.g. mount the key and set the path in `.env`).

3. **Start Airflow and Postgres**
   ```bash
   docker compose build
   docker compose run --rm airflow-webserver airflow db init
   docker compose run --rm airflow-webserver airflow users create \
     --role Admin --username admin --password admin --email admin@example.com \
     --firstname Admin --lastname User
   docker compose up -d
   ```
   - Open the Airflow UI at http://localhost:8080 (login: admin / admin if you used the command above).

4. **First run**
   - Ensure `.env` has valid `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and `STRAVA_REFRESH_TOKEN`.
   - Trigger the DAG manually (see below) or wait for the 06:00 UTC schedule.

## Authenticating with Strava

To obtain `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and `STRAVA_REFRESH_TOKEN`:

1. Create an app at [Strava API – Create & Manage Your App](https://www.strava.com/settings/api).
2. Use an OAuth 2.0 flow to get an authorization code, then exchange it for access and refresh tokens (e.g. [Strava OAuth](https://developers.strava.com/docs/authentication/)).
3. Store the **refresh token** in `.env` as `STRAVA_REFRESH_TOKEN`. The pipeline stores and refreshes the access token in a local JSON file (e.g. `strava_tokens.json`).

## Running dbt manually

From the host (with `GOOGLE_APPLICATION_CREDENTIALS` and `BIGQUERY_PROJECT_ID` set):

```bash
cd dbt
export DBT_PROFILES_DIR=$(pwd)
dbt run
dbt test
```

Or inside the Airflow container:

```bash
docker compose run --rm airflow-webserver bash -c "cd /dbt && DBT_PROFILES_DIR=/dbt dbt run && dbt test"
```

## Triggering the DAG in the Airflow UI

1. Open http://localhost:8080 and log in.
2. Find the **pacewise_daily** DAG in the list.
3. Turn the DAG **On** (toggle if it is off).
4. Click the **Trigger DAG** (play) button to run it once.

Runs are idempotent: the extract step uses `_metadata.last_run_at` to fetch only new activities since the last run.
