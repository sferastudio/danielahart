-- Helper functions (in public schema)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'user_role',
    'sub_office'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.user_office_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'office_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- offices policies
CREATE POLICY "sub_office_select_own_office" ON offices
  FOR SELECT TO authenticated
  USING (public.user_role() = 'sub_office' AND id = public.user_office_id());

CREATE POLICY "admin_select_all_offices" ON offices
  FOR SELECT TO authenticated
  USING (public.user_role() = 'admin');

-- profiles policies
CREATE POLICY "sub_office_select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (public.user_role() = 'sub_office' AND id = auth.uid());

CREATE POLICY "sub_office_update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (public.user_role() = 'sub_office' AND id = auth.uid())
  WITH CHECK (public.user_role() = 'sub_office' AND id = auth.uid());

CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL TO authenticated
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- fee_configurations policies
CREATE POLICY "sub_office_select_active_fees" ON fee_configurations
  FOR SELECT TO authenticated
  USING (public.user_role() = 'sub_office' AND effective_to IS NULL);

CREATE POLICY "admin_all_fee_configurations" ON fee_configurations
  FOR ALL TO authenticated
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- monthly_reports policies
CREATE POLICY "sub_office_select_own_reports" ON monthly_reports
  FOR SELECT TO authenticated
  USING (public.user_role() = 'sub_office' AND office_id = public.user_office_id());

CREATE POLICY "sub_office_insert_own_reports" ON monthly_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.user_role() = 'sub_office' AND office_id = public.user_office_id());

CREATE POLICY "sub_office_update_own_draft_reports" ON monthly_reports
  FOR UPDATE TO authenticated
  USING (public.user_role() = 'sub_office' AND office_id = public.user_office_id() AND status = 'draft')
  WITH CHECK (public.user_role() = 'sub_office' AND office_id = public.user_office_id());

CREATE POLICY "admin_all_reports" ON monthly_reports
  FOR ALL TO authenticated
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- audit_log policies
CREATE POLICY "admin_select_audit_log" ON audit_log
  FOR SELECT TO authenticated
  USING (public.user_role() = 'admin');

-- email_log: no client access (written by Edge Functions via service role)
