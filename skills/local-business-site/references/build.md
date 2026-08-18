# Build baseline

The parts that should be the same on every site, because they are correctness
rather than taste.

## Structure

Plain HTML, CSS and JS with no framework and no build step unless the project
genuinely needs one. The owner can open the files in a year and change a price
without a toolchain, and it deploys by copying a folder. Reach for a framework
when there is real application state, authentication, or content that changes
without a deploy — not by default.

```
index.html
<other pages>
404.html
robots.txt
sitemap.xml
assets/css/   base.css plus your stylesheet
assets/js/    site.js
assets/img/   favicon.svg, apple-touch-icon.png (180x180), og.png (1200x630)
```

Build the icons during the shell, not at the end. The `<head>` references all
three from the first page you write, and a missing `og:image` fails silently in
someone else's chat app rather than in your browser.

## Semantics

One `h1` per page, heading order without gaps, `<nav>`, `<main id="main">`,
`<footer>`. Buttons that do things are `<button>`; things that go somewhere are
`<a>`. Every form field has a real `<label>`, not a placeholder pretending to be
one — placeholders vanish when typing starts and are invisible to some screen
readers.

Decorative SVG gets `aria-hidden="true"`. Meaningful SVG gets a `<title>`.

## Responsive

Design at 380px first and let it grow. Almost every visitor to a local business
site is on a phone, often one-handed, often on bad signal.

- Tap targets at least 44px
- No horizontal scroll at any width. Wide things get their own `overflow-x`
- Type that scales with `clamp()` rather than a stack of breakpoint overrides
- Test at 380px by looking at it, not by resizing a desktop screenshot

## Keyboard and screen reader

- Skip link as the first focusable element
- Visible focus on everything focusable. Never `outline: none` without a
  replacement at least as visible
- The mobile menu opens and closes from the keyboard, Escape closes it, and
  focus returns to the toggle
- Form status messages live in an `aria-live` region so a screen reader
  announces the result of a submission

## Contrast

4.5:1 for body text, 3:1 for large text and meaningful UI edges. Check the pairs
that actually ship — muted text on a tinted panel is where it usually fails, not
the obvious black-on-white.

Verify by sampling rendered pixels or reading computed values. A script that
parses colour strings will silently mis-handle `oklab()` and `color()` and report
nonsense. When a contrast result surprises you, suspect the checker first.

## Motion

- Nothing important is conveyed by motion alone
- Never hijack the scroll. Ease the animation, not the visitor's input
- Hover effects need a non-hover equivalent, because phones have no hover
- Under `prefers-reduced-motion`, quiet the animation and **keep the content**.
  The classic failure is reusing the animation's `opacity: 0` and simply not
  animating it, which hands a blank page to exactly the visitors who most need
  it to work. `base.css` and `site.js` both handle this; if you write your own
  animation, handle it yourself
- Emulate the setting and look at the result. Do not reason about it

## Performance

Nothing here needs to be slow.

- Inline SVG rather than icon fonts or image requests
- Real dimensions on images so the page does not jump while loading
- `loading="lazy"` below the fold, never on the hero
- Self-host or preconnect web fonts, cap the families, and always give a real
  fallback stack — if the font host is blocked the page must still look
  deliberate
- No library for something CSS does

## Without JavaScript

Every page renders, every link works, all content is present. Only the form
needs JS, and it should degrade to something usable rather than a dead button.

## Verifying

Render it. Reading code does not catch what a browser does. Screenshot each page
at desktop and phone widths and actually look at them, emulate reduced motion,
tab through with the keyboard, and submit the form for real.
