-- AMORA Studios — call the notify-lead function whenever an enquiry arrives.
--
-- This is what the dashboard builds for you under Integrations → Database
-- Webhooks. Running it here does the same thing, and is easier to find.
--
-- Before running it:
--   1. deploy the notify-lead edge function
--   2. set its RESEND_API_KEY, NOTIFY_TO, and WEBHOOK_SECRET secrets
--
-- Then replace the two placeholders below and run it in the SQL editor.
--   YOUR_PROJECT_REF   the subdomain of your project URL
--   YOUR_WEBHOOK_SECRET  the same string you set as the WEBHOOK_SECRET secret,
--                        character for character, or every call comes back 401

create trigger on_lead_created
  after insert on public.leads
  for each row
  execute function supabase_functions.http_request(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-lead',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"YOUR_WEBHOOK_SECRET"}',
    '{}',
    '5000'
  );

-- Check it registered:
--
--   select tgname from pg_trigger
--   where tgrelid = 'public.leads'::regclass and not tgisinternal;
--
-- To change the URL or the secret later, drop it and create it again:
--
--   drop trigger if exists on_lead_created on public.leads;
