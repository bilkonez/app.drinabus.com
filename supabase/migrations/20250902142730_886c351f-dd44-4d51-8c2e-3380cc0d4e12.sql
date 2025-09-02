-- Create unified calendar events view
CREATE OR REPLACE VIEW v_calendar_events AS
WITH base AS (
  -- Non-lokal rides (linijski, vanlinijski)
  SELECT
    r.id as ride_id,
    r.ride_type,
    r.status,
    r.origin,
    r.destination,
    r.driver_id,
    r.vehicle_id,
    r.start_at::timestamptz as event_start,
    r.end_at::timestamptz as event_end,
    null::uuid as segment_id,
    r.total_price
  FROM rides r
  WHERE r.ride_type IN ('linijski','vanlinijski')

  UNION ALL

  -- Lokal segments
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
  -- Add helper columns for easier querying
  DATE(event_start) as event_date,
  EXTRACT(hour FROM event_start) as start_hour,
  EXTRACT(minute FROM event_start) as start_minute
FROM base
ORDER BY event_start;