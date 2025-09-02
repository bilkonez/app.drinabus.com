-- Create a test local ride for tomorrow to verify the v_tomorrow_rides view
INSERT INTO public.rides (
  origin, 
  destination, 
  start_at, 
  end_at, 
  ride_type,
  status,
  driver_id,
  vehicle_id
) VALUES (
  'Test Lokal Start',
  'Test Lokal End', 
  DATE(NOW() + INTERVAL '1 DAY') + TIME '08:00:00',
  DATE(NOW() + INTERVAL '1 DAY') + TIME '16:00:00',
  'lokal',
  'planirano',
  (SELECT id FROM employees WHERE role = 'vozac' LIMIT 1),
  (SELECT id FROM vehicles LIMIT 1)
);