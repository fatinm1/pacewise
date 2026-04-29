{{
  config(
    materialized='table',
  )
}}

{%- set max_hr_bpm = env_var('HR_MAX_BPM', '190') -%}
{%- set z1_max = env_var('HR_ZONE_Z1_MAX', '0.60') -%}
{%- set z2_max = env_var('HR_ZONE_Z2_MAX', '0.70') -%}
{%- set z3_max = env_var('HR_ZONE_Z3_MAX', '0.80') -%}
{%- set z4_max = env_var('HR_ZONE_Z4_MAX', '0.90') -%}

with base as (
    select
        date_trunc(start_date, week) as week_start,
        average_heartrate,
        moving_time_seconds
    from {{ ref('stg_activities') }}
    where average_heartrate is not null
      and moving_time_seconds is not null
      and moving_time_seconds > 0
),

classified as (
    select
        week_start,
        cast(moving_time_seconds as float64) / 60.0 as minutes,
        case
            when average_heartrate <= (cast({{ max_hr_bpm }} as float64) * cast({{ z1_max }} as float64)) then 'Z1'
            when average_heartrate <= (cast({{ max_hr_bpm }} as float64) * cast({{ z2_max }} as float64)) then 'Z2'
            when average_heartrate <= (cast({{ max_hr_bpm }} as float64) * cast({{ z3_max }} as float64)) then 'Z3'
            when average_heartrate <= (cast({{ max_hr_bpm }} as float64) * cast({{ z4_max }} as float64)) then 'Z4'
            else 'Z5'
        end as zone_name
    from base
),

zone_minutes as (
    select
        week_start,
        zone_name,
        sum(minutes) as minutes
    from classified
    group by 1, 2
),

totals as (
    select
        week_start,
        sum(minutes) as total_minutes
    from zone_minutes
    group by 1
),

final as (
    select
        zm.week_start,
        zm.zone_name,
        case zm.zone_name
            when 'Z1' then '#06b6d4'
            when 'Z2' then '#6366f1'
            when 'Z3' then '#a855f7'
            when 'Z4' then '#f43f5e'
            else '#FC4C02'
        end as zone_color,
        zm.minutes,
        safe_divide(zm.minutes, t.total_minutes) * 100.0 as percentage
    from zone_minutes zm
    join totals t using (week_start)
)

select * from final
order by week_start, zone_name

