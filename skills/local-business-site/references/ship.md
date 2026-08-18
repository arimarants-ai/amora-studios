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
this conversation can see. Making a repository public. Switching a domain that
currently serves a working site. Buying a domain, in the rare case you have been
asked to.

**Never do at all:** change DNS on a domain you were given access to as a
convenience. The domain is usually the client's, it usually carries their email,
and a wrong record there breaks a business function that has nothing to do with
the website. Produce instructions and let the owner make the change, even when
you technically could do it yourself.

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

3. **Domain.** See the section below. Usually the client owns it and you do
   not have access, so your job is producing instructions, not making changes.

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

## The domain belongs to the client

This is the normal case: the client pays for the domain and it sits in their
registrar account, which you cannot log into. So the deliverable is not a
connected domain, it is **a set of instructions precise enough that a
non-technical person can follow them without calling you.**

Work out which situation you are in first, because they need different things.

**They already own it and nothing is on it.** The simplest case. Add the domain
to the hosting project, read off the records the platform asks for, and send them
to the client to add at their registrar.

**They already own it and a website is on it.** There is a live site to replace,
so this is a cutover, not a setup. Get the new site verified on its hosting URL
first, agree a moment to switch, and ask the client to lower the TTL on the
existing records a day beforehand so the change propagates in minutes rather than
hours. Do not switch on a Friday.

**They already own it and email runs on it.** The dangerous one. Read the
warning below before writing a single instruction.

**They have not bought it yet.** Tell them what to buy and where, then wait. Do
not buy it on their behalf unless they explicitly ask — a domain in your account
that the client paid for is a problem the first time either of you wants to walk
away.

### Never tell anyone to replace all their records

A domain carries more than a website. `MX` records route the business's email,
and `TXT` records carry the SPF, DKIM and verification entries that stop that
mail landing in spam. An instruction like "delete the existing records and add
these" will take down the client's email, they will not connect it to the website
change, and you will spend a day working out why.

Only ever add or change the specific records the website needs — typically the
apex `A` record and the `www` `CNAME`. Say explicitly, in the instructions, that
everything else stays exactly as it is.

The same reasoning rules out moving their nameservers to your hosting provider.
It is technically tidier and it hands DNS for their entire business, email
included, to a provider chosen for the website. Only do that on a domain that
does nothing else, and only with the client's informed agreement.

### Getting the values right

Add the domain to the hosting project first, then **read the exact records that
project tells you to use** and pass those on. Do not write DNS values from
memory or from an old project — providers change target hostnames and IPs, and a
stale value produces a site that looks broken for reasons nothing will explain.

Two details that trip people up at particular registrars:

- Some registrars do not allow a `CNAME` at the apex. They expose `ALIAS`,
  `ANAME` or a redirect feature instead — check what the client's registrar
  offers before telling them to do something it cannot do.
- Registrars differ on whether the host field wants `@`, blank, or the full
  domain, and whether they append the domain to whatever you type. Say what the
  record should end up as, so a wrong field is obvious.

Expect the domain to be added in a pending or invalid state until the records
propagate. That is normal, it usually clears within the hour, and it is worth
saying so or the client will think something failed.

### Write the client's instructions as something forwardable

The person doing this is not the person you are talking to. Produce a block that
can be pasted into an email or a message with no editing: where to log in, what
to click, a table of records, and what they should see when it worked.

> **What to do at your domain provider**
>
> Log in to wherever `example.com` was bought, and open the DNS settings — often
> called DNS, Advanced DNS, or Name Server management.
>
> Add these two records. Leave every other record exactly as it is; your email
> depends on them.
>
> | Type | Name | Value | TTL |
> | --- | --- | --- | --- |
> | A | @ | `<value from the hosting project>` | automatic |
> | CNAME | www | `<value from the hosting project>` | automatic |
>
> If a record of the same type and name already exists, change its value rather
> than adding a second one.
>
> Save, then tell me it is done. The site usually appears within an hour, and can
> take a few hours. Nothing else needs to change.

Follow up rather than assuming it happened. Check whether the domain resolves,
and if it has not moved in a day, ask what they see on their side — the usual
answers are that it was saved on the wrong domain, or added as a subdomain
because the registrar appended the domain to a field that already contained it.

### After it resolves

Only then: point the canonical tags, Open Graph URLs, `sitemap.xml` and
`robots.txt` at the real domain, redeploy, and confirm the live pages load over
`https` on both the apex and `www`. Certificates are issued automatically once
DNS is correct, but they are issued after, not before.

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

**For the client.** Separate, and written for someone who is not technical and
does not know what a CNAME is. Anything living in an account you do not control
— the domain, a payment provider, a booking system — goes here, formatted so it
can be forwarded with no editing. Keep it apart from the section above: mixing
what the operator does with what the client does is how items get dropped by
both.

**Waiting on something.** Anything blocked on time or on an earlier step, with
what it is waiting for and what to do when it clears.

Write the numbers and values out in full. "Add the DNS record" is not an
instruction; a table with type, name and value is.
