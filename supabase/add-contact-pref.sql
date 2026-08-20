-- Run this once, in the Supabase SQL editor.
--
-- schema.sql creates the leads table with "create table if not exists", which
-- does nothing on a table that already exists. So an existing project needs
-- this to add the new column and widen the insert policy to accept it.
--
-- Safe to run on a live table: adding a nullable column rewrites nothing, and
-- existing rows simply have no answer, which the auto-reply already treats as
-- "email or call".

alter table public.leads
  add column if not exists contact_pref text;

-- The policy has to be replaced rather than edited, so this is the whole thing
-- again with one line added.
drop policy if exists "anon can submit an enquiry" on public.leads;

create policy "anon can submit an enquiry"
  on public.leads
  for insert
  to anon
  with check (
    length(business) between 1 and 200
    and length(name) between 1 and 200
    and length(email) between 3 and 320
    and position('@' in email) > 1
    and coalesce(length(message), 0) <= 4000
    and coalesce(array_length(services, 1), 0) <= 40
    and coalesce(array_length(package, 1), 0) <= 10
    and (contact_pref is null or contact_pref in ('email', 'phone'))
    and handled = false
    and notes is null
  );

-- Check it worked. Should return one row: contact_pref | text | YES
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'leads' and column_name = 'contact_pref';
