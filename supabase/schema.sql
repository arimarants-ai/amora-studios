-- AMORA Studios — quote form storage.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It creates the leads table and locks it down so the public anon key can add
-- an enquiry and do nothing else.

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  business    text,
  name        text not null,
  email       text not null,
  phone       text,
  package     text[] not null default '{}',
  services    text[] not null default '{}',
  message     text,
  -- How they asked to be contacted: 'email' or 'phone'. Nullable because rows
  -- written before this column existed have no answer, and the auto-reply
  -- treats anything it does not recognise as "email or call".
  contact_pref text,
  -- 'quote' from the quote form, 'message' from the contact page.
  kind        text not null default 'quote',
  page        text,
  handled     boolean not null default false,
  notes       text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- Row level security is what makes the anon key safe to ship in the page.
-- With RLS on and only an insert policy below, anonymous visitors can add a
-- row and cannot read, change, or delete anything, including their own.
alter table public.leads enable row level security;

grant insert on public.leads to anon;

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
    and (kind <> 'quote' or length(business) between 1 and 200)
    -- Your own triage columns. A submission cannot arrive pre-marked.
    and handled = false
    and notes is null
  );

-- Read the enquiries from the Supabase dashboard (Table Editor), which uses
-- your own logged in account and is not restricted by the policy above.
--
--   select created_at, business, name, email, phone, package, services, message
--   from public.leads
--   order by created_at desc;
