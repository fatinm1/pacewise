{{
  config(
    materialized='view',
  )
}}

with source as (
    select * from {{ source('pacewise_raw', 'activities') }}
),

renamed as (
    select
        cast(id as int64) as activity_id,
        cast(name as string) as activity_name,
        cast(distance as float64) as distance_meters,
        cast(moving_time as int64) as moving_time_seconds,
        cast(elapsed_time as int64) as elapsed_time_seconds,
        cast(total_elevation_gain as float64) as total_elevation_gain,
        cast(type as string) as activity_type,
        cast(start_date as timestamp) as start_date,
        cast(average_heartrate as float64) as average_heartrate,
        cast(max_heartrate as float64) as max_heartrate,
        cast(average_speed as float64) as average_speed_ms,
        -- pace in min/km: (1000 m / average_speed m/s) / 60 s
        safe_divide(1000.0 / nullif(average_speed, 0), 60.0) as pace_min_per_km
    from source
    where id is not null
)

select * from renamed
