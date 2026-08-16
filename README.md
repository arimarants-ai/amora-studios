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
    img/favicon.svg
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

`services.html#quote` has a real form. Business name, contact name, email, phone, an optional package pick, sixteen
service checkboxes grouped by stage, and a free text box.

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

1. **In Resend**, add and verify `amorastudios.com` under **Domains**. Skip this to start with and the function
   falls back to Resend's `onboarding@resend.dev`, which can only email your own address. Fine for testing, not for
   anything a client sees.
2. **In Resend**, go to **API Keys → Create API Key**, give it **Sending access** only, and copy it.
3. **In Supabase**, go to **Edge Functions → Deploy a new function**, name it `notify-lead`, and paste in the
   contents of `supabase/functions/notify-lead/index.ts`.
4. **In Supabase**, under **Edge Functions → notify-lead → Secrets**, add:

   | Secret | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the key from step 2 |
   | `NOTIFY_TO` | where enquiries should land, comma separated for more than one |
   | `NOTIFY_FROM` | `AMORA Studios <leads@amorastudios.com>`, once the domain is verified |
   | `WEBHOOK_SECRET` | any long random string you invent |

5. **In Supabase**, go to **Database → Webhooks → Create a new hook**:
   - Table `leads`, event **Insert**
   - Type **HTTP Request**, method **POST**, URL of the `notify-lead` function
   - Add the header `x-webhook-secret` with the same value you used in step 4

Submit a test enquiry and you should get the email within a few seconds. If nothing arrives, open
**Edge Functions → notify-lead → Logs**, which records why a send was refused.

The secret in step 4 matters because the function URL is public. Without it, anyone who found the URL could post a
fake enquiry and make your account send email.

## Other things to change before launch

1. **Domain.** `https://amorastudios.com` is a placeholder in the canonical tags, the Open Graph tags,
   `sitemap.xml`, and `robots.txt`. Swap it for the real domain once you have one.
2. **Share image.** Add a `1200x630` PNG at `assets/img/og.png` and add these two lines to the `<head>` of each
   page so links look right when shared.

   ```html
   <meta property="og:image" content="https://amorastudios.com/assets/img/og.png" />
   <meta name="twitter:image" content="https://amorastudios.com/assets/img/og.png" />
   ```

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
