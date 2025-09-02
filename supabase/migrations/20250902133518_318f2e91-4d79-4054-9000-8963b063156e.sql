-- Create vehicle_deadlines table if not exists
CREATE TABLE IF NOT EXISTS public.vehicle_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  registration_expiry DATE,
  technical_expiry DATE,
  technical_6m_expiry DATE,
  tachograph_calibration_expiry DATE,
  fire_extinguisher_expiry DATE,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(vehicle_id)
);

-- Create vehicle_service table if not exists
CREATE TABLE IF NOT EXISTS public.vehicle_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type TEXT CHECK (service_type IN ('mali_servis','ostalo')) DEFAULT 'mali_servis',
  description TEXT,
  service_date DATE NOT NULL,
  cost NUMERIC(12,2),
  invoice_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create costs table if not exists
CREATE TABLE IF NOT EXISTS public.costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  cost_type TEXT CHECK (cost_type IN ('gorivo','putarina','parking','dnevnice','servis','ostalo')) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.vehicle_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "full_access_policy" ON public.vehicle_deadlines
  FOR ALL USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
  WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);

CREATE POLICY "full_access_policy" ON public.vehicle_service
  FOR ALL USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
  WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);

CREATE POLICY "full_access_policy" ON public.costs
  FOR ALL USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
  WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);

-- Create reminders view
CREATE OR REPLACE VIEW public.v_reminders_due AS
WITH due AS (
  SELECT 'vozac_licenca'::text as kind, e.id::text as ref_id,
         (e.first_name || ' ' || e.last_name) as title, e.license_expiry as expiry_date
  FROM employees e WHERE e.license_expiry IS NOT NULL
  UNION ALL
  SELECT 'vozac_tahograf_kartica', e.id::text,
         (e.first_name || ' ' || e.last_name), e.tachograph_card_expiry
  FROM employees e WHERE e.tachograph_card_expiry IS NOT NULL
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
WHERE expiry_date BETWEEN current_date AND (current_date + INTERVAL '30 days')
ORDER BY expiry_date ASC;

-- Create upcoming rides view
CREATE OR REPLACE VIEW public.v_upcoming_rides AS
SELECT
  r.id,
  (r.origin || ' → ' || r.destination) as label,
  r.start_at::date as start_date,
  to_char(r.start_at, 'HH24:MI') as start_time,
  (r.start_at::date - current_date) as days_left
FROM rides r
WHERE r.start_at::date BETWEEN current_date AND (current_date + INTERVAL '30 days')
ORDER BY r.start_at ASC;

-- Create daily stats view
CREATE OR REPLACE VIEW public.v_daily_stats AS
SELECT
  date_trunc('day', r.start_at)::date as day,
  count(r.id) as rides_count,
  coalesce(sum(r.total_price),0) as revenue_total,
  coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as costs_total,
  coalesce(sum(r.total_price),0)
  - coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as profit_total
FROM rides r
GROUP BY 1
ORDER BY 1 DESC;

-- Create monthly stats view
CREATE OR REPLACE VIEW public.v_monthly_stats AS
SELECT
  to_char(date_trunc('month', r.start_at), 'YYYY-MM') as month,
  count(r.id) as rides_count,
  coalesce(sum(r.total_price),0) as revenue_total,
  coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as costs_total,
  coalesce(sum(r.total_price),0)
  - coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as profit_total
FROM rides r
GROUP BY 1
ORDER BY 1 DESC;

-- Create vehicle monthly costs view
CREATE OR REPLACE VIEW public.v_vehicle_monthly_costs AS
SELECT
  v.id as vehicle_id,
  v.registration,
  to_char(date_trunc('month', coalesce(r.start_at, c.created_at)), 'YYYY-MM') as month,
  coalesce(sum(c.amount),0) as costs_total
FROM vehicles v
LEFT JOIN rides r ON r.vehicle_id = v.id
LEFT JOIN costs c ON c.vehicle_id = v.id OR c.ride_id = r.id
GROUP BY 1,2,3
ORDER BY 3 DESC, 2;

-- Create storage folder for invoices
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('media', 'invoices/.gitkeep', '32029762-6ded-4cd7-8ad8-d7c1b9883ca3', '{}')
ON CONFLICT DO NOTHING;