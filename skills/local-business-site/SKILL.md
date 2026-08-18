---
name: local-business-site
description: Builds a complete marketing website for a small local business — a scroll-told homepage, a services page with a working quote form, an about page, and a lead pipeline that emails the owner when an enquiry arrives. Plain HTML, CSS and JS with no framework and no build step, so it stays editable and deploys anywhere. Use this whenever someone wants a site, landing page, or web presence built for a real business — a studio, agency, salon, trades company, clinic, restaurant, gym, shop — or asks to rebuild, refresh, or clone an existing small-business site, or hands over company details and asks for "a site like the last one". Use it even when they only say "build me a website for X" without naming a style, and even when the request sounds like a single landing page, because the intake and the launch checklist are what keep it from shipping broken.
---

# Local business site

A site for a small business has one job: turn a stranger who found you into an
enquiry. Everything here serves that. The visual work matters because trust is
visual, but a beautiful site with no working form is a failure, and a plain site
that reliably delivers leads is a success.

This builds a four-page static site with a real lead pipeline behind it. No
framework, no build step, no dependencies. That constraint is a feature: the
owner can open the files in a year and change a price without a toolchain, and
it deploys to any host by copying a folder.

## What you are building

```
index.html      one continuous scroll story, the pitch
services.html   what they sell, how pricing works, the quote form
about.html      who they are, why they can be trusted
404.html
robots.txt, sitemap.xml
assets/css/style.css    the whole design system
assets/js/main.js       scroll camera, form, nav
assets/img/             favicon, logo mark, apple-touch-icon, og.png
supabase/               schema, webhook, notify function (only if leads go to a database)
```

Three pages is usually right. A fourth top-level page is a smell — it normally
means something belongs inside services or about. Resist adding a blog unless
they will actually write one.

## Step 1: intake

You need the answers below before writing markup. Ask for what is missing in
**one** message rather than trickling questions out, and infer what you fairly
can — if they say "barber shop in Leeds" you do not need to ask whether they
serve walk-ins, you propose it and let them correct you.

**Must have, cannot invent:**

- Business name, and what they actually do in one sentence
- Where they are, and how they say it (`College Station-Bryan area`, not
  `Bryan-College Station` — people are particular about their own place names)
- The services, named the way the business names them
- Where enquiries should land (an email address, at minimum)
- Anything already fixed: a logo, brand colours, a domain

**Ask, but proceed on a stated assumption if unanswered:**

- Who the customer is, and what they are worried about when they call
- Whether prices are public. Most small businesses want ranges or "from £X",
  not a price list, and almost none want prices next to a package name
- Whether the owner is the face of the business. If yes, a founder card on the
  about page does more work than three paragraphs of "our values"

**Do not ask:** the colour palette, the font, the number of sections, whether
they want it "modern". Those are your job. Propose, then take correction.

If you only get a name and a trade, that is enough to build a strong draft.
Say what you assumed, build the whole thing, and let them redirect.

## Step 2: decide the story before writing any HTML

The homepage is a single narrative, not a stack of sections. Write the beats as
plain sentences first, in the business's own terms, and get those agreed before
building anything. Six to eight beats, each one a step in the customer's actual
experience.

The shape that works, told from the customer's side rather than the seller's:

1. **The situation now** — the shop is good, and quiet. Recognition, not insult.
2. **The cost of it** — what the quiet actually means, concretely
3. **What we do about it** — the offer, in one breath
4. **How it gets built** — proof of work, not adjectives
5. **What changes** — the phone ringing, the inbox filling
6. **What keeps it going** — the ongoing part

Never write a beat that the business could not defend to a customer's face.
"We 10x your revenue" fails that test. "Someone searches for what you do, and
finds you first" passes.

See `references/copy.md` before writing a word of visible text. The voice is
most of what separates this from a template, and it has specific rules.

## Step 3: build

Order matters. Each step depends on the last being right.

1. **Tokens** — set the palette and type in `:root` and the two theme classes.
   One accent colour that means "act", one warm neutral for paper, one deep ink.
   The whole site should read as one thing before you write any components.
2. **The shell** — nav, footer, container, buttons, and the section rhythm on
   every page. Get it right once and every page inherits it.
3. **The story** — the pinned stage and the SVG world. This is the slow part;
   `references/scroll-story.md` has the engine and how to author the world.
4. **Services and the form** — the checkboxes must match what the business can
   actually deliver. A form offering a service they cannot fulfil creates an
   awkward phone call.
5. **About** — shortest page, does the most trust work.
6. **The lead pipeline** — `references/lead-pipeline.md`.
7. **Launch checklist** — `references/launch.md`. Do not skip this. Most of the
   ways a small-business site fails in the wild are on that list.

Start from `assets/style.css` and `assets/main.js`. They are working files, not
pseudocode: copy them in, then change the tokens and the story rather than
writing a design system from scratch.

## Step 4: verify, do not assume

Rendering the page and looking at it catches things reading the code does not.
If a browser is available, screenshot each page at desktop and phone widths and
actually look. Specifically check:

- **Reduced motion.** Emulate it. A scroll animation that silently does nothing
  on a colleague's laptop is the single most common way this design fails, and
  you will never see it on your own machine.
- **Every page at 380px wide.** Not a resize of the desktop layout — look at it.
- **The nav over both light and dark sections.** See the colour trap in
  `references/design-system.md`; a wordmark that vanishes on one section is easy
  to ship and embarrassing to leave.
- **The form, end to end.** Submit a real enquiry and confirm it arrives where
  it is supposed to. "The code looks right" is not confirmation.
- **The favicon at 16px.** Scale the SVG, do not shrink the viewport — those are
  different things and only one tells you whether the mark survives.

Be sceptical of automated checks you wrote yourself. A contrast script that
cannot parse `oklab()` will report failures everywhere and teach you nothing. A
passing check is worth exactly as much as the checker behind it.

## Things that make this good rather than generic

**One accent, used sparingly.** The accent colour appears on buttons and almost
nowhere else. Sites look cheap when every heading is branded.

**Real text, not text in images.** All copy is HTML. The artwork is inline SVG,
so it is sharp at any zoom, costs no image requests, and screen readers skip it
cleanly.

**Sections alternate light and dark** to give the page a pulse. The theme is a
class on the section, and the tokens do the rest.

**Motion is eased, never hijacked.** Smooth the animation, never the scroll
itself. Trackpads and scrollbars must behave exactly as the visitor expects, or
the site feels broken in a way people cannot name.

**It works with JavaScript off.** The story renders as a static scene, every
link works, the service list is all there. Only the form needs JS.

**Nothing is a placeholder at handover.** No lorem, no `#`, no stock photo of a
handshake. If you do not have a real testimonial, do not build a testimonial
section and fill it with an invented one — build something else.

## Reference files

Read these when you reach the relevant step rather than all at once.

| File | Read it when |
| --- | --- |
| `references/copy.md` | Before writing any visible text. The voice rules and section-by-section patterns |
| `references/design-system.md` | Setting up tokens and components, and when anything looks off |
| `references/scroll-story.md` | Building the homepage. The camera engine and how to author the SVG world |
| `references/lead-pipeline.md` | Wiring the form to a database and email. Includes the traps that cost hours |
| `references/launch.md` | Before handover. Domain, canonical, share image, analytics, Google listing |

## Bundled assets

| File | What it is |
| --- | --- |
| `assets/style.css` | The full design system. Tokens at the top are the only part you must change |
| `assets/main.js` | Scroll camera, reveal-on-scroll, nav theming, mobile menu, form submit. Config constants at the top are blank by design |
| `assets/supabase/schema.sql` | Leads table with insert-only row level security |
| `assets/supabase/webhook.sql` | The trigger that fires the notification |
| `assets/supabase/notify-lead.ts` | Edge function that emails the owner on a new lead |

Copy them into the new project rather than writing equivalents. They carry
fixes for problems you will otherwise rediscover the hard way.
