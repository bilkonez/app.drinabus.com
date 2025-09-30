-- Add client_name and payment_type columns to rides table
ALTER TABLE public.rides 
ADD COLUMN client_name TEXT,
ADD COLUMN payment_type TEXT DEFAULT 'K' CHECK (payment_type IN ('F', 'K'));