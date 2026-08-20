-- Run this once, in the Supabase SQL editor.
--
-- The contact page's short message form writes into the same leads table as
-- the quote form, so one notification path serves both. Two things have to
-- change for that to work.
--
-- 1. business becomes nullable. Someone asking "do you work with restaurants?"
--    has not told us a business name yet, and refusing the message over it
--    would lose the enquiry.
-- 2. a kind column separates the two. The quote auto-reply promises a price
--    within one business day, which would be a strange thing to send someone
--    who only asked a question, so the function checks this before sending.

alter table public.leads
  alter column business drop not null;

alter table public.leads
  add column if not exists kind text not null default 'quote';

-- Existing rows are all quote requests, which the default already handles.

drop policy if exists "anon can submit an enquiry" on public.leads;

create policy "anon can submit an enquiry"
  on public.leads
  for insert
  to anon
  with check (
    coalesce(length(business), 0) <= 200
    and length(name) between 1 and 200
    and length(email) between 3 and 320
    and position('@' in email) > 1
    and coalesce(length(message), 0) <= 4000
    and coalesce(array_length(services, 1), 0) <= 40
    and coalesce(array_length(package, 1), 0) <= 10
    and (contact_pref is null or contact_pref in ('email', 'phone'))
    and kind in ('quote', 'message')
    -- A quote request still has to say who it is from.
    and (kind <> 'quote' or length(business) between 1 and 200)
    and handled = false
    and notes is null
  );

-- Check it worked. Expect: business YES (nullable), kind NO (not null).
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'leads'
  and column_name in ('business', 'kind')
order by column_name;
