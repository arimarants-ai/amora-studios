-- the business — call the notify-lead function whenever an enquiry arrives.
--
-- The dashboard can build this for you under Integrations → Database Webhooks,
-- but that route only works once webhooks have been enabled on the project,
-- which is what creates the supabase_functions schema. This version uses pg_net
-- directly and sets up everything it needs, so it runs on a fresh project.
--
-- Before running it:
--   1. deploy the notify-lead edge function
--   2. set its RESEND_API_KEY, NOTIFY_TO, and WEBHOOK_SECRET secrets
--   3. turn OFF "Verify JWT" on the function, in its settings in the dashboard
--
-- Step 3 is the one that is easy to miss. Supabase checks for a valid JWT
-- before a function's own code runs, and a database webhook does not carry
-- one, so every call comes back 401 UNAUTHORIZED_NO_AUTH_HEADER and nothing
-- reaches the function. Supabase's own guidance is to disable that check for
-- pg_net and webhook callers. Do not try to satisfy it by sending the anon key
-- in an Authorization header instead, it is rejected as UNAUTHORIZED_INVALID_
-- JWT_FORMAT. Turning the check off and relying on the shared secret below is
-- the supported route.
--
-- Then replace the two placeholders below and run it in the SQL editor.
--   YOUR_PROJECT_REF     the subdomain of your project URL
--   YOUR_WEBHOOK_SECRET  the same string you set as the WEBHOOK_SECRET secret,
--                        character for character, or every call comes back 401

create extension if not exists pg_net;

create or replace function public.notify_lead_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- pg_net sends this in the background, so a slow or failing function never
  -- holds up someone submitting the form. The flip side is that a failed send
  -- shows up in the function logs rather than as an error here.
  perform net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'YOUR_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object('record', to_jsonb(new)),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

create trigger on_lead_created
  after insert on public.leads
  for each row
  execute function public.notify_lead_created();

-- Check it registered:
--
--   select tgname from pg_trigger
--   where tgrelid = 'public.leads'::regclass and not tgisinternal;
--
-- See what came back. Note there is no url column here, the url is only on
-- net.http_request_queue while a request is still waiting to be sent, and
-- responses are kept for about six hours:
--
--   select id, created, status_code, error_msg, timed_out, content
--   from net._http_response order by created desc limit 5;
--
-- Or just the failures, where content carries the reason:
--
--   select * from net._http_response
--   where status_code >= 400 or error_msg is not null
--   order by created desc;
--
-- To change the URL or the secret later, replace the function and it takes
-- effect straight away, the trigger does not need recreating:
--
--   drop trigger if exists on_lead_created on public.leads;
--   drop function if exists public.notify_lead_created();
