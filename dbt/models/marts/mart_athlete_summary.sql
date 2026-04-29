{{
  config(
    materialized='table',
  )
}}

with activities as (
    select
        start_date
    from {{ ref('stg_activities') }}
),

metadata as (
    select
        max(last_run_at) as last_sync_at
    from {{ source('pacewise_raw', '_metadata') }}
),

summary as (
    select
        count(*) as total_activities,
        min(date(start_date)) as member_since
    from activities
)

select
    'PaceWise Athlete' as name,
    cast(null as string) as avatar_url,
    summary.member_since as member_since,
    summary.total_activities as total_activities,
    metadata.last_sync_at as last_sync_at
from summary
cross join metadata

