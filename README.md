# AMORA Studios website

A standalone static site. No framework, no build step, no dependencies. It shares nothing with anything else in
this folder's parent repository and can be moved into its own repo or host at any time.

```
amora-studios/
  index.html        the landing page, which is one continuous scroll animation
  services.html     every service, how pricing works, FAQ, and the quote form
  about.html        the studio, the values, how the first two months go
  404.html          not found page
  robots.txt
  sitemap.xml
  assets/
    css/style.css   the whole design system
    js/main.js      the scroll camera, the quote form, nav, mobile menu
    img/favicon.svg the logo mark on a dark tile, used for the browser tab
    img/logo-mark.svg  the mark on its own, transparent
    img/apple-touch-icon.png  180x180, because iOS ignores SVG icons
    img/og.png      the 1200x630 image shown when a link is shared
  design/
    og-image.html   the source that og.png is rendered from
  docs/
    google-business-profile.md  what to put in the Google listing
  supabase/
    schema.sql      the leads table and its security policy
    webhook.sql     the trigger that fires the notification
    functions/notify-lead/  emails you when an enquiry arrives
```

## Running it locally

Serve the folder so relative paths behave exactly as they will in production.

```bash
cd amora-studios
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly by double clicking also works, but serving it is closer to the real thing.

## Deploying

Any static host works. Point it at this folder and there is nothing to build.

- **Netlify Drop**, drag the folder onto https://app.netlify.com/drop and you have a live URL in about a minute,
  no domain and no account needed to start.
- **Netlify**, **Vercel**, or **Cloudflare Pages** connected to a repo, with the publish directory set to
  `amora-studios` and the build command left empty.
- **GitHub Pages**, push the contents of this folder to the branch you publish from.

`404.html` is picked up automatically by all of these.

## The email address

Enquiries go to `arimarants@gmail.com`. It is **never shown anywhere on the page**. There is no `mailto:` link in
the markup and no address in the text.

The address is assembled at runtime inside `assets/js/main.js`, in the small `inbox()` function. Everything that
needs it asks for it there. To change the address, change that one function.

Two things worth knowing:

- The address does exist in the JavaScript source, so a determined person could read it. That is unavoidable for a
  site with no backend. Splitting it up the way this does stops the ordinary address scrapers, which just read the
  page HTML for `mailto:` links.
- If you want it gone from the source entirely, use a form service, which is described next.

## The quote form

`services.html#quote` has a real form. Business name, contact name, email, phone, an optional package pick, the
eight service checkboxes, and a free text box.

The eight are the modules the backend can actually deliver: Website, Social media, Content creation, Lead
generation, Local SEO, Reputation, Email management, Analytics & growth. The checkbox values are those names verbatim,
so what lands in `leads.services` lines up with what the platform provisions. If the module list changes, change
it here too rather than letting the site advertise something that cannot be switched on.

Out of the box it works with no setup at all. On submit it assembles the whole enquiry, including which services
were ticked, and opens the visitor's mail app with everything already written and addressed to you. You get one
tidy email rather than a vague "hi, interested".

There are two ways to make it send silently in the background instead, which is what you want once the domain is
live. The form tries them in this order.

### Option 1, Supabase (enquiries land in a database)

Best if you want the enquiries kept, searchable, and reportable rather than sitting in an inbox.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in `supabase/schema.sql` from this repo, and run it. That creates the
   `leads` table and the security policy.
3. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key.
4. Open `assets/js/main.js` and fill in the two constants at the top of the quote form section:

```js
var SUPABASE_URL = "https://yourproject.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGci...";
```

Enquiries then appear under **Table Editor → leads**, newest first, with a `handled` checkbox and a `notes` column
for your own triage.

The anon key is designed to be public and is safe sitting in the page. What protects the table is row level
security: the policy in `schema.sql` lets anonymous visitors insert a valid enquiry and nothing else, so nobody can
read, edit, or delete what is in there. **Never put the `service_role` key in the site**, it bypasses those
policies entirely.

### Option 2, a form service (enquiries land in your inbox)

Simpler, no database. Find `FORM_ENDPOINT` in `assets/js/main.js` and paste in an endpoint.

```js
var FORM_ENDPOINT = "https://api.web3forms.com/submit";
```

[Web3Forms](https://web3forms.com), [Formspree](https://formspree.io), and [Basin](https://usebasin.com) all have
free tiers and all take a plain form POST, which is what the code already sends. With Web3Forms you also add a
hidden `access_key` input to the form. With either option set, the visitor never leaves the page, they just see a
thank you message, and if the send fails they get told and keep what they typed.

## Getting told about new enquiries

Enquiries land in the `leads` table quietly. `supabase/functions/notify-lead/index.ts` emails you whenever a new
one arrives, through [Resend](https://resend.com).

**The Resend account that sends is whichever account the API key belongs to.** Nothing else decides it, so create
the key in the account you want the email to come from.

1. **In Resend**, add and verify `amorastudios.net` under **Domains**. Skip this to start with and the function
   falls back to Resend's `onboarding@resend.dev`, which can only email your own address. Fine for testing, not for
   anything a client sees.
2. **In Resend**, go to **API Keys → Create API Key**, give it **Sending access** only, and copy it.
3. **In Supabase**, go to **Edge Functions → Deploy a new function → Via Editor**, name it `notify-lead`, select
   everything in the sample file, and paste in the contents of `supabase/functions/notify-lead/index.ts`.

   Then open the function's settings and turn **Verify JWT off**. This is the step that is easy to miss, and
   without it nothing works: Supabase checks for a valid JWT before your function's code runs, a database webhook
   does not carry one, and every call comes back `401 UNAUTHORIZED_NO_AUTH_HEADER`. Sending the anon key in an
   `Authorization` header instead does not help, it is rejected as `UNAUTHORIZED_INVALID_JWT_FORMAT`. Disabling the
   check is what Supabase recommends for `pg_net` and webhook callers.

   The function declares `withSupabase({ auth: "none" })` to match, so a caller needs no Supabase key, and the
   `WEBHOOK_SECRET` below is what actually keeps the function private.
4. **In Supabase**, under **Edge Functions → notify-lead → Secrets**, add:

   | Secret | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the key from step 2 |
   | `NOTIFY_TO` | where enquiries should land, comma separated for more than one |
   | `NOTIFY_FROM` | `AMORA Studios <leads@amorastudios.net>`, once the domain is verified |
   | `WEBHOOK_SECRET` | any long random string you invent |

5. **In Supabase**, open the **SQL Editor** and run `supabase/webhook.sql` with its two placeholders filled in.
   That registers the trigger which calls the function on every new enquiry.

   The dashboard can do this too, under **Integrations → Database Webhooks**, but only once webhooks have been
   enabled on the project. On a fresh project the SQL is the shorter route, and it enables what it needs.

Submit a test enquiry and you should get the email within a few seconds. If nothing arrives, open
**Edge Functions → notify-lead → Logs**, which records why a send was refused.

The secret in step 4 matters because the function URL is public. Without it, anyone who found the URL could post a
fake enquiry and make your account send email.

## The auto-reply to the person who enquired

When a lead lands, two emails go out. The notification to you, and a confirmation
to whoever filled the form in. They are sent by the same edge function, in that
order, and the second one cannot affect the first.

```
supabase/functions/notify-lead/
  index.ts           GENERATED. the single file that gets deployed
  autoreply.ts       source: pure template filling, no network, no Deno APIs
  handler.part.ts    source: the webhook handler
  build-index.py     concatenates the two into index.ts
  autoreply.test.ts  17 tests, run with node
emails/
  quote-confirmation.html   the designed email
  quote-confirmation.txt    the plain text part
email/amora-logo.png        served at /email/amora-logo.png
```

**`index.ts` is generated and must not be edited directly.** Edit `autoreply.ts`
or `handler.part.ts`, then run:

```bash
python3 supabase/functions/notify-lead/build-index.py
```

It exists as one file because the dashboard editor deploys whatever files you
have created in it, and it is easy to paste one, hit Deploy, and get
`Module not found` for the other — which takes the lead notification down with
it, not just the auto-reply. One file with no relative imports cannot fail that
way. A test asserts the generated file still matches its sources.

**The templates are embedded in `autoreply.ts` as strings**, not read from disk.
An edge function has no project filesystem at request time, so reading
`emails/quote-confirmation.html` at runtime would fail once deployed. A test
asserts the embedded copies still match the files, so editing one without the
other fails the suite rather than silently shipping stale copy.

**If you edit the templates**, regenerate the embedded copies, then run the
tests:

```bash
node --experimental-strip-types --test supabase/functions/notify-lead/autoreply.test.ts
```

Point `--test` at the file, not the folder, or it tries to run `autoreply.ts`
itself as a test and reports a failure that is not real.

### What varies per email

The person picks email or phone on the form. Three cases:

| They chose | The email says |
| --- | --- |
| Email | "Ari emails you the quote." |
| Phone, with a number given | "Ari calls you with the quote." |
| Anything else, or phone with no number | "Ari emails or calls you with the quote." |

The last row matters. If someone asks for a call but leaves the number blank,
promising a call would be a promise nobody can keep, so the copy stays vague and
**your notification flags it in red** so you know to reply by email.

### Deploying a change to it

**Edge Functions → notify-lead → Code**, select everything in `index.ts`, paste
the generated file over it, deploy. One file, nothing else to create.

### Rules it follows

- The notification sends first and is never blocked by the auto-reply, which is
  wrapped in its own try/catch and cannot change the response.
- An address that fails a basic sanity check is skipped silently. A lead with a
  typo'd address is still a lead.
- Names are escaped before going near the HTML, and capped at one word and 40
  characters.

## Analytics

This is live. `assets/js/main.js` has two constants near the top, both already filled in, pointing at
the **AMORA Studios** project on PostHog US:

```js
var POSTHOG_KEY = "phc_rQDJ...";
var POSTHOG_HOST = "https://us.i.posthog.com";
```

The key comes from **Settings → Project → Project API Key**, and `POSTHOG_HOST` has to match the region
the project is in, `us.i.posthog.com` or `eu.i.posthog.com`. Get the region wrong and events go somewhere
that will never show them.

Leave the key empty and no analytics script is loaded and no requests are made at all.

There is a dashboard, **AMORA Studios site**, with the two things worth watching: daily visitors against
quote requests, and the services page to quote request funnel. Top pages and traffic sources are already
covered by PostHog's own **Web analytics** tab, so they are not duplicated as saved insights.

You get page views, plus these events:

| Event | When |
| --- | --- |
| `quote_submitted` | An enquiry went through. `method` is `supabase`, `form_endpoint`, or `mailto` |
| `quote_failed` | The send was refused, so you can see enquiries that were attempted and lost |

Both carry the shape of the enquiry, which package was picked, how many services, and whether a message was
written, but **never the name, email, phone, or message text**. Those live in the `leads` table, which is the
right place for them. Analytics is for counting, not for holding customer details.

The question worth asking of it is what share of the people who reach `services.html` actually submit. That
number, rather than raw visits, tells you whether the page is doing its job.

The key is designed to be public and is safe in the page.

## Where the site is served from

The site should live at exactly one address. Right now it is published in two, which is worth knowing
before you share a link:

| Address | Repo it deploys | What it is |
| --- | --- | --- |
| `amora-studios-9gbi.vercel.app` | `amora-studios` | Vercel. **This is the site.** |
| `arimarants-ai.github.io/amora-studios/` | `amora-studios` | GitHub Pages, publishing the same repo at the project subpath |

Branch pushes also get a throwaway `...-git-<branch>-....vercel.app` preview. Those are automatic,
Vercel tells search engines to ignore them, and they no longer report to analytics, so they can be
left alone.

**One name is a trap.** The Vercel project called `amora-studios` does *not* serve this site. It
deploys `amora-platform`, the Next.js client platform, and answers on `amora-studios.vercel.app`.
Deleting it because the name looks like a duplicate would take the platform down. The marketing site
is the awkwardly named `amora-studios-9gbi`.

The end state is `amorastudios.net` and nothing else. Every page already declares that as its
`rel="canonical"`, so once the domain resolves, search engines collapse the duplicate onto it without
being asked. The remaining job is to stop handing out two links:

- **GitHub Pages** — Settings → Pages → Source → **None**. This is the copy people have actually been
  using, so have the replacement link ready before switching it off.

Analytics ignores deploy previews and localhost. PostHog records the host on every event, so while
more than one copy is live you can tell them apart by breaking down on `$host`.

## Other things to change before launch

1. **Domain.** `https://amorastudios.net` is a placeholder in the canonical tags, the Open Graph tags,
   `sitemap.xml`, and `robots.txt`. Swap it for the real domain once you have one.
2. **Share image.** `assets/img/og.png` is the picture shown when an AMORA link is pasted into WhatsApp, a DM, or
   social. It is 1200x630 and already linked from every page. To change it, edit `design/og-image.html` and
   re-render it:

   ```bash
   npx playwright screenshot --viewport-size=1200,630 design/og-image.html assets/img/og.png
   ```

   Keep the finished file under about 300KB, or WhatsApp skips the preview. If you change the domain, update the
   `og:image` and `twitter:image` URLs alongside the other absolute links.

## How the scroll animation works

The landing page is **one** animation. There are no separate scenes handing off to each other. `index.html` holds a
single pinned section containing a single SVG world about two and a half screens wide, and scrolling moves a camera
through that world.

The world is painted once, in daylight, and contains everything in the story laid out left to right. A shop on the
left, then an empty inbox, then a plan being ticked, then a website and a phone being built, then enquiries
arriving. Night is a single sheet of dark laid over the top of all of it.

`assets/js/main.js` measures how far through the pinned section you are, eases that number, and does two things
with it.

| | |
| --- | --- |
| Writes `--t` and `--day` onto the stage | `--t` runs 0 to 1 across the whole story, `--day` runs 0 at midnight to 1 at noon. Every moving part in the CSS reads these two numbers, so nothing can drift out of sync. |
| Rewrites the SVG `viewBox` | This is the camera. The `SHOTS` array near the top of `main.js` lists where it looks at each point, as a centre point and a width in world units. A smaller width is a closer shot. |

The copy rides alongside in HTML rather than in the SVG, so the type stays real text at full sharpness and screen
readers can read it. Each `.beat` gets an `--in` and a `--span`, and the CSS works out its own fade and drift from
`--t`.

If you want to change the feel:

- **`SHOTS` in `main.js`** is the storyboard. Move a centre point, or change a width to push in or pull back.
- **`.stage { height: 780vh }` in `style.css`** is how much scrolling the whole story takes. Taller is slower.
- **The `0.09` in the `lerp` call in `main.js`** is the smoothing. Lower is silkier and more floaty, higher is
  tighter to the wheel. The scroll itself is never hijacked, only the animation is eased, so trackpads and
  scrollbars behave exactly as people expect.
- **`--in` and `--out` on any element in the SVG** decide when it fades in and out, on the same 0 to 1 scale.

## Accessibility and support

- Under `prefers-reduced-motion` the camera is switched off entirely. The world is shown once at full width and the
  seven beats become a normal stacked page you read top to bottom.
- The site works without JavaScript. The story renders as a static scene and every page, link, and the service list
  all still work. Only the form needs JavaScript.
- Skip link, visible focus rings, labelled form fields, real heading order, and a live region on the form status.
- All artwork is inline SVG, so it is sharp on any screen at any zoom and costs no image requests.

## The site-building skill

`skills/local-business-site/` is a Claude skill for building sites for other
businesses. Point Claude at it and give it the company details.

It fixes the engineering and deliberately leaves the design open. `base.css` and
`site.js` carry the reset, layout primitives, accessibility, motion handling and
form plumbing, and contain no colours, no typography and no components, so two
sites built with it should not look related. The visual identity is invented per
business, and `references/design-direction.md` exists to push that — including a
note to avoid reproducing this site's own look.

The bundled `site.js` ships with its keys blank. Nothing in the skill contains a
credential or an address from this project.
