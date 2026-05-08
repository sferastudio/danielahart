-- QuickBooks pivot — drop automated Stripe invoicing in favor of manual QB invoicing.
-- Adds tracking columns for the new admin-driven lifecycle and a daily cron to
-- auto-flag overdue invoices (replacing the Stripe payment_failed webhook).

-- 1. Schema additions on monthly_reports
ALTER TABLE monthly_reports
  ADD COLUMN IF NOT EXISTS qb_invoice_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ NULL;

-- 2. Defensive backfill: any report already in 'invoiced' state without an
--    invoiced_at timestamp gets one based on the best available signal.
UPDATE monthly_reports
SET invoiced_at = COALESCE(updated_at, submitted_at, created_at)
WHERE status = 'invoiced'
  AND invoiced_at IS NULL;

-- 3. Daily cron: flip 'invoiced' reports to 'overdue' once they're 15 days old.
--    Matches the prior Stripe 15-day due window. Runs every day at 6am UTC.
SELECT cron.schedule(
  'mark-overdue-invoices',
  '0 6 * * *',
  $$ UPDATE monthly_reports
     SET status = 'overdue'
     WHERE status = 'invoiced'
       AND invoiced_at < NOW() - INTERVAL '15 days' $$
);
