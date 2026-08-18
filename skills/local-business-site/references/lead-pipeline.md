# The lead pipeline

The form works with no setup at all: on submit it assembles the enquiry and
opens the visitor's mail app, pre-addressed and pre-written. That is a real
fallback, not a stub, and for a business doing a handful of enquiries a week it
is genuinely enough.

Two upgrades, tried in this order by `main.js`:

1. **Supabase** — enquiries land in a database, searchable and reportable
2. **A form service** — Web3Forms, Formspree, Basin. One endpoint, no database

## Supabase

1. Create a project, then run `assets/supabase/schema.sql` in the SQL editor.
   It creates the `leads` table and, importantly, the row level security policy.
2. **Project Settings → API**, copy the Project URL and the **anon public** key.
3. Fill in the two constants at the top of the form section in `main.js`.

The anon key is designed to be public and is safe sitting in the page. What
protects the table is the policy: anonymous visitors may insert a valid enquiry
and nothing else — no reading, editing, or deleting.

**Never put the `service_role` key in the site.** It bypasses row level
security entirely. Anyone who views source then owns the table.

The policy also validates: length limits, an `@` in the email, `handled` false,
`notes` null. Validating in the policy rather than only in JavaScript matters,
because the endpoint is public and JavaScript is a suggestion.

## Getting told about a new lead

Rows appearing quietly in a table is not a notification. `notify-lead.ts` emails
the owner whenever one arrives, through Resend.

**The sending account is whichever account the API key belongs to.** Nothing
else decides it. If someone has access to more than one Resend account, create
the key in the one the mail should come from and confirm which by checking the
logs after the first send.

1. In Resend, add and verify the domain. Skip it and the function falls back to
   `onboarding@resend.dev`, which can only email your own address — fine for a
   test, not for anything a client sees.
2. Create an API key with **sending access only**.
3. In Supabase, **Edge Functions → Deploy a new function → Via Editor**, name it
   `notify-lead`, paste in `notify-lead.ts`.
4. Add the secrets: `RESEND_API_KEY`, `NOTIFY_TO`, `NOTIFY_FROM`,
   `WEBHOOK_SECRET` (any long random string you invent).
5. Run `webhook.sql` with its placeholders filled in.

### The trap that costs an afternoon

**Turn Verify JWT off on the function.** Supabase checks for a valid JWT before
your code runs, a database webhook does not carry one, and every call comes back
`401 UNAUTHORIZED_NO_AUTH_HEADER`.

Sending the anon key in an `Authorization` header instead does not fix it — it
is rejected as `UNAUTHORIZED_INVALID_JWT_FORMAT`. Disabling the check is what
Supabase recommends for `pg_net` and webhook callers. The function declares
`withSupabase({ auth: "none" })` to match, and `WEBHOOK_SECRET` is what actually
keeps it private, which matters because the function URL is public.

### Debugging it

The SQL editor shows only the **last** statement's result, which will make you
conclude things that are not true. Use one query that returns everything:

```sql
insert into leads (...) values (...);
select pg_sleep(6);
select id, created, status_code, error_msg, timed_out, content
from net._http_response order by created desc limit 3;
```

There is no `url` column on `net._http_response`. Check the function's own logs
under **Edge Functions → notify-lead → Logs** for why a send was refused.

## Analytics

PostHog, gated on a key being present so the default is no script and no
requests at all.

Track `quote_submitted` and `quote_failed`, both carrying the *shape* of the
enquiry — which package, how many services, whether a message was written — and
**never the name, email, phone, or message text**. Those belong in the leads
table. Analytics is for counting; it is not a second copy of your customer
records, and treating it as one creates a privacy problem nobody asked for.

The question worth asking is what share of people who reach the services page
submit. That number, not raw visits, says whether the page works.

**Gate reporting by host.** Every copy of the site carries the same key —
deploy previews, staging, a laptop. Without a check they all land in one project
and the numbers stop meaning anything. `reporting()` in `main.js` skips
localhost, `file://`, and any host containing `-git-`, which is the shape
platforms give branch previews.
