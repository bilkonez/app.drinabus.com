-- Drop and recreate the view with proper column ordering
DROP VIEW IF EXISTS v_calendar_events;

CREATE VIEW v_calendar_events AS
WITH base AS (
  -- non-lokal (linijski/vanlinijski)
  SELECT
    r.id as ride_id,
    null::uuid as segment_id,
    r.ride_type,
    r.status,
    r.origin,
    r.destination,
    r.driver_id,
    r.vehicle_id,
    r.start_at as event_start,
    CASE
      WHEN r.ride_type = 'vanlinijski' AND r.return_date IS NOT NULL THEN
        -- End of return_date in local timezone (23:59:00) converted to timestamptz
        (r.return_date::text || ' 23:59:00')::timestamp AT TIME ZONE 'Europe/Sarajevo'
      ELSE r.end_at
    END as event_end,
    r.total_price
  FROM rides r
  WHERE r.ride_type IN ('linijski','vanlinijski')

  UNION ALL

  -- lokal (segments remain as they are)
  SELECT
    r.id as ride_id,
    rs.id as segment_id,
    r.ride_type,
    r.status,
    rs.origin,
    rs.destination,
    r.driver_id,
    rs.vehicle_id,
    rs.segment_start as event_start,
    rs.segment_end as event_end,
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
  -- Additional helper columns
  date(event_start AT TIME ZONE 'Europe/Sarajevo') as event_date,
  EXTRACT(hour FROM event_start AT TIME ZONE 'Europe/Sarajevo')::numeric as start_hour,
  EXTRACT(minute FROM event_start AT TIME ZONE 'Europe/Sarajevo')::numeric as start_minute
FROM base;