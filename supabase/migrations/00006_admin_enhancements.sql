-- Admin Enhancements Migration
-- Adds: processed flag, office address fields, contact names, fee rate history

-- 1. Processed flag on reports
ALTER TABLE monthly_reports ADD COLUMN IF NOT EXISTS is_processed boolean NOT NULL DEFAULT false;

-- 2. Additional office address fields
ALTER TABLE offices ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS state text DEFAULT 'GA';
ALTER TABLE offices ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS fax text;

-- 3. Contact name fields on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_last_name text;

-- 4. Fee rate history table (date-ranged per-office rates)
CREATE TABLE IF NOT EXISTS fee_rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  fee_type text NOT NULL CHECK (fee_type IN ('royalty', 'advertising')),
  percentage numeric(5,4) NOT NULL,
  start_month date NOT NULL,
  end_month date, -- NULL = ongoing
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for fee_rate_history
ALTER TABLE fee_rate_history ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access to fee_rate_history"
  ON fee_rate_history
  FOR ALL
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'user_role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT raw_app_meta_data->>'user_role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Sub-office users can read their own office's fee history
CREATE POLICY "Sub-office read own fee_rate_history"
  ON fee_rate_history
  FOR SELECT
  TO authenticated
  USING (
    office_id IN (
      SELECT office_id FROM profiles WHERE id = auth.uid()
    )
  );
