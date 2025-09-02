-- Remove the test ride for tomorrow
DELETE FROM public.rides 
WHERE origin = 'Goražde' 
AND destination = 'Sarajevo' 
AND start_at = DATE(NOW() + INTERVAL '1 DAY') + TIME '07:00:00';