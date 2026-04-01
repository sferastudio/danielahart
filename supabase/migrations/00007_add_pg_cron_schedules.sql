-- Enable pg_cron and pg_net extensions (available on Supabase hosted)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1st of each month at 9:00 AM ET (13:00 UTC) — first reminder
SELECT cron.schedule(
  'send-reminder-emails',
  '0 13 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://uksqnrnohvgtyhwtthsh.supabase.co/functions/v1/send-reminder-emails',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc3Fucm5vaHZndHlod3R0aHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgzNDYyNiwiZXhwIjoyMDg4NDEwNjI2fQ.SV0pKg4J7Q-W7oNrb20jCt4SM7yAPhFT_QD2nAoo8Nk", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 5th of each month at 9:00 AM ET (13:00 UTC) — final urgent reminder
SELECT cron.schedule(
  'send-final-reminders',
  '0 13 5 * *',
  $$
  SELECT net.http_post(
    url := 'https://uksqnrnohvgtyhwtthsh.supabase.co/functions/v1/send-final-reminders',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc3Fucm5vaHZndHlod3R0aHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgzNDYyNiwiZXhwIjoyMDg4NDEwNjI2fQ.SV0pKg4J7Q-W7oNrb20jCt4SM7yAPhFT_QD2nAoo8Nk", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
