-- Create a test ride for tomorrow to check if tomorrow rides view works
INSERT INTO public.rides (
  origin, 
  destination, 
  start_at, 
  end_at, 
  ride_type,
  status,
  driver_id,
  vehicle_id,
  total_price
) VALUES (
  'Goražde',
  'Sarajevo', 
  DATE(NOW() + INTERVAL '1 DAY') + TIME '07:00:00',
  DATE(NOW() + INTERVAL '1 DAY') + TIME '15:00:00',
  'vanlinijski',
  'planirano',
  (SELECT id FROM employees WHERE role = 'vozac' LIMIT 1),
  (SELECT id FROM vehicles LIMIT 1),
  150.00
);