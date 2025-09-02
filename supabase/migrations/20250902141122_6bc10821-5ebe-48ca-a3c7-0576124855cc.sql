-- Update v_daily_stats to only include completed rides
CREATE OR REPLACE VIEW v_daily_stats AS
SELECT 
  r.start_at::date as day,
  COUNT(r.id) as rides_count,
  COALESCE(SUM(r.total_price), 0) as revenue_total,
  COALESCE(SUM(c.amount), 0) as costs_total,
  COALESCE(SUM(r.total_price), 0) - COALESCE(SUM(c.amount), 0) as profit_total
FROM rides r
LEFT JOIN costs c ON c.ride_id = r.id
WHERE r.status = 'zavrseno'
  AND r.start_at IS NOT NULL
GROUP BY r.start_at::date;

-- Update v_monthly_stats to only include completed rides
CREATE OR REPLACE VIEW v_monthly_stats AS
SELECT 
  TO_CHAR(r.start_at, 'YYYY-MM') as month,
  COUNT(r.id) as rides_count,
  COALESCE(SUM(r.total_price), 0) as revenue_total,
  COALESCE(SUM(c.amount), 0) as costs_total,
  COALESCE(SUM(r.total_price), 0) - COALESCE(SUM(c.amount), 0) as profit_total
FROM rides r
LEFT JOIN costs c ON c.ride_id = r.id
WHERE r.status = 'zavrseno'
  AND r.start_at IS NOT NULL
GROUP BY TO_CHAR(r.start_at, 'YYYY-MM');

-- Update v_vehicle_monthly_costs to only include costs from completed rides
CREATE OR REPLACE VIEW v_vehicle_monthly_costs AS
SELECT 
  v.id as vehicle_id,
  v.registration,
  TO_CHAR(r.start_at, 'YYYY-MM') as month,
  COALESCE(SUM(c.amount), 0) as costs_total
FROM vehicles v
LEFT JOIN rides r ON r.vehicle_id = v.id AND r.status = 'zavrseno'
LEFT JOIN costs c ON c.ride_id = r.id
WHERE r.start_at IS NOT NULL
GROUP BY v.id, v.registration, TO_CHAR(r.start_at, 'YYYY-MM');

-- Update gen_daily_insights function to only consider completed rides
CREATE OR REPLACE FUNCTION public.gen_daily_insights()
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
declare
  top_driver record;
  top_route record;
  high_service_month record;
begin
  -- Očisti današnje zapise
  delete from public.insights where date_trunc('day', generated_at) = date_trunc('day', now());

  -- Vozač sa najviše završenih vožnji u zadnjih 30 dana
  select e.first_name||' '||e.last_name as driver_name, count(*) as cnt
  into top_driver
  from public.rides r
  join public.employees e on e.id = r.driver_id
  where r.start_at >= now() - interval '30 days'
    AND r.status = 'zavrseno'
  group by 1
  order by 2 desc
  limit 1;

  if top_driver is not null then
    insert into public.insights(kind, message)
    values ('top_driver_30d', 'Vozač sa najviše završenih vožnji (30d): ' || top_driver.driver_name || ' ('|| top_driver.cnt || ').');
  end if;

  -- Ruta sa najvećim prihodom od završenih vožnji (30d)
  select r.origin||' → '||r.destination as route, sum(r.total_price) as total
  into top_route
  from public.rides r
  where r.start_at >= now() - interval '30 days'
    AND r.status = 'zavrseno'
  group by 1
  order by 2 desc
  limit 1;

  if top_route is not null then
    insert into public.insights(kind, message)
    values ('top_route_revenue_30d', 'Najveći prihod od završenih vožnji (30d): ' || top_route.route || ' ('|| coalesce(top_route.total,0) || ' KM).');
  end if;

  -- Mjesec s najvišim servis troškovima kao % prihoda (zadnjih 6 mj) - samo završene vožnje
  with m as (
    select
      to_char(date_trunc('month', r.start_at), 'YYYY-MM') as month,
      coalesce(sum(r.total_price),0) as revenue,
      coalesce( (select sum(c.amount) from public.costs c where c.ride_id = any(array_agg(r.id)) and c.cost_type='servis'), 0) as service_costs
    from public.rides r
    where r.start_at >= now() - interval '6 months'
      AND r.status = 'zavrseno'
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
            'Mjesec sa najvišim udjelom troškova servisa od završenih vožnji: '||high_service_month.month||
            ' ('||coalesce(round(high_service_month.ratio*100,2),0)||'%).');
  end if;
end;
$function$;