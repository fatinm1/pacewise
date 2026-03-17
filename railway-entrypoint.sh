#!/usr/bin/env bash
set -euo pipefail

# Default Airflow home (from base image)
: "${AIRFLOW_HOME:=/opt/airflow}"

cd "${AIRFLOW_HOME}"

echo "Running Airflow db upgrade..."
airflow db upgrade

echo "Ensuring admin user exists..."
airflow users create \
  --role Admin \
  --username "${AIRFLOW_ADMIN_USERNAME:-admin}" \
  --password "${AIRFLOW_ADMIN_PASSWORD:-admin}" \
  --email "${AIRFLOW_ADMIN_EMAIL:-admin@example.com}" \
  --firstname Admin \
  --lastname User || true

echo "Starting supervisord (Airflow webserver, scheduler, Next.js)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord-airflow.conf

