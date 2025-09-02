-- Update v_calendar_events view to handle timezone conversion to Europe/Sarajevo
DROP VIEW IF EXISTS v_calendar_events;

CREATE VIEW v_calendar_events AS
WITH base AS (
  SELECT 
    r.id AS ride_id,
    r.ride_type,
    r.status,
    r.origin,
    r.destination,
    r.driver_id,
    r.vehicle_id,
    -- Convert UTC times to Europe/Sarajevo timezone
    (r.start_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sarajevo') AS event_start,
    (r.end_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sarajevo') AS event_end,
    NULL::uuid AS segment_id,
    r.total_price
  FROM rides r
  WHERE r.ride_type = ANY (ARRAY['linijski'::text, 'vanlinijski'::text])
  
  UNION ALL
  
  SELECT 
    r.id AS ride_id,
    r.ride_type,
    r.status,
    rs.origin,
    rs.destination,
    r.driver_id,
    rs.vehicle_id,
    -- Convert UTC times to Europe/Sarajevo timezone
    (rs.segment_start AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sarajevo') AS event_start,
    (rs.segment_end AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sarajevo') AS event_end,
    rs.id AS segment_id,
    rs.segment_price AS total_price
  FROM rides r
  JOIN ride_segments rs ON rs.ride_id = r.id
  WHERE r.ride_type = 'lokal'::text
)
SELECT 
  ride_id,
  segment_id,
  ride_type,
  status,
  (origin || ' → '::text) || destination AS title,
  event_start,
  event_end,
  driver_id,
  vehicle_id,
  total_price,
  date(event_start) AS event_date,
  EXTRACT(hour FROM event_start) AS start_hour,
  EXTRACT(minute FROM event_start) AS start_minute
FROM base
ORDER BY event_start;