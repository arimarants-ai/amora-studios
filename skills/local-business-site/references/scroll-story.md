# The scroll story

**Read this only if a scroll story was actually asked for.** The default
homepage is plain sections — see `SKILL.md` step 2. This is the expensive
option, and building it unrequested burns hours and hands the business a
homepage it may not want.


The homepage is **one** animation. There are no separate scenes handing off to
each other, because scenes that hand off always seam. One pinned section holds
one SVG world about two and a half screens wide, and scrolling moves a camera
through it.

Understanding that is the whole trick. Everything else follows.

## How it works

The world is painted once, in daylight, containing the entire story laid out
left to right. Night is a single dark sheet laid over the top, faded by a
number. Nothing is added or removed during the scroll — the camera just looks
at different parts of a picture that already exists.

`main.js` measures how far through the pinned section the visitor is, eases it,
and does two things:

| | |
| --- | --- |
| Writes `--t` and `--day` onto the stage | `--t` runs 0 to 1 across the story, `--day` runs 0 at midnight to 1 at noon. Every moving part in the CSS reads these, so nothing can drift out of sync |
| Rewrites the SVG `viewBox` | This is the camera. `SHOTS` lists where it looks, as a centre point and a width in world units. Smaller width, closer shot |

Because both come from one number, the artwork, the copy, and the lighting can
never disagree.

## Authoring the world

Lay the story out horizontally in one `<svg>` with a wide coordinate space —
roughly 2400 wide by 900 tall works. Left to right, in story order. Give
everything world coordinates and never think in screen pixels.

A useful set of props for a local business: a shopfront, a phone, an empty
inbox, a plan being ticked, a site being built, enquiries arriving.

Draw with flat shapes and a limited palette drawn from the tokens. Keep it
geometric and confident rather than illustrative — hand-drawn-looking curves
read as amateur at large sizes, and a business is paying for this. Fill shapes
rather than outlining them; outlined artwork reads as a wireframe.

Individual elements fade with their own window:

```html
<g style="--in: 0.30; --out: 0.52">…</g>
```

Text inside the SVG should be minimal — labels only. Real copy rides alongside
in HTML so it stays selectable, sharp, and readable by screen readers.

## The storyboard

```js
var SHOTS = [
  { t: 0.0,  x: 330,  y: 545, w: 900 },  // the shop, at night
  { t: 0.13, x: 322,  y: 520, w: 770 },  // push in
  { t: 0.27, x: 762,  y: 468, w: 1000 }, // the empty inbox
  { t: 0.42, x: 1160, y: 458, w: 1000 }, // choosing the plan
  { t: 0.57, x: 1560, y: 456, w: 1040 }, // building it
  { t: 0.72, x: 1962, y: 460, w: 1000 }, // work coming in
  { t: 0.88, x: 1480, y: 420, w: 1480 }, // pull back
  { t: 1.0,  x: 620,  y: 386, w: 1700 }  // home again, in daylight
];
```

Vary the shot sizes. A sequence of identically framed shots is monotonous in
film and monotonous here. Push in for intimacy, pull back to show consequence.
Ending wide, in daylight, on where you started is a resolution the viewer feels
without being able to name.

## The beats

Copy rides in HTML alongside the SVG. Each `.beat` declares when it is on
screen, and the CSS works out its own fade and drift from `--t`:

```html
<article class="beat" style="--in: 0.24; --span: 0.16">
  <h2>Then we build it and run it.</h2>
  <p>…</p>
</article>
```

Give beats a little overlap. Copy that appears exactly as the previous line
leaves feels mechanical; a slight cross-fade feels edited.

## Tuning the feel

| Change | Effect |
| --- | --- |
| `SHOTS` in `main.js` | The storyboard. Move a centre point, change a width to push in or pull back |
| `.stage { height: 780vh }` | How much scrolling the story takes. Taller is slower |
| The `0.09` in the `lerp` call | Smoothing. Lower is floatier, higher is tighter to the wheel |
| `--in` / `--out` on any SVG element | When it fades in and out, on the same 0 to 1 scale |

**Never hijack the scroll.** Only the animation is eased; the page scrolls at
exactly the rate the visitor's input says. Scroll-jacking is the fastest way to
make a site feel broken to someone who cannot articulate why.

## Reduced motion

Under `prefers-reduced-motion`, switch the camera off and show the world once at
full width, with the beats becoming a normal stacked page read top to bottom.

The content must all still be there. It is tempting to reuse the animation's
opacity rules and simply not animate them — that leaves everything at zero
opacity and hands a blank page to exactly the visitors who most need it to work.
Emulate the setting and look at the result before you believe it.

## Without JavaScript

The world renders as a static scene at its natural size, the beats stack, every
link works. Only the form needs JS. Nothing is inserted by script that the page
needs in order to make sense.
