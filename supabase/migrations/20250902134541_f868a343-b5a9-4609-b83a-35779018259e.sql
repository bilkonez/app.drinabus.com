-- Fix security definer view issues by using proper RLS approach

-- Drop and recreate views without security definer issues
DROP VIEW IF EXISTS public.v_daily_stats;
DROP VIEW IF EXISTS public.v_monthly_stats; 
DROP VIEW IF EXISTS public.v_reminders_due;
DROP VIEW IF EXISTS public.v_vehicle_monthly_costs;

-- Create views that use RLS policies on underlying tables instead
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

-- Update the is_admin function to set proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Update gen_daily_insights function to set proper search_path
CREATE OR REPLACE FUNCTION public.gen_daily_insights()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $function$
declare
  top_driver record;
  top_route record;
  high_service_month record;
begin
  -- Očisti današnje zapise
  delete from public.insights where date_trunc('day', generated_at) = date_trunc('day', now());

  -- Vozač sa najviše vožnji u zadnjih 30 dana
  select e.first_name||' '||e.last_name as driver_name, count(*) as cnt
  into top_driver
  from public.rides r
  join public.employees e on e.id = r.driver_id
  where r.start_at >= now() - interval '30 days'
  group by 1
  order by 2 desc
  limit 1;

  if top_driver is not null then
    insert into public.insights(kind, message)
    values ('top_driver_30d', 'Vozač sa najviše vožnji (30d): ' || top_driver.driver_name || ' ('|| top_driver.cnt || ').');
  end if;

  -- Ruta sa najvećim prihodom (30d)
  select r.origin||' → '||r.destination as route, sum(r.total_price) as total
  into top_route
  from public.rides r
  where r.start_at >= now() - interval '30 days'
  group by 1
  order by 2 desc
  limit 1;

  if top_route is not null then
    insert into public.insights(kind, message)
    values ('top_route_revenue_30d', 'Najveći prihod (30d): ' || top_route.route || ' ('|| coalesce(top_route.total,0) || ' KM).');
  end if;

  -- Mjesec s najvišim servis troškovima kao % prihoda (zadnjih 6 mj)
  with m as (
    select
      to_char(date_trunc('month', r.start_at), 'YYYY-MM') as month,
      coalesce(sum(r.total_price),0) as revenue,
      coalesce( (select sum(c.amount) from public.costs c where c.ride_id = any(array_agg(r.id)) and c.cost_type='servis'), 0) as service_costs
    from public.rides r
    where r.start_at >= now() - interval '6 months'
    group by 1
  ), pct as (
    select month, revenue, service_costs,
           case when revenue > 0 then (service_costs/revenue)::numeric else null end as ratio
    from m
  )
  select * into high_service_month
  from pct
  where ratio is not null
  order by ratio desc
  limit 1;

  if high_service_month is not null then
    insert into public.insights(kind, message)
    values ('service_cost_ratio_peak',
            'Mjesec sa najvišim udjelom troškova servisa: '||high_service_month.month||
            ' ('||coalesce(round(high_service_month.ratio*100,2),0)||'%).');
  end if;
end;
$function$;