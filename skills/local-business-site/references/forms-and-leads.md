# Forms and leads

A form that goes nowhere is the most expensive bug on a small business site,
because nobody notices. The owner assumes business is slow.

Pick the simplest option that fits, and confirm a real submission arrives before
handover.

## Option 0: mail app fallback (no setup)

`site.js` does this out of the box. On submit it assembles the whole enquiry and
opens the visitor's mail app, pre-addressed and pre-written, so the owner gets
one tidy email rather than "hi, interested".

This is a real answer, not a stub. For a business taking a handful of enquiries a
week it is genuinely enough, it cannot break, and there is nothing to pay for or
maintain. Its weakness is that it depends on the visitor having a mail app
configured, and a few will not.

Change the address in the `inbox()` function. It is assembled at runtime so
ordinary scrapers, which read the HTML for `mailto:` links, do not find it. A
determined person still can, which is unavoidable without a backend.

## Option 1: a form service (enquiry lands in an inbox)

Web3Forms, Formspree, Basin. Free tiers, one endpoint, no database. Set
`FORM_ENDPOINT` and the visitor never leaves the page.

Best when the owner works out of their inbox and nobody will ever want to query
the enquiries.

## Option 2: a database (enquiries are kept and searchable)

Worth it when there is volume, when more than one person handles enquiries, or
when the owner wants to know how many came in last month.

The bundled `supabase/` files do this: `schema.sql` creates a `leads` table with
row level security, `notify-lead.ts` emails on each new row, `webhook.sql`
connects them.

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `site.js`, and adjust the table
columns in `schema.sql` to match your form's field names, since the form posts
whatever it collects.

**The anon key is designed to be public** and is safe in the page. What protects
the table is the policy: anonymous visitors may insert a valid enquiry and
nothing else. **Never put the `service_role` key in a site** — it bypasses row
level security entirely, and anyone who views source owns the table.

Validate in the policy as well as in JavaScript. The endpoint is public and
client-side validation is a suggestion.

### Notifications, and the trap

Rows appearing quietly in a table is not a notification. The edge function emails
the owner on each new lead, via Resend.

**The sending account is whichever account the API key belongs to.** Nothing else
decides it. Create the key in the account the mail should come from and confirm
by checking that account's logs after the first send.

**Turn Verify JWT off on the function.** Supabase checks for a valid JWT before
your code runs, a database webhook does not carry one, and every call returns
`401 UNAUTHORIZED_NO_AUTH_HEADER`. Sending the anon key in an `Authorization`
header instead is rejected as `UNAUTHORIZED_INVALID_JWT_FORMAT`. Disabling the
check is what Supabase recommends for webhook callers; the function declares
`withSupabase({ auth: "none" })` to match, and the `WEBHOOK_SECRET` is what
actually keeps it private, since the URL is public.

**When debugging, the SQL editor shows only the last statement's result**, which
will make you conclude things that are not true. Use one query that returns
everything:

```sql
insert into leads (...) values (...);
select pg_sleep(6);
select id, created, status_code, error_msg, timed_out, content
from net._http_response order by created desc limit 3;
```

There is no `url` column on `net._http_response`.

## Spam

The honeypot in `site.js` catches most of it for free: a field a person never
sees and a bot fills in. On a hit, tell the bot it worked so it does not come
back and try something cleverer.

Add a real challenge only if spam actually becomes a problem. A CAPTCHA on a
small business form costs more real enquiries than it blocks fake ones.

## Ask for less

Every extra field costs enquiries. Name, one way to reach them, and a free text
box is usually the whole form. Add a field only when the owner would act
differently knowing the answer.

## Analytics

Optional and off unless a key is set. Track that an enquiry happened and its
shape — how many fields, whether a message was written — and **never the name,
email, phone or message text**. Those belong wherever leads are stored. Analytics
is for counting, not a second copy of customer records.

The number worth watching is what share of people who reach the contact page
actually submit. That says whether the page works; raw visits do not.
