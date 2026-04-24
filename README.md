# PaceWise

**A full-stack Strava analytics pipeline: extract from the Strava API, load into BigQuery, transform with dbt, and explore in a Next.js dashboard.**

[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![BigQuery](https://img.shields.io/badge/Google-BigQuery-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/bigquery)
[![dbt](https://img.shields.io/badge/dbt-Core-FF694B?logo=dbt&logoColor=white)](https://www.getdbt.com/)
[![Airflow](https://img.shields.io/badge/Apache-Airflow%202.8-017CEE?logo=apache-airflow&logoColor=white)](https://airflow.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <img src="docs/screenshot.png" alt="PaceWise dashboard — dark glass UI with KPIs, weekly distance chart, and recent activities" width="900" />
</p>

---

## Overview

PaceWise is a production-style ELT project for athletes who want full control of their Strava data. It includes:

- **Extraction/load**: Python scripts that authenticate to Strava (OAuth), refresh tokens, and load activity data into BigQuery (incremental by default).
- **Transformations**: dbt models that type/clean raw payloads and build analytics marts (weekly performance, training load).
- **Dashboard**: a Next.js app that visualizes metrics and activity history (can run with mock data or connect to real data).

---

## Architecture

```
                    ┌──────────────────┐
                    │   Strava API     │
                    │   (OAuth 2.0)    │
                    └────────┬─────────┘
                             │ GET /athlete/activities
                             │ (paginated, incremental)
                             ▼
    ┌────────────┐   ┌──────────────────┐   ┌─────────────────────────┐
    │  Airflow   │   │  Python Extract  │   │  BigQuery (raw)          │
    │  Scheduler │──►│  strava_client   │──►│  pacewise_raw.activities │
    │  + DAGs    │   │  bigquery_loader │   │  pacewise_raw._metadata  │
    └─────┬──────┘   └──────────────────┘   └────────────┬─────────────┘
          │                                              │
          │  dbt run / dbt test                           ▼
          │         ┌─────────────────────────────────────────────┐
          └────────►│  dbt (staging + marts)                       │
                    │  stg_activities → mart_athlete_performance   │
                    │                → mart_training_load         │
                    └─────────────────────┬───────────────────────┘
                                          │
                                          ▼
                    ┌─────────────────────────────────────────────┐
                    │  Next.js 14 Dashboard                        │
                    │  KPIs, charts, activity table, design system│
                    └─────────────────────────────────────────────┘
```

- **Raw storage**: `pacewise_raw.activities` (raw payloads) and `pacewise_raw._metadata` (pipeline state, including the incremental cursor).
- **Orchestration**: an Airflow DAG runs extract → dbt run → dbt test.
- **Serving**: the dashboard can be run standalone (mock data) or wired to a backend/API that reads from your warehouse.

---

## Features

- **Incremental loads** using `pacewise_raw._metadata` to avoid full reloads.
- **Token refresh** for Strava OAuth.
- **Idempotent runs** (safe to re-run without duplicating data).
- **dbt models + tests** for typed staging and analytics marts.

---

## Tech stack

- **Backend/pipeline**: Python 3.11, Apache Airflow, Google BigQuery, dbt (BigQuery adapter)
- **Frontend**: Next.js 14 + TypeScript + Tailwind

---

## Project structure

```
pacewise/
├── docker-compose.yml          # Airflow webserver, scheduler, Postgres
├── Dockerfile.airflow         # Airflow image + dbt-bigquery, google-cloud-bigquery
├── .env.example                # Strava, BigQuery, Airflow env vars (copy to .env)
├── .gitignore
├── requirements.txt           # Python deps: Airflow, BigQuery, dbt-bigquery, requests
├── README.md
│
├── airflow/
│   └── dags/
│       └── pacewise_dag.py    # Daily DAG: extract_and_load → dbt run → dbt test
│
├── extract/                   # Python ELT extraction + load
│   ├── __init__.py
│   ├── strava_client.py      # OAuth, token refresh, fetch activities (paginated/incremental)
│   ├── bigquery_loader.py    # Create dataset/tables, insert_rows_json, _metadata upsert
│   └── runner.py             # Orchestrates strava_client + bigquery_loader (idempotent)
│
├── dbt/
│   ├── dbt_project.yml       # Project name, profile, model paths
│   ├── profiles.yml          # BigQuery target (project, dataset, auth via env)
│   └── models/
│       ├── sources.yml       # Source definition: pacewise_raw.activities
│       ├── staging/
│       │   ├── stg_activities.sql   # Typed, renamed, pace_min_per_km; view
│       │   └── schema.yml           # Tests: not_null, unique on activity_id
│       └── marts/
│           ├── mart_athlete_performance.sql  # Weekly run aggregates
│           └── mart_training_load.sql         # Rolling 7d/28d distance per activity
│
└── pacewise-frontend/        # Next.js 14 dashboard
    ├── app/
    │   ├── layout.tsx        # Root layout, sidebar, top bar, fonts, background
    │   ├── page.tsx          # Dashboard (/)
    │   ├── DashboardClient.tsx
    │   ├── globals.css       # Design tokens, grid, scanline, keyframes
    │   ├── performance/     # Pace trend, HR zones, personal bests
    │   ├── training-load/   # Rolling chart + acute:chronic ring
    │   ├── activities/      # Filterable table
    │   └── settings/        # Placeholder
    ├── components/
    │   ├── layout/          # Sidebar, TopBar
    │   ├── ui/               # GlassCard, MetricValue, HolographicText, GlowButton, etc.
    │   └── charts/          # WeeklyDistance, PaceTrend, HeartRateZone, TrainingLoad
    ├── lib/
    │   └── api.ts           # Typed fetch + mock data when no backend
    ├── types/
    │   └── strava.ts        # Activity, WeeklyPerformance, TrainingLoad, etc.
    ├── public/
    ├── package.json
    ├── tailwind.config.ts   # Colors, shadows, fonts, animations
    └── README.md            # Frontend setup and design notes
```

---

## Getting started

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 18+**
- **Python 3.11+** (optional; useful if you run extraction/dbt outside Docker)
- **Google Cloud** account with BigQuery enabled
- **Strava** developer account ([strava.com/settings/api](https://www.strava.com/settings/api))

### Configure Strava OAuth

1. Create an app at [Strava API – Create & Manage Your App](https://www.strava.com/settings/api) and note **Client ID** and **Client Secret**.
2. Complete the OAuth flow to obtain a **refresh token** with scope `activity:read_all`.
3. Set `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and `STRAVA_REFRESH_TOKEN` in `.env`.

See [Strava OAuth documentation](https://developers.strava.com/docs/authentication/).

### Configure Google Cloud / BigQuery

1. Enable the **BigQuery API** in your GCP project.
2. Create a **service account** with permissions to create/write datasets and tables (e.g. BigQuery Data Editor; BigQuery Admin also works).
3. Download a JSON key and set `GOOGLE_APPLICATION_CREDENTIALS` to its absolute path.

### Step 1 — Clone

```bash
git clone https://github.com/fatinm1/pacewise.git
cd pacewise
```

### Step 2 — Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Minimum required values:

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token

GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
BIGQUERY_PROJECT_ID=your-gcp-project-id
BIGQUERY_DATASET=pacewise_raw

# Optional (Airflow failure notifications)
AIRFLOW_ADMIN_EMAIL=your@email.com

# Optional (default: ./strava_tokens.json)
# STRAVA_TOKEN_FILE=./strava_tokens.json
```

### Step 3 — Run Airflow (local)

```bash
docker compose build
docker compose run --rm airflow-webserver airflow db init
docker compose run --rm airflow-webserver airflow users create \
  --role Admin --username admin --password admin --email admin@example.com \
  --firstname Admin --lastname User
docker compose up -d
```

Then:

- Open the Airflow UI at `http://localhost:8080` (login: `admin` / `admin`).
- Turn **on** the `pacewise_daily` DAG and **Trigger DAG**.
- Verify BigQuery outputs:
  - `pacewise_raw.activities`
  - `pacewise_raw._metadata`
  - dbt models in your target dataset.

### Step 4 — Run the dashboard

```bash
cd pacewise-frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

- By default the frontend uses **mock data**.
- To connect to a real API, set `NEXT_PUBLIC_API_URL` in `pacewise-frontend/.env.local`.

---

## dbt models

PaceWise uses a simple three-layer approach in BigQuery.

### Raw layer

- **BigQuery table**: `pacewise_raw.activities`
- Unmodified (or lightly normalized) Strava API response; loaded by the Python extract.

### Staging layer — `stg_activities`

- **Materialization**: view  
- **Source**: `pacewise_raw.activities`  
- **Purpose**: Typed, cleaned, renamed fields and one derived metric.

### Mart layer

**mart_athlete_performance**

- **Materialization**: table  
- **Source**: `stg_activities` (runs only: `activity_type = 'Run'`)  
- **Grain**: one row per week (`date_trunc(start_date, week)`)  
- **Metrics**: `total_distance_km`, `total_moving_time_hours`, `avg_pace_min_per_km`, `avg_heartrate`, `activity_count`  
- Used for dashboard weekly charts and run-focused KPIs.

**mart_training_load**

- **Materialization**: table  
- **Source**: `stg_activities`  
- **Grain**: one row per activity  
- **Metrics**: `distance_km`, `rolling_7d_distance_km`, `rolling_28d_distance_km` (window functions with `RANGE BETWEEN n PRECEDING AND CURRENT ROW`)  
- Used for training load charts and acute:chronic ratio.

### Running dbt manually

From the repo root (with `GOOGLE_APPLICATION_CREDENTIALS` and `BIGQUERY_PROJECT_ID` set):

```bash
cd dbt
export DBT_PROFILES_DIR=$(pwd)
dbt run
dbt test
```

---

## Deployment

PaceWise can be deployed (e.g. on Railway) by running Airflow + the dashboard as an app service, backed by a managed Postgres database for Airflow metadata.

For the full Railway guide (env vars, credentials mounting, and troubleshooting), see `docs/deployment/railway.md`.

---

## Contributing

1. Fork the repository.  
2. Create a feature branch (`git checkout -b feature/your-feature`).  
3. Make your changes and add tests where relevant.  
4. Submit a pull request with a clear description of the change.  
5. Open an issue for bugs or feature requests — they’re welcome.

---

## License

MIT License.

---

## Acknowledgements

- **Strava** for the API that makes athlete data accessible.  
- **dbt** for making SQL transformations versioned and testable.  
- **Apache Airflow** for reliable pipeline orchestration.  
- **Vercel** for frontend hosting and deployment.
