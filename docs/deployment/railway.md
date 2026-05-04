# Railway deployment (PaceWise)

This guide deploys **PaceWise** on Railway using:

- **App service**: runs Airflow (scheduler + webserver) and the Next.js dashboard (port 3000)
- **Database service**: managed Postgres for Airflow metadata
- **Warehouse**: BigQuery (your Strava data and dbt models)

## What’s in this repo

- `Dockerfile.railway`: builds the runtime image
- `railway-entrypoint.sh`: starts the required processes
- `supervisord-airflow.conf`: supervisord config to run multiple processes in one container

## Prerequisites

- A **GCP service account** with BigQuery permissions and a downloaded JSON key
- Strava API credentials and a refresh token:
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_REFRESH_TOKEN` (scope: `activity:read_all`)

## Railway setup

### 1) Create services

1. Create a **Postgres** service in Railway.
2. Create an **app** service from this GitHub repo and set the Dockerfile to `Dockerfile.railway`.

### 2) Configure environment variables

Set these on the **app** service:

- `AIRFLOW__DATABASE__SQL_ALCHEMY_CONN`: SQLAlchemy connection string pointing at the Railway Postgres instance
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REFRESH_TOKEN`
- `BIGQUERY_PROJECT_ID`
- `BIGQUERY_DATASET` (example: `pacewise_raw`)
- `BIGQUERY_ANALYTICS_DATASET` (example: `pacewise`) — dbt output dataset queried by the Next.js API

#### BigQuery credentials

Pick **one** auth strategy:

1. **Mounted JSON key file inside the container**
   - Set `GOOGLE_APPLICATION_CREDENTIALS=/path/inside/container/service-account.json`
   - The path must exist **inside the Railway container**, not on your laptop (avoid `/Users/...`).
2. **Inline JSON credentials (recommended for Railway variables UI)**
   - Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` to the **full JSON** contents (single-line JSON string).
   - Alternatively set `GOOGLE_APPLICATION_CREDENTIALS_B64` to base64-encoded JSON.

Important:

- Don’t commit the JSON key to git.
- If you use file paths, ensure the file exists **inside the container** at runtime (Railway won’t magically map macOS paths).

#### BigQuery IAM (403 `bigquery.jobs.create` / Access Denied)

The service account must be able to **create query jobs** and **read** your datasets. In Google Cloud Console → **IAM & Admin** → **IAM**, grant the principal matching your JSON key at least:

- **BigQuery Job User** (`roles/bigquery.jobUser`) — required for `bigquery.jobs.create`.
- **BigQuery Data Viewer** on the analytics dataset (or **BigQuery Data Editor** at project scope if you manage tables there) — so queries against `stg_*` / `mart_*` succeed.

If you prefer to run the Next.js app **without** BigQuery (local JSON + GPX import only), unset `BIGQUERY_PROJECT_ID` or set `PACEWISE_DATA_SOURCE=local` and redeploy.

### 3) Expose ports

- Expose **3000** for the Next.js dashboard.
- Exposing Airflow’s UI (typically **8080**) is optional. If you expose it, ensure it’s protected appropriately.

## First run

1. Deploy the app service.
2. Open the Airflow UI (if exposed) and trigger the `pacewise_daily` DAG.
3. Confirm BigQuery tables exist:
   - `pacewise_raw.activities`
   - `pacewise_raw._metadata`
   - dbt models in your configured analytics dataset (e.g. `pacewise.*`)

## Dashboard data mode

By default the dashboard reads **real data** from the Next.js API routes running in the same container (which query BigQuery/dbt marts directly).

Optional:

- Set `NEXT_PUBLIC_USE_MOCK_DATA=1` to force the UI to use mock data (useful for demos/troubleshooting).

## Troubleshooting

- **BigQuery auth errors**: verify credentials are configured correctly:
  - If using file paths, confirm `GOOGLE_APPLICATION_CREDENTIALS` exists in-container (not `/Users/...`).
  - If using Railway variables, prefer `GOOGLE_APPLICATION_CREDENTIALS_JSON` / `_B64`.
  - Confirm the service account has BigQuery permissions for your project/datasets.
- **Airflow DB errors**: confirm `AIRFLOW__DATABASE__SQL_ALCHEMY_CONN` matches Railway Postgres and includes correct credentials/host.
- **No data loaded**: ensure your Strava refresh token is valid and has `activity:read_all` scope.

