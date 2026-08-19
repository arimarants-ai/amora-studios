# Launch checklist

Most of the ways a small-business site fails in the wild are on this list. None
of them are visible while you are building.

## One address, not four

A site can end up published in several places without anyone deciding to: a host
connected to the repo, a second project someone made while experimenting, a pages
service left on from a test, a preview URL per branch. They are all real and all
reachable, and the owner hands out whichever they last saw.

Before handover, find out how many exist — if analytics is running, breaking
pageviews down by host answers it in one query and often surprises people — then
reduce it to one. `references/ship.md` covers how to do that safely, including
why you must check what a hosting project actually deploys before deleting it.

## Domain and canonical

- `rel="canonical"`, `og:url`, `sitemap.xml`, and `robots.txt` all name the same
  final domain. Search one placeholder string across the repo to catch strays.
- Do not submit the sitemap until the domain resolves. A sitemap pointing at
  nothing teaches Google the wrong thing about the site.

## Share image

The picture shown when the link is pasted into WhatsApp, a DM, or social. Absent
or broken, every share looks like spam.

- 1200×630, linked from every page as `og:image` and `twitter:image`
- Absolute URLs, not relative — they are fetched by other servers
- Keep it under about 300KB or WhatsApp skips the preview
- Render it from an HTML source file kept in the repo, so it can be regenerated
  when the branding changes. Design it — it is the first thing many people see

## Icons

- `favicon.svg` — the mark on a solid tile, not the full wordmark. Test it by
  scaling the SVG to 16px, not by shrinking the browser window; those are
  different things and only one tells you whether it survives
- `apple-touch-icon.png` at 180×180, full-bleed on a solid background. iOS
  ignores SVG icons, and a transparent PNG gets white corners
- Strokes usually need thickening for the small size. A mark that is elegant at
  512px often disappears at 16px

## Before handover

- Every page at 380px wide, looked at rather than assumed
- Reduced motion emulated on the homepage
- The nav over every section, light and dark
- A real enquiry submitted end to end, and confirmed to arrive
- No placeholder text, no `href="#"`, no invented testimonial
- The footer year updates itself
- 404 page exists and links home

## Google Business Profile

For a business with a physical location or a service area, the Google listing
often matters more than the website — it is the map result, the review link, and
the phone number people tap.

It has to be created and verified from the owner's own Google account, so you
cannot do it for them. What you can do is remove every decision from the task:
write the categories, the service area, the description, and the service names
into a file in the repo so they only have to paste.

Two things worth getting right:

- **Service-area business, not storefront**, unless they genuinely want a street
  address published. This is what keeps a home address off the map.
- **Service names identical to the website's**, so the listing, the site, and
  what the business actually sells all say the same words.

Point the listing at the real domain only once it resolves. A listing pointing
at a dead domain is worse than one with no website at all.
