-- Fix v_tomorrow_rides view to show first segment time for local rides
DROP VIEW IF EXISTS v_tomorrow_rides;

CREATE VIEW v_tomorrow_rides AS
WITH first_seg AS (
  SELECT 
    ride_segments.ride_id,
    min(ride_segments.segment_start) AS first_start
  FROM ride_segments
  GROUP BY ride_segments.ride_id
)
SELECT 
  r.id,
  CASE
    WHEN r.ride_type = 'lokal' THEN ((r.origin || ' → ') || r.destination) || ' (više segmenata)'
    ELSE (r.origin || ' → ') || r.destination
  END AS label,
  COALESCE(r.start_at::date, fs.first_start::date) AS start_date,
  -- For local rides, always use first segment time; for others, use ride start_at
  to_char(
    CASE
      WHEN r.ride_type = 'lokal' AND fs.first_start IS NOT NULL THEN fs.first_start
      ELSE COALESCE(r.start_at::timestamp with time zone, fs.first_start)
    END, 
    'HH24:MI'
  ) AS start_time
FROM rides r
LEFT JOIN first_seg fs ON fs.ride_id = r.id
WHERE COALESCE(r.start_at::date, fs.first_start::date) = (CURRENT_DATE + interval '1 day')::date
ORDER BY COALESCE(r.start_at::timestamp with time zone, fs.first_start);