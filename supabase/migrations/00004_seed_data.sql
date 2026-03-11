-- Active fee rates
INSERT INTO fee_configurations (fee_type, percentage, effective_from)
VALUES
  ('royalty',     0.0700, '2026-01-01'),
  ('advertising', 0.0200, '2026-01-01');

-- Test office
INSERT INTO offices (name, office_number, email)
VALUES ('Kudat Office #204', '204', 'kudat204@danielahart.com');
