-- Add 'lokal' type to rides.ride_type 
-- No need to modify existing constraint since we're using text field

-- Create ride_segments table
CREATE TABLE IF NOT EXISTS ride_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  segment_start TIMESTAMPTZ NOT NULL,
  segment_end TIMESTAMPTZ,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  segment_price NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ride_segments
ALTER TABLE ride_segments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ride_segments
CREATE POLICY "full_access_policy" ON ride_segments
FOR ALL 
USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);

-- Add trigger for updated_at
CREATE TRIGGER update_ride_segments_updated_at
  BEFORE UPDATE ON ride_segments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Update v_tomorrow_rides view to include lokal rides
CREATE OR REPLACE VIEW v_tomorrow_rides AS
WITH first_seg AS (
  SELECT ride_id, MIN(segment_start) as first_start
  FROM ride_segments
  GROUP BY ride_id
)
SELECT
  r.id,
  CASE 
    WHEN r.ride_type = 'lokal' THEN r.origin || ' → ' || r.destination || ' (više segmenata)'
    ELSE r.origin || ' → ' || r.destination
  END as label,
  COALESCE(r.start_at::date, fs.first_start::date) as start_date,
  TO_CHAR(COALESCE(r.start_at, fs.first_start), 'HH24:MI') as start_time
FROM rides r
LEFT JOIN first_seg fs ON fs.ride_id = r.id
WHERE COALESCE(r.start_at::date, fs.first_start::date) = (CURRENT_DATE + INTERVAL '1 day')::date
ORDER BY COALESCE(r.start_at, fs.first_start) ASC;