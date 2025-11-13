-- Update Zagreb tour date to 19.12.2025. and shorten description
UPDATE tour_packages 
SET 
  available_from = '2025-12-19',
  available_to = '2025-12-19',
  short_description = 'Jednodnevni izlet u Zagreb za vrijeme adventske čarolije.'
WHERE slug = 'zagreb-advent';