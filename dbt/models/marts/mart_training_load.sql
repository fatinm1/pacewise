{{
  config(
    materialized='table',
  )
}}

with stg as (
    select
        activity_id,
        start_date,
        distance_meters,
        distance_meters / 1000.0 as distance_km
    from {{ ref('stg_activities') }}
),

with_rolling as (
    select
        activity_id,
        start_date,
        distance_km,
        sum(distance_km) over (
            order by unix_date(date(start_date))
            range between 6 preceding and current row
        ) as rolling_7d_distance_km,
        sum(distance_km) over (
            order by unix_date(date(start_date))
            range between 27 preceding and current row
        ) as rolling_28d_distance_km
    from stg
)

select * from with_rolling order by start_date
