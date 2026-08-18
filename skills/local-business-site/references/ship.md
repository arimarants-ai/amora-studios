# Shipping it

A site sitting in a folder is not a site. This step takes it from files to a
live address, does everything that can be done without the owner present, and
then hands over a list of what only they can do.

## First: is this a real job?

**Do not run any of this on a test, demo, practice or example build.** Creating
repositories, deploying to public URLs and buying domains are real, outward-facing
actions, and doing them for a business that does not exist wastes money and
leaves live pages that have to be cleaned up.

Treat it as a test when any of these are true:

- The words test, demo, example, sample, practice, dry run, mock or fake appear
  anywhere in the request
- The business is invented, or is transparently a placeholder
- Someone is evaluating this skill rather than building for a client
- They have said not to deploy

Otherwise treat it as real and proceed. If it is genuinely ambiguous — a real
sounding business with no client named — ask once, in one line, and get on with
it. Do not ask twice.

## What to do without asking, and what to stop for

The dividing line is cost and visibility, not effort.

**Do it, then report:** anything reversible and private. Creating a **private**
repository, committing, pushing, creating a hosting project, deploying to the
platform's own URL, setting environment variables, wiring analytics. If it turns
out wrong, it is deleted in one click and nobody saw it.

**Stop and confirm first:** anything that spends money, or that anyone outside
this conversation can see. Buying a domain. Changing DNS on a domain they already
own, because a mistake there can take down email as well as the website. Making a
repository public. Publishing to a domain already serving something else.

Present those as a short question with the actual cost and the actual
consequence, not a vague check-in.

## Check what you have before promising anything

Connector availability varies per session. Before telling anyone what will
happen, establish what is actually reachable — a GitHub connector, a hosting
connector, a DNS or registrar connector, an analytics connector — and say plainly
which parts you can do and which become manual steps. Never report a step as done
that you did not do.

If a connector is missing, the work does not stop; it moves to the handover list
with exact instructions instead.

## The order

1. **Repository.** Create it private under their account, commit the site with a
   real message, push. A private repo costs nothing and hides the work in
   progress from anyone searching for the business name.

2. **Hosting.** Create a project connected to that repo and deploy. Static site,
   no build command, output the repo root unless the structure says otherwise.
   Then actually fetch the deployed URL and confirm it returns the site rather
   than a build error — a green deploy status is not the same as a working page.

3. **Domain.** Ask what name they want if it has not been said, check
   availability and price, and present the options. On a clear go-ahead, buy it
   and attach it. If they already own it elsewhere, do not touch their DNS —
   produce the exact records they need to add, with names and values written out,
   and put that in the handover.

4. **The form.** Wire whatever can be wired. Most database and email providers
   need their login, so this usually means: set what you can, and write the rest
   into the handover with the values already filled in so it is paste, not
   thought.

5. **Analytics.** If reachable, create the project, put the key in, redeploy.
   Otherwise hand over the two lines to change.

6. **Point everything at the final address.** Canonical tags, Open Graph URLs,
   `sitemap.xml`, `robots.txt`. Search the repo for the placeholder domain to
   catch strays, then redeploy.

7. **Verify live.** Fetch each page, confirm 200. Confirm the files the `<head>`
   points at resolve on the live host, not just on disk. Submit a real enquiry
   through the live form and confirm it arrives.

## Traps

**Verify what a hosting project actually deploys before touching it.** Project
names lie. A project named after this business may be serving something else
entirely, and deleting it because the name looks redundant can take down a live
system. Check the connected repository, never the name.

**Do not create a second live copy.** If the site is already reachable somewhere
— an older host, a pages service left on from a test — the business now has two
addresses and will hand out whichever they last saw. Retire the old one, and do
it only once the replacement link is in their hands.

**Do not submit the sitemap until the domain resolves.** A sitemap pointing at
nothing teaches search engines the wrong thing.

**A domain bought today may not resolve for an hour or two.** Say so, rather than
letting them think it is broken.

## The handover

End with a report they can act on without asking a follow-up question. Four
parts, in this order:

**Live now.** The URLs, and what works at them today.

**Done for you.** What was actually created and changed. One line each.

**Your turn.** Numbered, ordered by what blocks what. Each item says where to go,
what to do, roughly how long it takes, and why it cannot be done for them. Fill
in every value they will need to paste — keys, records, addresses — so nothing
has to be looked up.

**Waiting on something.** Anything blocked on time or on an earlier step, with
what it is waiting for and what to do when it clears.

Write the numbers and values out in full. "Add the DNS record" is not an
instruction; a table with type, name and value is.
