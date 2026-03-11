-- 1. Add 2 missing revenue columns to monthly_reports
ALTER TABLE monthly_reports
  ADD COLUMN notary_copy_fax_fees numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN translation_document_fees numeric(12,2) NOT NULL DEFAULT 0;

-- 2. Add per-office fee percentages to offices
ALTER TABLE offices
  ADD COLUMN royalty_percentage numeric(5,4) NOT NULL DEFAULT 0.1000,
  ADD COLUMN advertising_percentage numeric(5,4) NOT NULL DEFAULT 0.0200;

-- 3. Add office status column (keep is_active for backward compat)
ALTER TABLE offices
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'non_reporting', 'terminated', 'corporate'));

-- 4. Update compute_report_fees() to include new revenue fields
--    and read fee percentages from the office instead of global config
CREATE OR REPLACE FUNCTION compute_report_fees()
RETURNS TRIGGER AS $$
DECLARE
  v_royalty   numeric(5,4);
  v_advertising numeric(5,4);
BEGIN
  -- Sum all 6 revenue fields for total_gross
  NEW.total_gross := NEW.tax_preparation_fees
                   + NEW.bookkeeping_fees
                   + NEW.insurance_commissions
                   + NEW.notary_copy_fax_fees
                   + NEW.translation_document_fees
                   + NEW.other_service_fees;

  -- Read fee percentages from the office's own rates
  SELECT o.royalty_percentage, o.advertising_percentage
    INTO v_royalty, v_advertising
    FROM offices o
    WHERE o.id = NEW.office_id;

  -- Fallback to global fee_configurations if office not found
  IF v_royalty IS NULL THEN
    SELECT percentage INTO v_royalty
      FROM fee_configurations
      WHERE fee_type = 'royalty' AND effective_to IS NULL;
  END IF;

  IF v_advertising IS NULL THEN
    SELECT percentage INTO v_advertising
      FROM fee_configurations
      WHERE fee_type = 'advertising' AND effective_to IS NULL;
  END IF;

  NEW.royalty_percentage    := COALESCE(v_royalty, 0);
  NEW.advertising_percentage := COALESCE(v_advertising, 0);

  NEW.royalty_fee     := NEW.total_gross * NEW.royalty_percentage;
  NEW.advertising_fee := NEW.total_gross * NEW.advertising_percentage;
  NEW.total_fees_due  := NEW.royalty_fee + NEW.advertising_fee;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update RLS policy for offices to allow admin INSERT/UPDATE/DELETE
CREATE POLICY "admin_insert_offices" ON offices
  FOR INSERT TO authenticated
  WITH CHECK (public.user_role() = 'admin');

CREATE POLICY "admin_update_offices" ON offices
  FOR UPDATE TO authenticated
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

CREATE POLICY "admin_delete_offices" ON offices
  FOR DELETE TO authenticated
  USING (public.user_role() = 'admin');

-- 6. Drop the old draft-only update policy and replace with one that also allows submission
DROP POLICY IF EXISTS "sub_office_update_own_draft_reports" ON monthly_reports;

CREATE POLICY "sub_office_update_own_reports" ON monthly_reports
  FOR UPDATE TO authenticated
  USING (
    public.user_role() = 'sub_office'
    AND office_id = public.user_office_id()
    AND status IN ('draft', 'submitted')
  )
  WITH CHECK (
    public.user_role() = 'sub_office'
    AND office_id = public.user_office_id()
  );

-- 7. Allow admin to insert audit_log entries
CREATE POLICY "admin_insert_audit_log" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.user_role() = 'admin');

-- 8. Update seed office with per-office rates
UPDATE offices SET royalty_percentage = 0.1000, advertising_percentage = 0.0200
WHERE office_number = '204';
