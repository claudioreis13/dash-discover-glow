DROP POLICY IF EXISTS "Users can delete own audit log" ON public.audit_log;

CREATE POLICY "Admins can delete audit log"
ON public.audit_log
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));