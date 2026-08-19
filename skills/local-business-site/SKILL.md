---
name: local-business-site
description: Builds a complete, well-functioning website for a business or organization — pages, a working contact or booking form that actually delivers the enquiry somewhere, analytics, and a launch checklist. Handles the engineering and the plumbing so the only thing left to decide is the design, which is invented fresh for each business rather than pulled from a template. On a real job it also ships the finished site — repository, hosting, domain, analytics — and hands back an exact list of what only the owner can do. Use this whenever someone wants a website, landing page, or web presence built or rebuilt — for a studio, agency, salon, trades company, clinic, restaurant, gym, shop, nonprofit, or their own project — including when they just say "build me a site for X" and hand over company details. Use it even for what sounds like a single page, because the form plumbing and the launch checklist are what keep a site from shipping broken.
---

# Business website

This skill guarantees the **engineering**. It deliberately does not decide the
**design**.

That split is the whole point. The parts that are the same on every good site —
a form that actually reaches somebody, pages that work on a phone, a site that
does not silently break for a visitor with reduced motion on, a launch checklist
that catches the things nobody sees — are handled here so nobody has to
re-specify them. Everything a visitor would recognise as "the look" is invented
for each business.

## The one rule that matters most

**Two sites built with this skill should not look related.**

Not a different accent colour on the same layout — genuinely different: different
type, different structure, different navigation, different way of presenting the
services, a different idea of what the homepage even is. If you can imagine both
sites in the same portfolio and think "same designer, same template", start over
on the design.

You have real creative latitude here, and you are expected to spend it. The
person running this skill has strong opinions and will tell you when they want
something specific — take that direction exactly. When they have not said, do not
reach for the safest thing.

Before building, read `references/design-direction.md`. It is the most important
file in this skill.

## Step 1: intake

Ask for what is missing in **one** message, and infer what you fairly can. If
they say "barber shop in Leeds" you do not need to ask whether they do walk-ins —
propose it and let them correct you.

**Cannot invent:**

- The name, and what they actually do in one sentence
- Where they are, phrased the way they phrase it
- What they sell, named the way they name it
- Where an enquiry should land — an email address at minimum
- Anything already fixed: a logo, brand colours, a domain, an existing site

**Ask, but proceed on a stated assumption if unanswered:**

- Who the customer is and what they are worried about when they get in touch
- Whether prices are public, and in what form
- Whether the owner is the face of the business
- Anything they like or hate the look of — a competitor, a reference, a colour
  they will not use

**Do not ask:** what fonts they want, how many sections, whether it should be
"modern". Those are yours to propose. Bring a direction, take correction.

A name and a trade is enough to build a strong draft. State your assumptions,
build the whole thing, let them redirect.

## Step 2: design direction

Invent one. Read `references/design-direction.md` before you write any CSS — it
covers how to derive a direction from the business's own world, and the specific
looks to avoid because everything already looks like them.

Write the direction down in three or four lines before building: the palette as
named values, the typefaces and what each is for, the layout idea, and the one
thing this site does that the last one did not. If that paragraph would fit an
unrelated business without editing, it is not a direction yet.

## Step 3: structure

**Default to several pages.** Most businesses have more than one thing to say,
and a real page per subject is easier to send a client, easier to update without
touching everything else, and ranks for the searches that page is actually about.
A single scrolling page collapses all of that into one URL.

Decide the pages from the business rather than a template. Some shapes:

- **Home, services, about** for anyone whose customers compare before enquiring.
- **Home, a page per service, contact** where the services have different
  customers searching different words. A roofer's emergency page and their
  re-roofing page are read by people in completely different states of mind.
- **Home, menu or portfolio, about, visit** where the thing itself is the pitch —
  a restaurant, a photographer, a venue.
- **One page** only when the business genuinely has one thing to say: a single
  service, a phone number, and no depth to add without padding.

### If the nav has items, they should mostly be pages

A top nav that reads like a site — What we do, Coverage, Emergency, Contact —
and turns out to be four anchors on one long page is a small betrayal of what the
visitor expected. They click expecting to arrive somewhere, and instead the page
moves under them. Anchors are for jumping within a page you are already on, not
for impersonating a site.

So: build the pages, or shorten the nav to match what actually exists.

### Keep a page from being thin

A page needs a reason to exist beyond filling a nav slot. Before splitting, check
each candidate has its own subject, enough substance to stand alone, and a
sentence you could write on it that would not belong anywhere else. Two thin
pages are worse than one good one, and a page nobody will maintain is worse than
no page.

Skip a blog unless someone will actually write it. Skip a testimonials page
rather than inventing quotes for it.

### What every page needs

Shared shell so nothing drifts: the same nav and footer, with the current page
marked (`aria-current="page"`) so people know where they are. Its own `<title>`,
meta description and canonical, because those are per page and duplicating them
across a site is a wasted opportunity and a search problem. Its own `h1`. And a
`404.html`, which is the one page you cannot link to and the one people reach
when something is wrong.

Keep the paths flat and readable — `services.html`, not `pages/services/v2.html`.

## Step 4: build

Plain HTML, CSS and JS with no framework and no build step, unless the project
genuinely needs otherwise. The owner should be able to open the files in a year
and change a price without a toolchain, and it deploys by copying a folder.

Start from the bundled assets — `assets/base.css` and `assets/site.js` — which
carry structure and behaviour and **no visual opinions at all**. Everything a
visitor sees is CSS you write for this business. See `references/build.md` for the
baseline every site has to meet: semantics, responsive behaviour, keyboard and
screen reader support, and the reduced-motion rule.

## Step 5: make the form actually work

A beautiful site with a form that goes nowhere is a failed site, and it fails
silently. `references/forms-and-leads.md` covers the options, from a zero-setup
fallback that works immediately to a database with email notification, and the
specific traps in each.

Whatever you wire up, submit a real enquiry and confirm it arrives. "The code
looks right" is not confirmation.

## Step 6: verify

Render it and look. Reading the code does not catch what a browser does.

- **Reduced motion**, emulated. Content that only appears via animation must
  still be readable when animation is off. This is the most common silent failure
  in modern sites and you will never see it on your own machine.
- **Every page at 380px wide**, looked at rather than assumed.
- **Keyboard only**: tab through, confirm focus is always visible and the menu
  can be opened and closed.
- **The form, end to end.**
- **Every file the `<head>` points at exists.** Icons and share images are the
  usual absentees because nothing on screen complains.
- **Contrast** on the pairs that actually ship, including muted text on tinted
  backgrounds, which is where it usually fails.

Be sceptical of checks you wrote yourself. A contrast script that cannot parse
`oklab()` will report failures everywhere and teach you nothing. Sample rendered
pixels or read computed values, and when a result surprises you, assume the
checker is wrong until you have looked with your eyes.

## Step 7: launch checks

`references/launch.md`. Canonical tags, share image, icons, and the
duplicate-deployment problem. Most of the ways a site fails in the wild are on
that list and none are visible while building.

## Step 8: ship it

**On a real job, do not stop at a folder of files.** Take it live: create the
repository, deploy it, get a domain on it, wire up analytics, and confirm the
live form actually delivers an enquiry. Do everything that does not need the
owner's password, then hand back a numbered list of what does, with every value
they need already filled in.

**On a test, demo or example build, do none of it.** Creating repositories,
deploying public URLs and buying domains for a business that does not exist costs
money and leaves live pages to clean up. `references/ship.md` lists the signals
that mark a build as a test.

The dividing line while shipping is cost and visibility: anything reversible and
private — a private repo, a push, a deploy to the platform's own URL — just do,
then report. Anything outsiders can see or that spends money — making a repo
public, switching a domain that already serves a working site — stop and confirm.

The domain is normally the client's, bought and held in their own account, so
connecting it means producing instructions rather than making changes. Never edit
DNS on a domain you do not own, even with access: those records usually carry the
business's email, and breaking that is worse than any website problem.

Read `references/ship.md` for the order, the traps, and the shape of the
handover.

## Reference files

| File | Read it when |
| --- | --- |
| `references/design-direction.md` | **First, always.** How to invent a look, and what to avoid |
| `references/copy.md` | Before writing visible text. Finding this business's voice |
| `references/build.md` | While building. The technical baseline and the motion rules |
| `references/forms-and-leads.md` | Wiring the form up |
| `references/launch.md` | Before handover |
| `references/ship.md` | **Real jobs only.** Taking it live, and what to hand back |

## Bundled assets

| File | What it is |
| --- | --- |
| `assets/base.css` | Reset, layout primitives, focus and motion handling. **Zero colours, zero typography, zero components.** Meant to be built on, not themed |
| `assets/site.js` | Behaviour only: nav state, mobile menu, reveal-on-scroll, form submission with fallbacks, optional analytics. Toggles classes and leaves the styling to you |
| `assets/supabase/` | Schema, webhook and notify function for the database option |

These exist so nobody rewrites a form handler or an accessibility baseline from
scratch. They are not a design. If a site built with them looks like another site
built with them, the CSS was not written, it was copied.
