-- offices
CREATE TABLE offices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  office_number text NOT NULL UNIQUE,
  address       text,
  phone         text,
  email         text NOT NULL,
  stripe_customer_id text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id   uuid REFERENCES offices(id),
  role        text NOT NULL CHECK (role IN ('admin', 'sub_office')),
  full_name   text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- fee_configurations
CREATE TABLE fee_configurations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type       text NOT NULL CHECK (fee_type IN ('royalty', 'advertising')),
  percentage     numeric(5,4) NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to   date,
  set_by         uuid REFERENCES profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_active_fee
  ON fee_configurations (fee_type)
  WHERE effective_to IS NULL;

-- monthly_reports
CREATE TABLE monthly_reports (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id               uuid NOT NULL REFERENCES offices(id),
  report_month            date NOT NULL,

  tax_preparation_fees    numeric(12,2) NOT NULL DEFAULT 0,
  bookkeeping_fees        numeric(12,2) NOT NULL DEFAULT 0,
  insurance_commissions   numeric(12,2) NOT NULL DEFAULT 0,
  other_service_fees      numeric(12,2) NOT NULL DEFAULT 0,

  total_gross             numeric(12,2) NOT NULL DEFAULT 0,

  royalty_percentage      numeric(5,4),
  advertising_percentage  numeric(5,4),

  royalty_fee             numeric(12,2) NOT NULL DEFAULT 0,
  advertising_fee         numeric(12,2) NOT NULL DEFAULT 0,
  total_fees_due          numeric(12,2) NOT NULL DEFAULT 0,

  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','submitted','invoiced','paid','overdue')),

  submitted_at            timestamptz,
  submitted_by            uuid REFERENCES profiles(id),
  edited_by               uuid REFERENCES profiles(id),
  edited_at               timestamptz,
  stripe_invoice_id       text,
  stripe_invoice_url      text,
  paid_at                 timestamptz,
  notes                   text,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  UNIQUE (office_id, report_month)
);

-- audit_log
CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  changes     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- email_log
CREATE TABLE email_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  template        text NOT NULL,
  subject         text NOT NULL,
  status          text NOT NULL CHECK (status IN ('sent', 'failed')),
  error           text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger: compute_report_fees
CREATE OR REPLACE FUNCTION compute_report_fees()
RETURNS TRIGGER AS $$
DECLARE
  v_royalty   numeric(5,4);
  v_advertising numeric(5,4);
BEGIN
  NEW.total_gross := NEW.tax_preparation_fees
                   + NEW.bookkeeping_fees
                   + NEW.insurance_commissions
                   + NEW.other_service_fees;

  SELECT percentage INTO v_royalty
    FROM fee_configurations
    WHERE fee_type = 'royalty' AND effective_to IS NULL;

  SELECT percentage INTO v_advertising
    FROM fee_configurations
    WHERE fee_type = 'advertising' AND effective_to IS NULL;

  NEW.royalty_percentage    := COALESCE(v_royalty, 0);
  NEW.advertising_percentage := COALESCE(v_advertising, 0);

  NEW.royalty_fee     := NEW.total_gross * NEW.royalty_percentage;
  NEW.advertising_fee := NEW.total_gross * NEW.advertising_percentage;
  NEW.total_fees_due  := NEW.royalty_fee + NEW.advertising_fee;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_report_fees
  BEFORE INSERT OR UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION compute_report_fees();

-- Trigger: handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, office_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sub_office'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'office_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
