# PaceWise

**A full-stack Strava analytics pipeline — from raw API data to a production-grade BigQuery warehouse and a modern holographic dashboard.**

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

Strava gives athletes a great place to log runs and rides, but its native analytics are limited. You can’t easily join your activity data with other sources, run custom SQL, or build dashboards that match how you think about training. **PaceWise** fixes that: it’s a production-style ELT pipeline that pulls your Strava data into BigQuery, transforms it with dbt, and surfaces it in a dark-mode dashboard with glassmorphism and Strava-orange glow.

The project has three pillars. **First**, a Python extraction layer that talks to the Strava API with OAuth, handles token refresh, and loads raw activities into BigQuery with incremental runs and metadata tracking. **Second**, a dbt project that turns raw tables into typed staging views and analytics marts (weekly performance, training load with rolling windows). **Third**, a Next.js 14 dashboard that consumes those marts (or mock data) and presents KPIs, charts, and a searchable activity table in a consistent design system.

Everything is designed to run locally with Docker Compose (Airflow + Postgres) and a `pacewise-frontend` app, so you can own your data end-to-end.

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

- **Extraction layer** — Python 3.11 scripts use the Strava API with OAuth 2.0. Tokens are stored in a local JSON file and refreshed automatically. Activities are fetched with an optional `after` timestamp for incremental loads. The BigQuery loader creates `pacewise_raw.activities` and a `_metadata` table that stores `last_run_at` per pipeline so the next run only pulls new data.

- **Storage layer** — Raw API payloads land in BigQuery in `pacewise_raw.activities`. Transformed outputs live in a separate dataset (e.g. `pacewise`) as dbt-managed tables and views. All pipeline state (e.g. last successful run) is in `pacewise_raw._metadata`.

- **Transformation layer** — dbt-bigquery defines a staging view (`stg_activities`) that cleans and types the raw table, and two marts: weekly run performance and per-activity rolling 7d/28d distance. Schema tests run on every DAG run.

- **Orchestration layer** — A single Airflow DAG (`pacewise_daily`) runs daily at 06:00 UTC: it executes the Python extract-and-load, then `dbt run`, then `dbt test`. Retries and optional email-on-failure keep the pipeline observable.

- **Presentation layer** — A Next.js 14 app (TypeScript, Tailwind, Framer Motion, Recharts) serves the dashboard. It reads from typed API functions that can hit a real backend or fall back to mock data aligned with the dbt marts.

---

## Features

### Pipeline features

- **Incremental loads** — Only fetches activities since `last_run_at` from `_metadata`; no full reloads unless you reset state.
- **Idempotent DAGs** — Safe to re-trigger the same DAG; metadata and loading logic prevent duplicate rows.
- **Auto token refresh** — Strava access tokens are refreshed using `client_id`, `client_secret`, and `refresh_token` when expired.
- **dbt schema tests** — Staging and marts are covered by tests (e.g. not_null, unique on `activity_id`); they run after every `dbt run` in the DAG.
- **Metadata tracking** — `pacewise_raw._metadata` stores `pipeline_name` and `last_run_at` for observability and incremental cursors.
- **Exponential backoff** — Strava API calls use retries with backoff on 429/5xx to handle rate limits and transient errors.

### Dashboard features

- **Real-time KPI cards** — Total distance, activity count, average pace, average heart rate; monospace numbers with optional count-up and glow.
- **Weekly distance bar chart** — Holographic gradient fills, glass tooltips, grid and axis styling.
- **Pace trend line chart** — Strava-orange line with glow and area fill; week-level aggregation.
- **7-day vs 28-day rolling training load** — Dual-line chart plus a circular “acute:chronic ratio” indicator (green / yellow / red).
- **Heart rate zone breakdown** — Stacked bar by week with zone colors from the design palette.
- **Personal bests** — Grid of best 5K pace, longest run, most elevation, highest HR with holographic shimmer on values.
- **Filterable activity table** — Search by name, filter by type (Run / Ride / Swim / All), pagination; glass styling and hover states.
- **Glassmorphism dark UI** — Near-black background, glass cards (backdrop-blur, soft borders), Strava orange glow accents, corner brackets on featured cards.

---

## Tech stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Extraction | Python 3.11, Requests | Strava API client, OAuth, pagination, token storage |
| Orchestration | Apache Airflow 2.8 | DAG scheduling, retries, optional email alerts |
| Storage | Google BigQuery | Raw and transformed data warehouse |
| Transformation | dbt-bigquery | Staging views, mart models, schema tests |
| Containerization | Docker, Docker Compose | Local Airflow + Postgres, single-command run |
| Frontend | Next.js 14, TypeScript | Dashboard app, routing, API layer |
| Styling | Tailwind CSS, Framer Motion | Layout, design tokens, animations |
| Charts | Recharts | Bar, line, area, stacked bar, tooltips |

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

- **Python 3.11+** (for local extract/load if not using Docker only)
- **Docker** and **Docker Compose**
- **Node.js 18+** (for the frontend)
- **Google Cloud** account with BigQuery enabled
- **Strava** developer account ([strava.com/settings/api](https://www.strava.com/settings/api))

### Step 1 — Clone the repo

```bash
git clone https://github.com/fatinm1/pacewise.git
cd pacewise
```

### Step 2 — Strava OAuth setup

1. Go to [Strava API – Create & Manage Your App](https://www.strava.com/settings/api).
2. Create an application and note **Client ID** and **Client Secret**.
3. Complete the OAuth 2.0 flow to obtain a **refresh token** (authorization URL, redirect URI, and token exchange). Use scope **`activity:read_all`** so the pipeline can read all activities.  
   See [Strava OAuth documentation](https://developers.strava.com/docs/authentication/).
4. Put the **refresh token** in `.env` as `STRAVA_REFRESH_TOKEN`. The pipeline will store and refresh the access token in a local file (e.g. `strava_tokens.json`).

### Step 3 — Google Cloud setup

1. Create a GCP project (or use an existing one).
2. Enable the **BigQuery API**.
3. Create a **service account** with the **BigQuery Data Editor** (or **BigQuery Admin**) role.
4. Create a JSON key for the service account and download it.
5. Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env` to the **absolute path** of that JSON file (containers must see the same path; mount the file if needed).

### Step 4 — Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Use this as a reference (comments inline):

```bash
# Strava OAuth — from strava.com/settings/api and your OAuth flow
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token

# BigQuery — path to service account JSON key; project and dataset
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
BIGQUERY_PROJECT_ID=your-gcp-project-id
BIGQUERY_DATASET=pacewise_raw

# Airflow — optional; used for failure email alerts
AIRFLOW_ADMIN_EMAIL=your@email.com

# Optional — path to Strava token file (default: strava_tokens.json)
# STRAVA_TOKEN_FILE=./strava_tokens.json
```

### Step 5 — Run the pipeline

```bash
docker compose build
docker compose run --rm airflow-webserver airflow db init
docker compose run --rm airflow-webserver airflow users create \
  --role Admin --username admin --password admin --email admin@example.com \
  --firstname Admin --lastname User
docker compose up -d
```

- Open the Airflow UI at **http://localhost:8080** (e.g. login: `admin` / `admin`).
- Turn the **pacewise_daily** DAG **On** and click **Trigger DAG**.
- After a successful run you should see:
  - Raw data in `pacewise_raw.activities`
  - Metadata in `pacewise_raw._metadata`
  - dbt models built in your dbt target dataset (e.g. `pacewise`).

### Step 6 — Run the frontend

```bash
cd pacewise-frontend
npm install
npm run dev
```

Open **http://localhost:3000**. The app uses mock data by default. To point it at a real API, set `NEXT_PUBLIC_API_URL` in the frontend env.

---

## dbt models

PaceWise uses a three-layer transformation approach.

### Raw layer

- **BigQuery table**: `pacewise_raw.activities`
- Unmodified (or lightly normalized) Strava API response; loaded by the Python extract.

### Staging layer — `stg_activities`

- **Materialization**: view  
- **Source**: `pacewise_raw.activities`  
- **Purpose**: Typed, cleaned, renamed fields and one derived metric.

| Field | Type | Description |
|-------|------|-------------|
| `activity_id` | INT64 | Strava activity ID (from `id`) |
| `activity_name` | STRING | Name (from `name`) |
| `distance_meters` | FLOAT64 | Distance in meters |
| `moving_time_seconds` | INT64 | Moving time in seconds |
| `elapsed_time_seconds` | INT64 | Elapsed time in seconds |
| `total_elevation_gain` | FLOAT64 | Elevation gain in meters |
| `activity_type` | STRING | e.g. Run, Ride, Swim (from `type`) |
| `start_date` | TIMESTAMP | Activity start time |
| `average_heartrate` | FLOAT64 | Nullable |
| `max_heartrate` | FLOAT64 | Nullable |
| `average_speed_ms` | FLOAT64 | Speed in m/s |
| `pace_min_per_km` | FLOAT64 | `(1000 / average_speed_ms) / 60`; null when speed is 0 |

Rows with null `activity_id` are filtered out.

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

## Dashboard pages

| Route | Description |
|-------|-------------|
| **/** | Dashboard: hero “YOUR PACE. YOUR DATA.”, KPI row (distance, activities, pace, HR), weekly distance bar chart, recent activities feed. |
| **/performance** | Pace trend line chart, heart rate zone stacked bar by week, personal bests grid (best 5K, longest run, most elevation, highest HR). |
| **/training-load** | 7-day vs 28-day rolling distance line chart and circular acute:chronic ratio indicator with status color (green / yellow / red). |
| **/activities** | Full activity list: search by name, filter by type (Run / Ride / Swim / All), paginated table with date, name, type, distance, pace, time, HR. |
| **/settings** | Placeholder for preferences and integrations. |

---

## Design system

### Color palette

| Name | Hex | Usage |
|------|-----|--------|
| Background | `#080810` | Page and surface base |
| Surface (glass) | `rgba(255,255,255,0.03)` | Card backgrounds |
| Border | `rgba(255,255,255,0.08)` | Card and UI borders |
| Primary glow | `#FC4C02` | Strava orange — KPIs, active states, chart accents |
| Secondary glow | `#6366f1` | Indigo — secondary charts, variety |
| Text primary | `#f1f5f9` | Headings and body |
| Text muted | `#64748b` | Labels and secondary text |
| Holographic gradient | Orange → rose → purple → indigo → cyan | Hero text, chart fills, accents |

### Glass card spec

- **Background**: `rgba(255, 255, 255, 0.03)`  
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`  
- **Backdrop**: `backdrop-filter: blur(20px)`  
- **Border radius**: `16px`  
- **Shadow**: `0 0 40px rgba(252, 76, 2, 0.05)`, `inset 0 1px 0 rgba(255,255,255,0.06)`  
- **Hover**: border shifts toward `rgba(252, 76, 2, 0.3)`, outer glow increases.

### Glow system

- **Active metrics / primary**: `text-shadow: 0 0 20px rgba(252, 76, 2, 0.8)`  
- **Cards on hover**: stronger orange box-shadow  
- **Charts**: Strava orange and indigo stroke/glow; status colors (e.g. green/yellow/red) for the acute:chronic ring.

### Typography

- **UI**: Inter (sans) for labels, buttons, and body text.  
- **Metrics and numbers**: JetBrains Mono (monospace) for all numeric values and data-dense UI.

---

## Roadmap

**Done**

- [x] Strava OAuth with auto token refresh
- [x] Incremental BigQuery loading with `_metadata` tracking
- [x] dbt staging and mart models (performance + training load)
- [x] Airflow DAG with retries and optional email on failure
- [x] Next.js dashboard with glass UI and design system
- [x] Weekly performance charts and recent activities
- [x] Training load rolling 7d/28d windows and acute:chronic indicator

**Planned**

- [ ] Segment performance tracking (e.g. per-mile splits)
- [ ] GPX route map visualization
- [ ] Multi-athlete support
- [ ] Slack/email alerts for training milestones
- [ ] Snowflake adapter as alternative to BigQuery
- [ ] Public demo with anonymized data

---

## Contributing

1. Fork the repository.  
2. Create a feature branch (`git checkout -b feature/your-feature`).  
3. Make your changes and add tests where relevant.  
4. Submit a pull request with a clear description of the change.  
5. Open an issue for bugs or feature requests — they’re welcome.

---

## License

MIT License. Feel free to use this for your own athletic data obsession.

---

## Acknowledgements

- **Strava** for the API that makes athlete data accessible.  
- **dbt** for making SQL transformations versioned and testable.  
- **Apache Airflow** for reliable pipeline orchestration.  
- **Vercel** for frontend hosting and deployment.
