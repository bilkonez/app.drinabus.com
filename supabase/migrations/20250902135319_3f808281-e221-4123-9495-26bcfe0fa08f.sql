-- Create view for tomorrow's rides
CREATE OR REPLACE VIEW v_tomorrow_rides AS
SELECT
  r.id,
  (r.origin || ' → ' || r.destination) AS label,
  r.start_at::date AS start_date,
  TO_CHAR(r.start_at, 'HH24:MI') AS start_time
FROM rides r
WHERE r.start_at::date = (CURRENT_DATE + INTERVAL '1 day')::date
ORDER BY r.start_at ASC;