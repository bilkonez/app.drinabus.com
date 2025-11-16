-- Allow authenticated users to check their own admin status
DROP POLICY IF EXISTS "Admin access policy" ON public.admins;

-- Create new policy that allows authenticated users to read their own admin status
CREATE POLICY "Users can check own admin status"
ON public.admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for the main admin to manage all admin records
CREATE POLICY "Main admin full access"
ON public.admins
FOR ALL
TO authenticated
USING (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid)
WITH CHECK (auth.uid() = '32029762-6ded-4cd7-8ad8-d7c1b9883ca3'::uuid);