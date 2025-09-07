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

-- Update v_calendar_events view to support multi-day vanlinijski rides
CREATE OR REPLACE VIEW v_calendar_events AS
WITH base AS (
  -- NON-LOKAL (linijski/vanlinijski) with proper event_end for multi-day vanlinijski
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
        -- End of return_date in local timezone (23:59:59)
        THEN (r.return_date + INTERVAL '1 day' - INTERVAL '1 second')::timestamptz
      ELSE r.end_at
    END as event_end,
    NULL::uuid as segment_id,
    r.total_price
  FROM rides r
  WHERE r.ride_type IN ('linijski', 'vanlinijski')

  UNION ALL

  -- LOKAL (segments remain the same)
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
  -- Helper fields for calendar display
  DATE(event_start AT TIME ZONE 'Europe/Sarajevo') as event_date,
  EXTRACT(hour FROM event_start AT TIME ZONE 'Europe/Sarajevo') as start_hour,
  EXTRACT(minute FROM event_start AT TIME ZONE 'Europe/Sarajevo') as start_minute
FROM base;