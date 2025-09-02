-- Update the ride_type check constraint to include 'lokal'
ALTER TABLE public.rides 
DROP CONSTRAINT rides_ride_type_check;

ALTER TABLE public.rides 
ADD CONSTRAINT rides_ride_type_check 
CHECK (ride_type = ANY (ARRAY['linijski'::text, 'vanlinijski'::text, 'lokal'::text]));