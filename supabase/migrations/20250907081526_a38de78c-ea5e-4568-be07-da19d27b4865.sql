-- Recreate remaining views with proper timezone handling

-- v_daily_stats view
CREATE OR REPLACE VIEW v_daily_stats AS
SELECT 
  DATE(r.start_at AT TIME ZONE 'Europe/Sarajevo') as day,
  COUNT(*) as rides_count,
  COALESCE(SUM(r.total_price), 0) as revenue_total,
  COALESCE(SUM(c.amount), 0) as costs_total,
  COALESCE(SUM(r.total_price), 0) - COALESCE(SUM(c.amount), 0) as profit_total
FROM rides r
LEFT JOIN costs c ON c.ride_id = r.id
WHERE r.status = 'zavrseno'
GROUP BY DATE(r.start_at AT TIME ZONE 'Europe/Sarajevo')
ORDER BY day DESC;

-- v_monthly_stats view
CREATE OR REPLACE VIEW v_monthly_stats AS
SELECT 
  TO_CHAR(DATE(r.start_at AT TIME ZONE 'Europe/Sarajevo'), 'YYYY-MM') as month,
  COUNT(*) as rides_count,
  COALESCE(SUM(r.total_price), 0) as revenue_total,
  COALESCE(SUM(c.amount), 0) as costs_total,
  COALESCE(SUM(r.total_price), 0) - COALESCE(SUM(c.amount), 0) as profit_total
FROM rides r
LEFT JOIN costs c ON c.ride_id = r.id
WHERE r.status = 'zavrseno'
GROUP BY TO_CHAR(DATE(r.start_at AT TIME ZONE 'Europe/Sarajevo'), 'YYYY-MM')
ORDER BY month DESC;

-- v_driver_monthly_hours view
CREATE OR REPLACE VIEW v_driver_monthly_hours AS
SELECT 
  dwl.employee_id,
  e.first_name || ' ' || e.last_name as driver_name,
  DATE_TRUNC('month', dwl.work_date) as month_start,
  SUM(dwl.hours) as total_hours,
  COUNT(DISTINCT dwl.work_date) as days_filled
FROM driver_work_log dwl
JOIN employees e ON e.id = dwl.employee_id
GROUP BY dwl.employee_id, e.first_name, e.last_name, DATE_TRUNC('month', dwl.work_date)
ORDER BY month_start DESC, driver_name;

-- v_employees_with_roles view
CREATE OR REPLACE VIEW v_employees_with_roles AS
SELECT 
  e.*,
  ARRAY_AGG(er.role_id) FILTER (WHERE er.role_id IS NOT NULL) as roles_array,
  STRING_AGG(er.role_id, ', ') as roles_csv,
  BOOL_OR(er.role_id = 'vozac') as is_vozac,
  BOOL_OR(er.role_id = 'mehanicar') as is_mehanicar,
  BOOL_OR(er.role_id = 'operativa') as is_operativa
FROM employees e
LEFT JOIN employee_roles er ON er.employee_id = e.id
GROUP BY e.id, e.first_name, e.last_name, e.email, e.phone, e.role, e.active, e.license_expiry, e.tachograph_card_expiry, e.notes, e.created_at, e.updated_at;

-- v_reminders_due view
CREATE OR REPLACE VIEW v_reminders_due AS
SELECT 
  'employee' as kind,
  e.id::text as ref_id,
  e.first_name || ' ' || e.last_name || ' - Vozačka dozvola' as title,
  e.license_expiry as expiry_date,
  e.license_expiry - CURRENT_DATE as days_left
FROM employees e
WHERE e.license_expiry IS NOT NULL AND e.license_expiry <= CURRENT_DATE + INTERVAL '30 days' AND e.active = true

UNION ALL

SELECT 
  'employee' as kind,
  e.id::text as ref_id,
  e.first_name || ' ' || e.last_name || ' - Tahograf karta' as title,
  e.tachograph_card_expiry as expiry_date,
  e.tachograph_card_expiry - CURRENT_DATE as days_left
FROM employees e
WHERE e.tachograph_card_expiry IS NOT NULL AND e.tachograph_card_expiry <= CURRENT_DATE + INTERVAL '30 days' AND e.active = true

UNION ALL

SELECT 
  'vehicle' as kind,
  v.id::text as ref_id,
  v.registration || ' - Registracija' as title,
  vd.registration_expiry as expiry_date,
  vd.registration_expiry - CURRENT_DATE as days_left
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.registration_expiry IS NOT NULL AND vd.registration_expiry <= CURRENT_DATE + INTERVAL '30 days'

UNION ALL

SELECT 
  'vehicle' as kind,
  v.id::text as ref_id,
  v.registration || ' - Tehnički pregled' as title,
  vd.technical_expiry as expiry_date,
  vd.technical_expiry - CURRENT_DATE as days_left
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.technical_expiry IS NOT NULL AND vd.technical_expiry <= CURRENT_DATE + INTERVAL '30 days'

UNION ALL

SELECT 
  'vehicle' as kind,
  v.id::text as ref_id,
  v.registration || ' - Tehnički 6m' as title,
  vd.technical_6m_expiry as expiry_date,
  vd.technical_6m_expiry - CURRENT_DATE as days_left
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.technical_6m_expiry IS NOT NULL AND vd.technical_6m_expiry <= CURRENT_DATE + INTERVAL '30 days'

UNION ALL

SELECT 
  'vehicle' as kind,
  v.id::text as ref_id,
  v.registration || ' - Tahograf kalibracija' as title,
  vd.tachograph_calibration_expiry as expiry_date,
  vd.tachograph_calibration_expiry - CURRENT_DATE as days_left
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.tachograph_calibration_expiry IS NOT NULL AND vd.tachograph_calibration_expiry <= CURRENT_DATE + INTERVAL '30 days'

UNION ALL

SELECT 
  'vehicle' as kind,
  v.id::text as ref_id,
  v.registration || ' - Aparat za gašenje' as title,
  vd.fire_extinguisher_expiry as expiry_date,
  vd.fire_extinguisher_expiry - CURRENT_DATE as days_left
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.fire_extinguisher_expiry IS NOT NULL AND vd.fire_extinguisher_expiry <= CURRENT_DATE + INTERVAL '30 days'

ORDER BY days_left ASC;

-- v_tomorrow_rides view
CREATE OR REPLACE VIEW v_tomorrow_rides AS
SELECT 
  r.id,
  DATE(r.start_at AT TIME ZONE 'Europe/Sarajevo') as start_date,
  TO_CHAR(r.start_at AT TIME ZONE 'Europe/Sarajevo', 'HH24:MI') as start_time,
  r.origin || ' → ' || r.destination as label
FROM rides r
WHERE DATE(r.start_at AT TIME ZONE 'Europe/Sarajevo') = CURRENT_DATE + INTERVAL '1 day'
  AND r.status = 'planirano'
ORDER BY r.start_at;

-- v_vehicle_monthly_costs view
CREATE OR REPLACE VIEW v_vehicle_monthly_costs AS
SELECT 
  v.id as vehicle_id,
  v.registration,
  TO_CHAR(DATE_TRUNC('month', c.created_at), 'YYYY-MM') as month,
  SUM(c.amount) as costs_total
FROM vehicles v
LEFT JOIN costs c ON c.vehicle_id = v.id
WHERE c.amount IS NOT NULL
GROUP BY v.id, v.registration, DATE_TRUNC('month', c.created_at)
ORDER BY month DESC, v.registration;

-- v_vehicle_reminders_dashboard view
CREATE OR REPLACE VIEW v_vehicle_reminders_dashboard AS
SELECT 
  v.id as vehicle_id,
  v.registration,
  'Registracija' as reminder_type,
  vd.registration_expiry as expiry_date,
  vd.registration_expiry - CURRENT_DATE as days_until_expiry
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.registration_expiry IS NOT NULL AND vd.registration_expiry <= CURRENT_DATE + INTERVAL '60 days'

UNION ALL

SELECT 
  v.id as vehicle_id,
  v.registration,
  'Tehnički pregled' as reminder_type,
  vd.technical_expiry as expiry_date,
  vd.technical_expiry - CURRENT_DATE as days_until_expiry
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.technical_expiry IS NOT NULL AND vd.technical_expiry <= CURRENT_DATE + INTERVAL '60 days'

UNION ALL

SELECT 
  v.id as vehicle_id,
  v.registration,
  'Tehnički 6m' as reminder_type,
  vd.technical_6m_expiry as expiry_date,
  vd.technical_6m_expiry - CURRENT_DATE as days_until_expiry
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.technical_6m_expiry IS NOT NULL AND vd.technical_6m_expiry <= CURRENT_DATE + INTERVAL '60 days'

UNION ALL

SELECT 
  v.id as vehicle_id,
  v.registration,
  'Tahograf kalibracija' as reminder_type,
  vd.tachograph_calibration_expiry as expiry_date,
  vd.tachograph_calibration_expiry - CURRENT_DATE as days_until_expiry
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.tachograph_calibration_expiry IS NOT NULL AND vd.tachograph_calibration_expiry <= CURRENT_DATE + INTERVAL '60 days'

UNION ALL

SELECT 
  v.id as vehicle_id,
  v.registration,
  'Aparat za gašenje' as reminder_type,
  vd.fire_extinguisher_expiry as expiry_date,
  vd.fire_extinguisher_expiry - CURRENT_DATE as days_until_expiry
FROM vehicles v
JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
WHERE vd.fire_extinguisher_expiry IS NOT NULL AND vd.fire_extinguisher_expiry <= CURRENT_DATE + INTERVAL '60 days'

ORDER BY days_until_expiry ASC;