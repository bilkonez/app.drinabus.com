-- Drop existing view first
DROP VIEW IF EXISTS v_vehicle_reminders_dashboard;

-- Create new vehicle reminders dashboard view
CREATE OR REPLACE VIEW v_vehicle_reminders_dashboard AS
WITH due AS (
  SELECT v.id as vehicle_id, v.registration, 'Registracija'::text as kind, vd.registration_expiry as expiry_date
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.registration_expiry IS NOT NULL
  UNION ALL
  SELECT v.id, v.registration, 'Tehnički', vd.technical_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.technical_expiry IS NOT NULL
  UNION ALL
  SELECT v.id, v.registration, '6-mj Tehnički', vd.technical_6m_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.technical_6m_expiry IS NOT NULL
  UNION ALL
  SELECT v.id, v.registration, 'Baždarenje tahografa', vd.tachograph_calibration_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.tachograph_calibration_expiry IS NOT NULL
  UNION ALL
  SELECT v.id, v.registration, 'PP aparat', vd.fire_extinguisher_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.fire_extinguisher_expiry IS NOT NULL
)
SELECT
  vehicle_id,
  registration,
  kind,
  expiry_date::date,
  (expiry_date::date - current_date)::int as days_left
FROM due
WHERE expiry_date::date BETWEEN current_date AND (current_date + interval '30 days')::date
ORDER BY expiry_date ASC, registration ASC;

-- Create employee reminders dashboard view  
CREATE OR REPLACE VIEW v_employee_reminders_dashboard AS
WITH due AS (
  SELECT e.id as employee_id, (e.first_name || ' ' || e.last_name) as employee_name, 'Vozačka dozvola'::text as kind, e.license_expiry as expiry_date
  FROM employees e
  WHERE e.license_expiry IS NOT NULL AND e.active = true
  UNION ALL
  SELECT e.id, (e.first_name || ' ' || e.last_name), 'Tahograf kartica', e.tachograph_card_expiry
  FROM employees e
  WHERE e.tachograph_card_expiry IS NOT NULL AND e.active = true
)
SELECT
  employee_id,
  employee_name,
  kind,
  expiry_date::date,
  (expiry_date::date - current_date)::int as days_left
FROM due
WHERE expiry_date::date BETWEEN current_date AND (current_date + interval '30 days')::date
ORDER BY expiry_date ASC, employee_name ASC;