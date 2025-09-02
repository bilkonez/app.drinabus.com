-- 1) Master table for roles
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY CHECK (id IN ('vozac','mehanicar','operativa','ostalo'))
);

INSERT INTO roles(id) VALUES
  ('vozac'),('mehanicar'),('operativa'),('ostalo')
ON CONFLICT DO NOTHING;

-- 2) Junction table for multiple roles per employee
CREATE TABLE IF NOT EXISTS employee_roles (
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  role_id text REFERENCES roles(id) ON DELETE RESTRICT,
  PRIMARY KEY (employee_id, role_id),
  created_at timestamptz DEFAULT now()
);

-- 3) Migrate existing single role data to junction table
INSERT INTO employee_roles (employee_id, role_id)
SELECT id, CASE
  WHEN role IN ('vozac','mehanicar','operativa','ostalo') THEN role
  ELSE 'ostalo'
END
FROM employees
WHERE role IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4) Create view for easy reading with role aggregations
CREATE OR REPLACE VIEW v_employees_with_roles AS
SELECT
  e.*,
  ARRAY_AGG(er.role_id ORDER BY er.role_id) FILTER (WHERE er.role_id IS NOT NULL) as roles_array,
  ARRAY_TO_STRING(ARRAY_AGG(er.role_id ORDER BY er.role_id), ',') as roles_csv,
  BOOL_OR(er.role_id = 'vozac') as is_vozac,
  BOOL_OR(er.role_id = 'mehanicar') as is_mehanicar,
  BOOL_OR(er.role_id = 'operativa') as is_operativa
FROM employees e
LEFT JOIN employee_roles er ON er.employee_id = e.id
GROUP BY e.id;

-- 5) Set up RLS policies for new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;

-- Admin full access policies for new tables
CREATE POLICY admin_full_access ON roles
FOR ALL 
USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);

CREATE POLICY admin_full_access ON employee_roles
FOR ALL 
USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);

-- 6) Update reminders view to use new role system
CREATE OR REPLACE VIEW v_reminders_due AS
WITH e AS (
  SELECT * FROM v_employees_with_roles
),
due AS (
  SELECT 'vozac_licenca'::text as kind, e.id::text as ref_id,
         (e.first_name || ' ' || e.last_name) as title, e.license_expiry as expiry_date
  FROM e WHERE e.is_vozac = true AND e.license_expiry IS NOT NULL

  UNION ALL
  SELECT 'vozac_tahograf_kartica', e.id::text,
         (e.first_name || ' ' || e.last_name), e.tachograph_card_expiry
  FROM e WHERE e.is_vozac = true AND e.tachograph_card_expiry IS NOT NULL

  UNION ALL
  SELECT 'vozilo_registracija', v.id::text, v.registration, vd.registration_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.registration_expiry IS NOT NULL

  UNION ALL
  SELECT 'vozilo_tehnicki', v.id::text, v.registration, vd.technical_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.technical_expiry IS NOT NULL

  UNION ALL
  SELECT 'vozilo_tehnicki_6m', v.id::text, v.registration, vd.technical_6m_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.technical_6m_expiry IS NOT NULL

  UNION ALL
  SELECT 'vozilo_tahograf_bazdarenje', v.id::text, v.registration, vd.tachograph_calibration_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.tachograph_calibration_expiry IS NOT NULL

  UNION ALL
  SELECT 'vozilo_pp_aparat', v.id::text, v.registration, vd.fire_extinguisher_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.fire_extinguisher_expiry IS NOT NULL
)
SELECT kind, ref_id, title, expiry_date, (expiry_date - current_date) as days_left
FROM due
WHERE expiry_date BETWEEN current_date AND (current_date + interval '30 days')
ORDER BY expiry_date ASC;