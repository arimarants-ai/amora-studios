# Task: quote-request auto-reply email

I want to add an automatic confirmation email that goes to the person who submits the quote request form on amorastudios.net. Right now the form emails me when someone submits — that part already works and must keep working. This is a **second, additional** email that goes to the requester.

## Hard constraints — read these first

1. **Resend account.** This project has its own separate Resend account, sending from `hello@amorastudios.net`. I have another Resend account holding unrelated domains (pitchpage.co, ancestorsqr.com, relocateiq.io). Under no circumstances should this code use a key, domain, or template belonging to that other account. Use only the `RESEND_API_KEY` already configured for this project. Before you write anything, show me which env var you plan to read and where it's defined, and confirm it belongs to the AMORA account.
2. **Do not modify anything inside Resend itself** — no creating domains, templates, audiences, or API keys. This change is code-only. `amorastudios.net` is already verified.
3. **The existing notification to me must never break.** If the auto-reply fails for any reason, my notification email still sends and the form still returns success to the user. A broken auto-responder must never cost me the lead.

## The templates

I'm putting three files in the repo — use the templates as-is, don't rewrite the copy or the markup:

- `emails/quote-confirmation.html` — the designed HTML email
- `emails/quote-confirmation.txt` — the plain-text fallback
- `public/email/amora-logo.png` — the logo (320×263, displayed at 160×132)

The HTML references the logo at `https://amorastudios.net/email/amora-logo.png`. Email
clients can't render local files or data URIs reliably, so it has to be a real public
URL. Confirm that path actually resolves on the deployed site before we go live — if
the static asset route differs in this project, update the `src` in the template to
whatever the correct public URL is and tell me what you changed it to.

### Placeholders

Both templates contain placeholders. Fill them server-side before sending.

**`{{FIRST_NAME_COMMA}}`**

- If the form captured a first name, replace it with `, ` + the name (e.g. `, Marcus`) so the line reads "Thanks, Marcus — we've got it."
- If there's no name, or it's blank/junk, replace it with an empty string so it reads "Thanks — we've got it."
- **Escape the name before injecting it into the HTML version** (`&`, `<`, `>`, `"`, `'`). Someone will eventually put HTML in that field.
- Take only the first word of a full name, trim whitespace, and cap it at ~40 characters.

**`{{PREHEADER}}`, `{{STEP3_HEADLINE}}`, `{{STEP3_DETAIL}}` — these vary by contact preference**

I'm adding a field to the form where the person picks how they want to be contacted:
email or phone. The email's third step should reflect whichever they chose. Use this
table exactly:

| Preference | Placeholder | Value |
|---|---|---|
| **email** | `{{PREHEADER}}` | `Ari is putting together your plan and price, and will email it to you within one business day.` |
| | `{{STEP3_HEADLINE}}` | `Ari emails you the quote.` |
| | `{{STEP3_DETAIL}}` | `A real number and the plan behind it &mdash; not a vague ballpark.` |
| **phone** | `{{PREHEADER}}` | `Ari is putting together your plan and price, and will call you within one business day.` |
| | `{{STEP3_HEADLINE}}` | `Ari calls you with the quote.` |
| | `{{STEP3_DETAIL}}` | `He&rsquo;ll send it in writing afterward too, so you have it on paper.` |
| **missing / unrecognized** | `{{PREHEADER}}` | `Ari is putting together your plan and price, and will email or call you within one business day.` |
| | `{{STEP3_HEADLINE}}` | `Ari emails or calls you with the quote.` |
| | `{{STEP3_DETAIL}}` | `A real number and the plan behind it &mdash; not a vague ballpark.` |

Notes on this:

- The values above contain HTML entities (`&mdash;`, `&rsquo;`) because they go into the
  HTML template. For the **plain-text** template, substitute the literal characters
  (`—`, `'`) instead — don't leak entities into the text version.
- **The fallback row is not optional.** If the contact-preference field is missing,
  empty, or holds an unexpected value, use the fallback copy. Never send an email that
  promises a phone call because a field defaulted oddly.
- If they chose phone but didn't give a phone number, use the fallback copy rather than
  promising a call we can't make. Flag this case in my notification email so I know to
  reply by email.

Put the placeholder-filling in one small, unit-testable helper — not inline in the
route — and write tests covering: email preference, phone preference, missing
preference, phone-preference-without-a-number, name present, name absent, and a name
containing HTML.

## What to build

In the existing form handler, after the notification to me is sent, send a second email via Resend:

- **from:** `Ari at AMORA Studios <hello@amorastudios.net>`
- **to:** the email address the requester submitted
- **replyTo:** my real inbox (ask me for the address — do not guess, and do not use `hello@amorastudios.net` if that isn't where I actually read mail)
- **subject:** `We've got your request — AMORA Studios`
- **html:** the filled HTML template
- **text:** the filled plain-text template (send both — text-only improves deliverability and stops us looking like bulk mail)

Requirements:

- Wrap the auto-reply send in its own try/catch. Log failures with enough detail to debug, but never let a failure change the HTTP response the form gets.
- Validate the submitted email address before attempting to send. If it's obviously invalid, skip the auto-reply silently and still send my notification — I'd rather get a lead with a typo'd address than lose it.
- If the form has no honeypot or bot check, add a simple hidden honeypot field. Bots hitting the form shouldn't trigger auto-replies from my domain — that's how sending reputation gets wrecked.
- Read the templates in a way that works on Vercel's serverless runtime. If the build doesn't reliably include files read at runtime, import them as strings at build time instead. Tell me which approach you took and why.
- The form itself needs the new contact-preference field: a small required choice between "Email" and "Phone". Match the existing form's styling — don't introduce a new visual language for one field. If the phone field is currently optional, make it required only when "Phone" is selected.

## Before you finish

- Run the build locally and confirm it passes.
- Do a real test send to my address by submitting the form on a local or preview deployment, not by writing a throwaway script that bypasses the handler — I want the actual path tested. **Submit it twice — once choosing email, once choosing phone** — and confirm the received emails differ in the right place.
- Confirm the logo actually loads in the received email. If it renders as a broken image, the public URL is wrong — fix it before we ship.
- Show me the diff before deploying anything to production.
- Confirm in your summary: (a) which env var was used, (b) that no Resend resources were created or changed, and (c) that the notification-to-me path is untouched.

Ask me anything you need rather than guessing — especially the reply-to address.
