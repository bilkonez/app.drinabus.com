-- Evidencija radnog vremena (po vozaču i datumu)
create table if not exists driver_work_log (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  work_date date not null,
  hours numeric(4,2) not null check (hours >= 0 and hours <= 24),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, work_date)
);

-- trigger za updated_at
drop trigger if exists trg_driver_work_log_updated on driver_work_log;
create trigger trg_driver_work_log_updated
before update on driver_work_log
for each row execute procedure set_updated_at();

-- View: zbir sati po vozaču za dati mjesec
create or replace view v_driver_monthly_hours as
select
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as driver_name,
  date_trunc('month', dwl.work_date)::date as month_start,
  sum(dwl.hours) as total_hours,
  count(*) as days_filled
from driver_work_log dwl
join v_employees_with_roles e on e.id = dwl.employee_id
where e.is_vozac = true
group by e.id, e.first_name, e.last_name, date_trunc('month', dwl.work_date);

-- RLS (admin-only)
alter table driver_work_log enable row level security;
drop policy if exists admin_full_access on driver_work_log;
create policy admin_full_access on driver_work_log
for all using (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
with check     (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);