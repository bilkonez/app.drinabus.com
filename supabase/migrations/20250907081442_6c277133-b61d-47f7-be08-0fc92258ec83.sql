-- Drop ALL dependent views first
DROP VIEW IF EXISTS v_daily_stats CASCADE;
DROP VIEW IF EXISTS v_monthly_stats CASCADE;
DROP VIEW IF EXISTS v_calendar_events CASCADE;
DROP VIEW IF EXISTS v_driver_monthly_hours CASCADE;
DROP VIEW IF EXISTS v_employees_with_roles CASCADE;
DROP VIEW IF EXISTS v_reminders_due CASCADE;
DROP VIEW IF EXISTS v_tomorrow_rides CASCADE;
DROP VIEW IF EXISTS v_vehicle_monthly_costs CASCADE;
DROP VIEW IF EXISTS v_vehicle_reminders_dashboard CASCADE;

-- Fix timestamp types to ensure proper UTC storage
ALTER TABLE rides 
  ALTER COLUMN start_at TYPE timestamptz USING start_at::timestamptz,
  ALTER COLUMN end_at TYPE timestamptz USING end_at::timestamptz,
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz,
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at::timestamptz;

ALTER TABLE ride_segments 
  ALTER COLUMN segment_start TYPE timestamptz USING segment_start::timestamptz,
  ALTER COLUMN segment_end TYPE timestamptz USING segment_end::timestamptz,
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz,
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at::timestamptz;

-- Add return_date column if not exists
ALTER TABLE rides ADD COLUMN IF NOT EXISTS return_date date;

-- Recreate all views with proper timezone handling

-- v_calendar_events with multi-day support
CREATE OR REPLACE VIEW v_calendar_events AS
WITH base AS (
  SELECT
    r.id as ride_id,
    r.ride_type,
    r.status,
    r.origin,
    r.destination,
    r.driver_id,
    r.vehicle_id,
    r.start_at as event_start,
    CASE
      WHEN r.ride_type = 'vanlinijski' AND r.return_date IS NOT NULL
        THEN (r.return_date + INTERVAL '1 day' - INTERVAL '1 second')::timestamptz
      ELSE r.end_at
    END as event_end,
    NULL::uuid as segment_id,
    r.total_price
  FROM rides r
  WHERE r.ride_type IN ('linijski', 'vanlinijski')
  UNION ALL
  SELECT
    r.id as ride_id,
    r.ride_type,
    r.status,
    rs.origin,
    rs.destination,
    r.driver_id,
    rs.vehicle_id,
    rs.segment_start as event_start,
    rs.segment_end as event_end,
    rs.id as segment_id,
    rs.segment_price as total_price
  FROM rides r
  JOIN ride_segments rs ON rs.ride_id = r.id
  WHERE r.ride_type = 'lokal'
)
SELECT
  ride_id,
  segment_id,
  ride_type,
  status,
  origin || ' → ' || destination as title,
  event_start,
  event_end,
  driver_id,
  vehicle_id,
  total_price,
  DATE(event_start AT TIME ZONE 'Europe/Sarajevo') as event_date,
  EXTRACT(hour FROM event_start AT TIME ZONE 'Europe/Sarajevo') as start_hour,
  EXTRACT(minute FROM event_start AT TIME ZONE 'Europe/Sarajevo') as start_minute
FROM base;