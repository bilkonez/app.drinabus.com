-- Fix critical RLS security issues

-- Add RLS policy for admins table
CREATE POLICY "Admin access policy" ON public.admins
  FOR ALL USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
  WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);

-- Add RLS policies for analytical views
ALTER VIEW public.v_daily_stats SET (security_barrier = true);
ALTER VIEW public.v_monthly_stats SET (security_barrier = true);
ALTER VIEW public.v_reminders_due SET (security_barrier = true);
ALTER VIEW public.v_vehicle_monthly_costs SET (security_barrier = true);
ALTER VIEW public.v_upcoming_rides SET (security_barrier = true);

-- Create RLS policies for views by creating security definer functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate views with RLS security
CREATE OR REPLACE VIEW public.v_daily_stats WITH (security_barrier = true) AS
SELECT
  date_trunc('day', r.start_at)::date as day,
  count(r.id) as rides_count,
  coalesce(sum(r.total_price),0) as revenue_total,
  coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as costs_total,
  coalesce(sum(r.total_price),0)
  - coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as profit_total
FROM rides r
WHERE public.is_admin()
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.v_monthly_stats WITH (security_barrier = true) AS
SELECT
  to_char(date_trunc('month', r.start_at), 'YYYY-MM') as month,
  count(r.id) as rides_count,
  coalesce(sum(r.total_price),0) as revenue_total,
  coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as costs_total,
  coalesce(sum(r.total_price),0)
  - coalesce((SELECT sum(c.amount) FROM costs c WHERE c.ride_id = ANY(array_agg(r.id))),0) as profit_total
FROM rides r
WHERE public.is_admin()
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.v_reminders_due WITH (security_barrier = true) AS
WITH due AS (
  SELECT 'vozac_licenca'::text as kind, e.id::text as ref_id,
         (e.first_name || ' ' || e.last_name) as title, e.license_expiry as expiry_date
  FROM employees e WHERE e.license_expiry IS NOT NULL AND public.is_admin()
  UNION ALL
  SELECT 'vozac_tahograf_kartica', e.id::text,
         (e.first_name || ' ' || e.last_name), e.tachograph_card_expiry
  FROM employees e WHERE e.tachograph_card_expiry IS NOT NULL AND public.is_admin()
  UNION ALL
  SELECT 'vozilo_registracija', v.id::text, v.registration, vd.registration_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.registration_expiry IS NOT NULL AND public.is_admin()
  UNION ALL
  SELECT 'vozilo_tehnicki', v.id::text, v.registration, vd.technical_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.technical_expiry IS NOT NULL AND public.is_admin()
  UNION ALL
  SELECT 'vozilo_tehnicki_6m', v.id::text, v.registration, vd.technical_6m_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.technical_6m_expiry IS NOT NULL AND public.is_admin()
  UNION ALL
  SELECT 'vozilo_tahograf_bazdarenje', v.id::text, v.registration, vd.tachograph_calibration_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.tachograph_calibration_expiry IS NOT NULL AND public.is_admin()
  UNION ALL
  SELECT 'vozilo_pp_aparat', v.id::text, v.registration, vd.fire_extinguisher_expiry
  FROM vehicles v JOIN vehicle_deadlines vd ON vd.vehicle_id = v.id
  WHERE vd.fire_extinguisher_expiry IS NOT NULL AND public.is_admin()
)
SELECT kind, ref_id, title, expiry_date, (expiry_date - current_date) as days_left
FROM due
WHERE expiry_date BETWEEN current_date AND (current_date + INTERVAL '30 days')
ORDER BY expiry_date ASC;

CREATE OR REPLACE VIEW public.v_upcoming_rides WITH (security_barrier = true) AS
SELECT
  r.id,
  (r.origin || ' → ' || r.destination) as label,
  r.start_at::date as start_date,
  to_char(r.start_at, 'HH24:MI') as start_time,
  (r.start_at::date - current_date) as days_left
FROM rides r
WHERE r.start_at::date BETWEEN current_date AND (current_date + INTERVAL '30 days')
  AND public.is_admin()
ORDER BY r.start_at ASC;

CREATE OR REPLACE VIEW public.v_vehicle_monthly_costs WITH (security_barrier = true) AS
SELECT
  v.id as vehicle_id,
  v.registration,
  to_char(date_trunc('month', coalesce(r.start_at, c.created_at)), 'YYYY-MM') as month,
  coalesce(sum(c.amount),0) as costs_total
FROM vehicles v
LEFT JOIN rides r ON r.vehicle_id = v.id
LEFT JOIN costs c ON c.vehicle_id = v.id OR c.ride_id = r.id
WHERE public.is_admin()
GROUP BY 1,2,3
ORDER BY 3 DESC, 2;