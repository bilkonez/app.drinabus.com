-- Add is_operational field to vehicles table to control visibility
ALTER TABLE vehicles ADD COLUMN is_operational boolean DEFAULT true;

-- Set Mercedes Vito O08 as non-operational to hide it from public view
UPDATE vehicles 
SET is_operational = false 
WHERE registration = 'O08-E-056' AND brand = 'Mercedes' AND model = 'Vito';