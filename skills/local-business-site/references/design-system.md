# Design system

Everything is CSS custom properties. Change the tokens, the whole site changes.
Nothing hard-codes a colour outside the token block.

## Tokens

```css
:root {
  --container: 1180px;
  --gutter: 24px;

  --accent: #c2552d;        /* one colour that means "act" */
  --accent-soft: #e08a5f;
  --gold: #cf9b3f;          /* a second warm note, used rarely */

  --radius-sm: 10px;
  --radius: 16px;
  --radius-lg: 24px;

  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-body: "Inter", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-sub: "Instrument Sans", "Inter", Helvetica, Arial, sans-serif;

  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --shadow-soft: 0 24px 60px -30px rgba(20, 12, 6, 0.45);
  --nav-h: 76px;
}

.theme-light {
  --paper: #faf6f0;  --paper-2: #f2ebe1;  --surface: #ffffff;
  --ink: #14110e;    --muted: #6c6259;
  --line: rgba(20, 17, 14, 0.12);
  --accent-ink: #a8461f;   /* accent darkened enough to read as body text */
}

.theme-dark {
  --paper: #0c0b0a;  --paper-2: #131010;  --surface: #17130f;
  --ink: #f7f1e8;    --muted: #9c9086;
  --line: rgba(247, 241, 232, 0.14);
  --accent-ink: #e79063;
}
```

**Picking a palette for a new business.** Warm neutrals for paper rather than
pure white, and an ink that is nearly black but not `#000`. A true white and a
true black together look like an unstyled document. The accent should be the one
colour a customer would name if asked about the business.

`--accent-ink` exists because a brand accent bright enough for a button is
usually too light to read as text. Two variants, used in the right places.

## Type

Serif display against a sans body is doing most of the character work. Two
families is the budget; a third only for a specific job, such as story subheads
that would otherwise look like every other site under a serif headline.

Headings scale with `clamp()` so there are no phone-specific overrides:

```css
h1 { font-size: clamp(2.6rem, 6vw, 4.4rem); line-height: 1.04; letter-spacing: -0.02em; }
h2 { font-size: clamp(2rem, 4vw, 3rem); line-height: 1.1; }
p  { max-width: 62ch; }
```

That `max-width` on body text matters more than it looks. Full-width paragraphs
on a large monitor are genuinely hard to read.

## Section rhythm

Each section is a full-width band carrying its own theme class:

```html
<section class="section theme-light">…</section>
<section class="section theme-dark">…</section>
```

Alternating gives the page a pulse and makes it feel considered rather than
scrolled. Two adjacent sections with the same theme should have a visible
reason.

## The colour inheritance trap

This one is worth reading twice, because it is invisible until someone reports
that your logo disappears.

CSS `color` resolves to a literal value at the element that declares it.
Descendants inherit **that resolved colour**, not the `var()` expression. So if
`body` sets `color: var(--ink)` and a nav swaps its own theme class as it
scrolls, anything inside the nav that merely inherits colour keeps the value
resolved back on `body` — and vanishes against the opposite background.

The fix is to re-declare on any element whose theme can change independently:

```css
.nav          { color: var(--ink); }
.mobile-menu  { color: var(--ink); }
```

The rule to carry: **any element that changes theme independently of its
ancestors must re-declare `color`.** Check it by scrolling the nav over a dark
section and a light one and looking at the wordmark.

## Motion

Reveal-on-scroll via `IntersectionObserver`, with a stagger:

```html
<div data-reveal data-reveal-delay="2">
```

Keep it subtle — 12 to 20px of travel and a fade. Anything larger reads as a
slide deck.

**The reduced-motion mistake.** `prefers-reduced-motion` should quiet the
animation, not delete the content. Turning off transitions is right; hiding
elements that only become visible through an animation means a visitor with the
setting on sees an empty page. Test by emulating the setting, not by reasoning
about it — a real fraction of people browse this way and will never tell you the
site looked broken.

## Components worth having

- `.btn` / `.btn--primary` / `.btn--ghost` — one primary per screen
- `.card` — surface, hairline border, generous padding, lift on hover
- `.eyebrow` — small caps label above a heading, in `--muted`
- `.pill` — inline tag
- `.pick` — a checkbox styled as a tappable card, for the quote form
- `.hp` — the honeypot field, visually hidden, catches most spam for free

Hover states should lift rather than glow: a few pixels of `translateY` and a
deeper shadow. It reads as physical.

## Accessibility, non-negotiable

- Skip link as the first focusable element
- Visible focus rings — never `outline: none` without a replacement
- Real heading order, one `h1` per page
- Every form field labelled, with a live region for the submit status
- Decorative SVG gets `aria-hidden="true"`; meaningful SVG gets a `<title>`
- Contrast: 4.5:1 for body text. Check the pairs that actually ship, including
  `--muted` on `--paper-2`, which is where it usually fails
