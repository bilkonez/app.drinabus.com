-- Create a security definer function to check admin status server-side
-- This prevents the hardcoded admin check and uses the admins table
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = check_user_id
  );
$$;

-- Update employees table RLS policy to use server-side admin check
DROP POLICY IF EXISTS "full_access_policy" ON public.employees;
CREATE POLICY "admin_full_access_employees" 
ON public.employees 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update rides table RLS policy to use server-side admin check
DROP POLICY IF EXISTS "full_access_policy" ON public.rides;
CREATE POLICY "admin_full_access_rides" 
ON public.rides 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update costs table RLS policy to use server-side admin check
DROP POLICY IF EXISTS "full_access_policy" ON public.costs;
CREATE POLICY "admin_full_access_costs" 
ON public.costs 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update ride_segments table RLS policy
DROP POLICY IF EXISTS "full_access_policy" ON public.ride_segments;
CREATE POLICY "admin_full_access_ride_segments" 
ON public.ride_segments 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update documents table RLS policy
DROP POLICY IF EXISTS "full_access_policy" ON public.documents;
CREATE POLICY "admin_full_access_documents" 
ON public.documents 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update driver_work_log table RLS policy
DROP POLICY IF EXISTS "admin_full_access" ON public.driver_work_log;
CREATE POLICY "admin_full_access_work_log" 
ON public.driver_work_log 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update employee_roles table RLS policy
DROP POLICY IF EXISTS "admin_full_access" ON public.employee_roles;
CREATE POLICY "admin_full_access_emp_roles" 
ON public.employee_roles 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update insights table RLS policy
DROP POLICY IF EXISTS "full_access_policy" ON public.insights;
CREATE POLICY "admin_full_access_insights" 
ON public.insights 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update vehicle_deadlines table RLS policy
DROP POLICY IF EXISTS "full_access_policy" ON public.vehicle_deadlines;
CREATE POLICY "admin_full_access_vehicle_deadlines" 
ON public.vehicle_deadlines 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update vehicle_service table RLS policy
DROP POLICY IF EXISTS "full_access_policy" ON public.vehicle_service;
CREATE POLICY "admin_full_access_vehicle_service" 
ON public.vehicle_service 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Update vehicles table admin policy
DROP POLICY IF EXISTS "full_access_policy" ON public.vehicles;
CREATE POLICY "admin_full_access_vehicles" 
ON public.vehicles 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Keep the public read policy for operational vehicles (for landing page)
-- This policy already exists as "Public can view operational vehicles"

-- Update roles table RLS policy
DROP POLICY IF EXISTS "admin_full_access" ON public.roles;
CREATE POLICY "admin_full_access_roles" 
ON public.roles 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));