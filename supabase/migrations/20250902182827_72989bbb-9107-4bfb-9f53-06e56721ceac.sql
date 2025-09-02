-- Remove the test local ride that was created for testing
DELETE FROM public.rides 
WHERE origin = 'Test Lokal Start' 
AND destination = 'Test Lokal End' 
AND ride_type = 'lokal';