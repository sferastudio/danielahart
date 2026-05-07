-- Multi-office support: allow one user to manage multiple offices
-- Creates a junction table and updates RLS policies to use it

-- 1. Create junction table
CREATE TABLE IF NOT EXISTS user_offices (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, office_id)
);

ALTER TABLE user_offices ENABLE ROW LEVEL SECURITY;

-- RLS: users can see their own office links, admins see all
CREATE POLICY "users_see_own_offices" ON user_offices
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.user_role() = 'admin');

CREATE POLICY "admin_manage_user_offices" ON user_offices
  FOR ALL TO authenticated
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- 2. Populate from existing profiles (every user gets their current office)
INSERT INTO user_offices (user_id, office_id)
SELECT id, office_id FROM profiles WHERE office_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Create Santa Fe Springs office
INSERT INTO offices (name, office_number, email, is_active, status)
VALUES ('Santa Fe Springs', '025', 'isboset.sanchez@danielahart.com', true, 'active')
ON CONFLICT (office_number) DO NOTHING;

-- 4. Add multi-office assignments for owners with multiple locations
-- Kathy Jimenez (Alpharetta owner) → also gets Roswell
INSERT INTO user_offices (user_id, office_id)
SELECT p.id, o.id
FROM profiles p
JOIN auth.users au ON au.id = p.id
JOIN offices o ON o.office_number = '018' -- Roswell
WHERE au.email = 'kathy.jimenez@danielahart.com'
ON CONFLICT DO NOTHING;

-- Kelidy Flores (Cartersville owner) → also gets Rome
INSERT INTO user_offices (user_id, office_id)
SELECT p.id, o.id
FROM profiles p
JOIN auth.users au ON au.id = p.id
JOIN offices o ON o.office_number = '017' -- Rome
WHERE au.email = 'kelidy.flores@danielahart.com'
ON CONFLICT DO NOTHING;

-- Isboset Sanchez (DATS Doraville owner) → also gets Santa Fe Springs
INSERT INTO user_offices (user_id, office_id)
SELECT p.id, o.id
FROM profiles p
JOIN auth.users au ON au.id = p.id
JOIN offices o ON o.office_number = '025' -- Santa Fe Springs
WHERE au.email = 'isboset.sanchez@danielahart.com'
ON CONFLICT DO NOTHING;

-- 5. Update RLS policies to support multi-office access
-- Drop existing single-office policies
DROP POLICY IF EXISTS "sub_office_select_own_office" ON offices;
DROP POLICY IF EXISTS "sub_office_select_own_reports" ON monthly_reports;
DROP POLICY IF EXISTS "sub_office_insert_own_reports" ON monthly_reports;
DROP POLICY IF EXISTS "sub_office_update_own_draft_reports" ON monthly_reports;

-- Recreate with junction table support
CREATE POLICY "sub_office_select_own_offices" ON offices
  FOR SELECT TO authenticated
  USING (
    public.user_role() = 'sub_office'
    AND id IN (SELECT office_id FROM user_offices WHERE user_id = auth.uid())
  );

CREATE POLICY "sub_office_select_own_reports" ON monthly_reports
  FOR SELECT TO authenticated
  USING (
    public.user_role() = 'sub_office'
    AND office_id IN (SELECT office_id FROM user_offices WHERE user_id = auth.uid())
  );

CREATE POLICY "sub_office_insert_own_reports" ON monthly_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_role() = 'sub_office'
    AND office_id IN (SELECT office_id FROM user_offices WHERE user_id = auth.uid())
  );

CREATE POLICY "sub_office_update_own_draft_reports" ON monthly_reports
  FOR UPDATE TO authenticated
  USING (
    public.user_role() = 'sub_office'
    AND office_id IN (SELECT office_id FROM user_offices WHERE user_id = auth.uid())
    AND status = 'draft'
  )
  WITH CHECK (
    public.user_role() = 'sub_office'
    AND office_id IN (SELECT office_id FROM user_offices WHERE user_id = auth.uid())
  );

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_offices_user_id ON user_offices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_offices_office_id ON user_offices(office_id);
