{{
  config(
    materialized='table',
  )
}}

with stg as (
    select * from {{ ref('stg_activities') }}
),

runs_only as (
    select * from stg
    where activity_type = 'Run'
),

by_week as (
    select
        date_trunc(start_date, week) as week_start,
        sum(distance_meters) / 1000.0 as total_distance_km,
        sum(moving_time_seconds) / 3600.0 as total_moving_time_hours,
        avg(pace_min_per_km) as avg_pace_min_per_km,
        avg(average_heartrate) as avg_heartrate,
        count(*) as activity_count
    from runs_only
    group by 1
)

select * from by_week order by week_start
