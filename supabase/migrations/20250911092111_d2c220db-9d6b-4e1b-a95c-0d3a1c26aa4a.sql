-- Add public read access policy for operational vehicles on landing page
CREATE POLICY "Public can view operational vehicles" 
ON public.vehicles 
FOR SELECT 
USING (status = 'dostupno' AND is_operational = true);