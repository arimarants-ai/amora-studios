/* AMORA Studios — site behaviour.
   Vanilla JS, no dependencies. Everything degrades gracefully without it. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- utils */

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  // Smootherstep. Softens both ends of every scroll driven value so the
  // camera never starts or stops abruptly.
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* ==========================================================================
     ANALYTICS

     Fill in POSTHOG_KEY and the site starts reporting page views, plus a
     quote_submitted event whenever an enquiry goes through. Leave it empty
     and no analytics script is loaded and no requests are made. Deploy
     previews and local copies never report, see reporting() below.
     See README.md.
     ====================================================================== */

  // The project API key from PostHog, Settings → Project → Project API Key.
  // It is meant to be public and is safe in the page.
  var POSTHOG_KEY = "phc_rQDJPdLsoSVTZqUT3wVcdPDhKJpXcxyXCK4gdpqcCozD";

  // us.i.posthog.com or eu.i.posthog.com, whichever region the project is in.
  // Getting this wrong means events are sent somewhere that will not have them.
  var POSTHOG_HOST = "https://us.i.posthog.com";

  // Whether this copy of the site should report at all.
  //
  // The same files get served from more than one place: the real site, a Vercel
  // deploy preview for every branch, and whatever is running on a laptop. They
  // all carry this key, so without a check they all land in the same project and
  // the numbers stop meaning anything. A branch preview is not a visitor.
  //
  // Vercel names branch previews "<project>-git-<branch>-<scope>.vercel.app", so
  // "-git-" is the reliable tell. Production aliases never contain it.
  function reporting() {
    var host = window.location.hostname;
    if (!host) return false; // opened as a file:// path
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    if (host.indexOf("-git-") !== -1) return false; // a Vercel deploy preview
    return true;
  }

  // Reports an event if analytics is switched on, and quietly does nothing if
  // it is not. Everything else in this file calls this rather than posthog
  // directly, so the site behaves the same either way.
  function track(event, properties) {
    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(event, properties || {});
    }
  }

  if (POSTHOG_KEY && reporting()) {
    // PostHog's loader, which queues calls made before the script arrives.
    /* eslint-disable */
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    /* eslint-enable */
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true
    });
  }

  /* ------------------------------------------------------------ year stamp */

  var yearEls = document.querySelectorAll("[data-year]");
  for (var y = 0; y < yearEls.length; y++) {
    yearEls[y].textContent = String(new Date().getFullYear());
  }

  /* --------------------------------------------------------- mobile menu */

  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  var setMenu = function () {};

  if (toggle && menu) {
    setMenu = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* --------------------------------------------- reveal on scroll (static) */

  var revealEls = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    for (var r = 0; r < revealEls.length; r++) revealEls[r].classList.add("is-visible");
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    for (var r2 = 0; r2 < revealEls.length; r2++) revealObserver.observe(revealEls[r2]);
  }

  /* ------------------------------------------------------------ nav state */

  var nav = document.querySelector("[data-nav]");
  var themedSections = Array.prototype.slice.call(document.querySelectorAll("[data-nav-theme]"));

  function syncNavTheme() {
    if (!nav || !themedSections.length) return;
    var probe = (nav.offsetHeight || 76) * 0.6;
    var theme = null;

    for (var i = 0; i < themedSections.length; i++) {
      var box = themedSections[i].getBoundingClientRect();
      if (box.top <= probe && box.bottom > probe) {
        theme = themedSections[i].getAttribute("data-nav-theme");
      }
    }

    if (theme) {
      nav.classList.toggle("theme-dark", theme === "dark");
      nav.classList.toggle("theme-light", theme === "light");
      if (menu) {
        menu.classList.toggle("theme-dark", theme === "dark");
        menu.classList.toggle("theme-light", theme === "light");
      }
    }
  }

  /* ==========================================================================
     THE STAGE · Daybreak

     The landing story is one pinned frame and one night, 23:12 to 09:00.
     Scroll is the only clock: it grades the sky from espresso to cream,
     ticks the time, sketches a line drawing of the shop stroke by stroke,
     turns the drawing into a blueprint, pays the blueprint off in colour,
     arcs enquiries into the door, and walks the customers up. Everything
     runs off two numbers computed each frame:

       t  0 to 1, how far through the story you are
       q  0 to 1, how far through the current beat you are

     All of it is scrubbed, so scrolling backwards plays it in reverse.
     ====================================================================== */

  var stage = document.querySelector("[data-db-stage]");
  var progressBar = document.querySelector("[data-progress]");

  var smoothT = 0;
  var viewportH = window.innerHeight;
  var ticking = false;

  /* review helper: /?f=0.4 freezes the story at that position for design checks */
  var FREEZE = (function () {
    var m = window.location.search.match(/[?&]f=([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  })();

  function hexToRgb(h) {
    h = h.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mixRgb(a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  }
  function cssRgb(c) {
    return "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";
  }
  function cssRgba(c, a) {
    return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a + ")";
  }

  /* the night, as background keyframes over story progress */
  var SKY = [
    { p: 0.0, c: hexToRgb("#0c0a09") },
    { p: 0.42, c: hexToRgb("#140d12") },
    { p: 0.6, c: hexToRgb("#2b1428") },
    { p: 0.74, c: hexToRgb("#8a3d28") },
    { p: 0.85, c: hexToRgb("#e0a06c") },
    { p: 0.94, c: hexToRgb("#f6e3c8") },
    { p: 1.0, c: hexToRgb("#faf6f0") }
  ];
  var INK_NIGHT = hexToRgb("#f7f1e8");
  var INK_DAY = hexToRgb("#191410");
  var ACC_NIGHT = hexToRgb("#e08a5f");
  var ACC_DAY = hexToRgb("#a8461f");

  function skyAt(p) {
    if (p <= 0) return SKY[0].c;
    for (var i = 0; i < SKY.length - 1; i++) {
      if (p >= SKY[i].p && p <= SKY[i + 1].p) {
        return mixRgb(SKY[i].c, SKY[i + 1].c, (p - SKY[i].p) / (SKY[i + 1].p - SKY[i].p));
      }
    }
    return SKY[SKY.length - 1].c;
  }
  function luminance(c) {
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  }

  /* stage pieces (all optional so the file runs unchanged on other pages) */
  var beats = [], railBtns = [], strokes = [], arcPaths = [], arcLens = [], arcTips = [], arcPins = [], calloutEls = [];
  var pinEl, railEl, timeEl, dayLabelEl, clockEl, countEl, growLine, growFill, customersEl, signTextEl, openTextEl, fillEls;

  if (stage) {
    pinEl = stage.querySelector("[data-db-pin]");
    railEl = stage.querySelector("[data-db-rail]");
    railBtns = railEl ? Array.prototype.slice.call(railEl.querySelectorAll("button")) : [];
    beats = Array.prototype.slice.call(stage.querySelectorAll(".db-beat"));
    timeEl = stage.querySelector("[data-db-time]");
    dayLabelEl = stage.querySelector("[data-db-daylabel]");
    clockEl = stage.querySelector("[data-db-clock]");
    countEl = stage.querySelector("[data-db-count]");
    growLine = stage.querySelector("[data-db-growline]");
    growFill = stage.querySelector("[data-db-growfill]");
    customersEl = stage.querySelector("[data-db-customers]");
    signTextEl = stage.querySelector("[data-db-signtext]");
    openTextEl = stage.querySelector("[data-db-opentext]");
    calloutEls = Array.prototype.slice.call(stage.querySelectorAll(".db-callout"));
    fillEls = Array.prototype.slice.call(stage.querySelectorAll("[data-db-fill]"));

    /* measure every drawn stroke once so scroll can scrub its length */
    Array.prototype.forEach.call(stage.querySelectorAll(".db-street .draw"), function (p) {
      var len = 300;
      try { len = p.getTotalLength() + 2; } catch (err) { /* keep fallback */ }
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      strokes.push({ el: p, len: len });
    });
    strokes.forEach(function (s, i) { s.start = (i / strokes.length) * 0.72; });

    arcPaths = Array.prototype.slice.call(stage.querySelectorAll("[data-db-arc]"));
    arcTips = Array.prototype.slice.call(stage.querySelectorAll("[data-db-tip]"));
    arcPins = Array.prototype.slice.call(stage.querySelectorAll("[data-db-pinpop]"));
    arcLens = arcPaths.map(function (p) {
      var len = 800;
      try { len = p.getTotalLength() + 2; } catch (err) { /* keep fallback */ }
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      return len;
    });
  }

  /* where each beat begins, for the cumulative stage states */
  var BEAT_AT = [0, 0.13, 0.27, 0.41, 0.55, 0.69, 0.83];
  /* the story clock runs 23:12 to 09:00 */
  var CLOCK_FROM = 23 * 60 + 12;
  var CLOCK_TO = 33 * 60;

  function stageProgress() {
    if (FREEZE !== null) return FREEZE;
    var box = stage.getBoundingClientRect();
    var travel = stage.offsetHeight - viewportH;
    if (travel <= 0) return 0;
    return clamp(-box.top / travel, 0, 1);
  }

  function beatQ(i) {
    var b = beats[i];
    return clamp((smoothT - parseFloat(b.dataset.in)) / parseFloat(b.dataset.span), 0, 1);
  }

  function drawStage(t) {
    var s = stage.style;

    /* grade the world: sky, ink, accent, and the derived tints */
    var sky = skyAt(t);
    var flip = clamp((luminance(sky) - 0.52) / 0.14, 0, 1);
    var ink = mixRgb(INK_NIGHT, INK_DAY, flip);
    var acc = mixRgb(ACC_NIGHT, ACC_DAY, flip);
    s.setProperty("--db-bg", cssRgb(sky));
    s.setProperty("--db-ink", cssRgb(ink));
    s.setProperty("--db-acc", cssRgb(acc));
    s.setProperty("--db-muted", cssRgba(ink, 0.62));
    s.setProperty("--db-line", cssRgba(ink, 0.17));
    s.setProperty("--db-panel", cssRgba(ink, 0.055));
    s.setProperty("--db-art", cssRgba(ink, 0.5));
    s.setProperty("--db-stars", Math.max(0, 1 - t * 1.8).toFixed(3));
    s.setProperty("--db-suno", (clamp((t - 0.62) * 3.4, 0, 1) * 0.7).toFixed(3));
    s.setProperty("--db-suny", (60 - ease(clamp((t - 0.6) / 0.4, 0, 1)) * 130) + "vh");
    /* the warm glows only exist once their objects have been drawn */
    var drawn = clamp(((t + 0.07) / 0.26) * 1.5, 0, 1);
    s.setProperty("--db-winwarm", (Math.max(0, 1 - t * 1.7) * drawn).toFixed(3));
    s.setProperty("--db-lampwarm", (Math.max(0, 1 - t * 1.9) * drawn).toFixed(3));
    s.setProperty("--db-birds", clamp((t - 0.8) * 6, 0, 1).toFixed(3));
    s.setProperty("--db-cue", t > 0.03 ? 0 : 1);

    /* daylight also flips the fixed nav, via the section's declared theme */
    var isDay = flip > 0.5;
    stage.setAttribute("data-nav-theme", isDay ? "light" : "dark");
    stage.classList.toggle("theme-light", isDay);
    stage.classList.toggle("theme-dark", !isDay);

    /* the clock */
    if (timeEl) {
      var minutes = Math.round(lerp(CLOCK_FROM, CLOCK_TO, ease(t)));
      var hh = Math.floor(minutes / 60) % 24;
      var mm = minutes % 60;
      timeEl.textContent = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
      dayLabelEl.textContent = hh >= 23 || hh < 5 ? "tonight" : hh < 7 ? "first light" : hh < 9 ? "morning" : "open";
      clockEl.classList.toggle("is-open", t > 0.97);
    }

    /* hero and 01: the street sketches itself in as you scroll, and back out */
    var drawP = clamp((t + 0.07) / 0.26, 0, 1);
    strokes.forEach(function (st) {
      var pp = ease(clamp((drawP - st.start) / 0.28, 0, 1));
      st.el.style.strokeDashoffset = (st.len * (1 - pp)).toFixed(1);
    });
    var textIn = clamp((drawP - 0.8) / 0.2, 0, 1).toFixed(2);
    if (signTextEl) signTextEl.style.opacity = textIn;
    if (openTextEl) openTextEl.style.opacity = textIn;

    /* 02: the shop falls quiet */
    stage.classList.toggle("is-quiet", t >= BEAT_AT[2] && t < BEAT_AT[3]);

    /* 03: blueprint mode; callouts land as the plan rows tick */
    var inBlueprint = t >= BEAT_AT[3] && t < BEAT_AT[4];
    stage.classList.toggle("is-bp", inBlueprint);
    var q3 = beatQ(3);
    var CALL_AT = [0.25, 0.38, 0.51, 0.64, 0.77];
    calloutEls.forEach(function (c, k) {
      c.classList.toggle("on", inBlueprint && q3 >= CALL_AT[k]);
    });

    /* 04: the drawing earns its colour, scrubbed */
    var q4 = t >= BEAT_AT[4] ? beatQ(4) : 0;
    var FILLS = { awn: [0.1, 0.35, 0.9], sign: [0.3, 0.55, 0.85], door: [0.5, 0.75, 0.55], facade: [0.65, 0.95, 0.16] };
    fillEls.forEach(function (el) {
      var f = FILLS[el.getAttribute("data-db-fill")];
      if (f) el.style.opacity = (ease(clamp((q4 - f[0]) / (f[1] - f[0]), 0, 1)) * f[2]).toFixed(3);
    });

    /* 05: enquiries arc into the door, tips riding the paths */
    var q5 = t >= BEAT_AT[5] ? beatQ(5) : 0;
    var inArcs = t >= BEAT_AT[5] && t < 0.86;
    var arcsGroup = stage.querySelector("[data-db-arcs]");
    if (arcsGroup) arcsGroup.classList.toggle("gone", !inArcs);
    var ARC_AT = [0.05, 0.3, 0.55];
    arcPaths.forEach(function (p, k) {
      var ap = ease(clamp((q5 - ARC_AT[k]) / 0.3, 0, 1));
      p.style.strokeDashoffset = (arcLens[k] * (1 - ap)).toFixed(1);
      var tip = arcTips[k];
      if (ap > 0 && ap < 1) {
        try {
          var pt = p.getPointAtLength(ap * (arcLens[k] - 2));
          tip.setAttribute("cx", pt.x.toFixed(1));
          tip.setAttribute("cy", pt.y.toFixed(1));
          tip.style.opacity = 1;
        } catch (err) {
          tip.style.opacity = 0;
        }
      } else {
        tip.style.opacity = 0;
      }
    });
    arcPins.forEach(function (pinPop) {
      pinPop.classList.toggle("on", inArcs && q5 > 0.85);
    });

    /* 06: customers arrive with the morning, the month draws its line */
    var q6 = t >= BEAT_AT[6] ? beatQ(6) : 0;
    if (customersEl) {
      customersEl.style.opacity = ease(clamp(q6 * 2, 0, 1)).toFixed(3);
      customersEl.setAttribute("transform", "translate(" + ((1 - ease(clamp(q6 * 1.4, 0, 1))) * 46).toFixed(1) + " 0)");
    }
    if (growLine) {
      var gq = ease(clamp(q6 * 1.25, 0, 1));
      growLine.style.strokeDasharray = "1";
      growLine.style.strokeDashoffset = (1 - gq).toFixed(4);
      growFill.style.opacity = (gq * 0.1).toFixed(3);
    }

    /* beats swap in place; each moment keys off its beat's local progress */
    beats.forEach(function (b) {
      var tin = parseFloat(b.dataset.in);
      var span = parseFloat(b.dataset.span);
      var on = t >= tin && t < tin + span;
      b.classList.toggle("is-active", on);
      b.classList.toggle("is-past", t >= tin + span);
      var q = clamp((t - tin) / span, 0, 1);
      Array.prototype.forEach.call(b.querySelectorAll("[data-at]"), function (el) {
        el.classList.toggle("on", on ? q >= parseFloat(el.dataset.at) : t >= tin + span);
      });
      if (countEl && b.contains(countEl)) {
        countEl.textContent = Math.round(ease(clamp(q * 1.4, 0, 1)) * 7);
      }
    });

    for (var st2 = 1; st2 <= 6; st2++) {
      stage.classList.toggle("past-" + st2, t >= BEAT_AT[st2]);
    }

    if (railBtns.length) {
      var active = 0;
      for (var k2 = 0; k2 < railBtns.length; k2++) {
        if (t >= parseFloat(railBtns[k2].getAttribute("data-to")) - 0.07) active = k2;
        railBtns[k2].classList.remove("is-active");
      }
      railBtns[active].classList.add("is-active");
      railEl.classList.toggle("is-visible", t > 0.05 && t < 0.99);
    }
  }

  function frame() {
    ticking = false;

    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - viewportH;
    var pageProgress = scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0;
    if (progressBar) progressBar.style.setProperty("--progress", pageProgress.toFixed(4));

    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24);
    syncNavTheme();

    if (stage) {
      var raw = stageProgress();

      /* chase the target rather than jumping to it, so the grade and the
         drawing feel steadied rather than bolted to the wheel */
      smoothT = reduceMotion || document.hidden || FREEZE !== null ? raw : lerp(smoothT, raw, 0.11);
      if (Math.abs(smoothT - raw) < 0.0002) smoothT = raw;

      drawStage(smoothT);

      if (!reduceMotion && Math.abs(smoothT - raw) > 0.0002) request();
    }
  }

  function request() {
    if (document.hidden) { frame(); return; }
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  function measure() {
    viewportH = window.innerHeight;
  }

  /* rail dashes scroll to the point in the story they represent */
  railBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var travel = stage.offsetHeight - viewportH;
      var top = stage.offsetTop + travel * parseFloat(btn.getAttribute("data-to"));
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  if (stage || nav) {
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener(
      "resize",
      function () {
        measure();
        request();
      },
      { passive: true }
    );
    window.addEventListener("load", function () {
      measure();
      request();
    });
    measure();
    frame();
  }

  /* ==========================================================================
     THE QUOTE FORM

     Three ways to receive an enquiry, tried in this order:

       1. Supabase, if SUPABASE_URL and SUPABASE_ANON_KEY are filled in. The
          enquiry is written straight into the leads table.
       2. A form service (Formspree, Web3Forms, Basin), if FORM_ENDPOINT is set.
       3. Nothing configured, which is the default. The enquiry is assembled
          and handed to the visitor's mail app, addressed to us.

     So the form works with no backend at all, and gets better as you set
     each one up. See README.md.
     ====================================================================== */

  // The anon key is meant to be public and is safe in the page. What keeps
  // the table safe is the row level security policy in supabase/schema.sql,
  // which allows inserts and nothing else. Never put the service_role key
  // here, it bypasses those policies.
  // The project URL, not the REST endpoint. The /rest/v1/ part is added below,
  // and pasting the longer form by mistake is tidied up rather than broken.
  var SUPABASE_URL = "https://ithvjbdrryykcsewohhf.supabase.co";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aHZqYmRycnl5a2NzZXdvaGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTgxMTIsImV4cCI6MjEwMDEzNDExMn0.70NHqM_hp7lqJMqaF2MTcMSjbbKkS3MOGrqKJS2Jklk";

  // Left empty on purpose. Fill it in and the form posts instead of opening
  // a mail app. See README.md.
  var FORM_ENDPOINT = "";

  // Assembled at runtime rather than written into the page, so the address is
  // never rendered as text and never sits in the markup for scrapers to lift.
  function inbox() {
    return ["hello", "amorastudios.net"].join("@");
  }

  var form = document.querySelector("[data-quote-form]");

  if (form) {
    var status = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector("[type='submit']");

    var say = function (message, kind) {
      if (!status) return;
      status.textContent = message;
      status.className = "form__status is-" + kind;
    };

    // The phone number is optional until someone asks to be called, at which
    // point it is the only way to keep the promise the auto-reply makes.
    var phoneField = form.querySelector("[name='phone']");
    var prefInputs = Array.prototype.slice.call(form.querySelectorAll("[name='contact_pref']"));

    var syncPhoneRequirement = function () {
      if (!phoneField || !prefInputs.length) return;
      var wantsCall = prefInputs.some(function (input) {
        return input.checked && input.value === "phone";
      });
      phoneField.required = wantsCall;

      // The label has to agree with the field, or the form contradicts itself.
      var hint = form.querySelector("[data-phone-optional]");
      if (hint) hint.textContent = wantsCall ? "(required)" : "(optional)";

      phoneField.setCustomValidity(
        wantsCall && !phoneField.value.trim()
          ? "Add a number, or choose email instead."
          : ""
      );
    };

    prefInputs.forEach(function (input) {
      input.addEventListener("change", syncPhoneRequirement);
    });
    if (phoneField) phoneField.addEventListener("input", syncPhoneRequirement);
    syncPhoneRequirement();

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      syncPhoneRequirement();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var services = data.getAll("services");
      var packages = data.getAll("package");

      // Deliberately no name, email, phone, or message. Analytics needs the
      // shape of the enquiry, not the person's details.
      var enquiryShape = function (method) {
        return {
          method: method,
          package: packages.length ? packages.join(", ") : "none",
          service_count: services.length,
          services: services.join(", "),
          has_message: Boolean((data.get("message") || "").toString().trim())
        };
      };

      // The spam trap is invisible to people, so anything in it came from a bot.
      // Show the normal thank you rather than an error, otherwise the bot just
      // tries again with the field left blank.
      if ((data.get("website") || "").toString().trim()) {
        form.reset();
        say("Thanks, that is with us. We will come back to you within one working day.", "ok");
        return;
      }

      var lines = [
        "Business name: " + (data.get("business") || ""),
        "Contact name: " + (data.get("name") || ""),
        "Email: " + (data.get("email") || ""),
        "Phone: " + (data.get("phone") || "not given"),
        "Prefers: " + (data.get("contact_pref") === "phone" ? "a call" : "email"),
        "",
        "Package interested in:",
        packages.length ? packages.map(function (p) { return "  - " + p; }).join("\n") : "  - none picked",
        "",
        "Services interested in:",
        services.length ? services.map(function (s) { return "  - " + s; }).join("\n") : "  - not sure yet",
        "",
        "About the business:",
        (data.get("message") || "").toString().trim() || "  (nothing added)"
      ];

      var body = lines.join("\n");
      var subject = "Quote request from " + (data.get("business") || data.get("name") || "a small business");

      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        if (submitBtn) submitBtn.disabled = true;
        say("Sending...", "pending");

        var lead = {
          business: (data.get("business") || "").toString().trim(),
          name: (data.get("name") || "").toString().trim(),
          email: (data.get("email") || "").toString().trim(),
          phone: (data.get("phone") || "").toString().trim() || null,
          package: packages,
          services: services,
          message: (data.get("message") || "").toString().trim() || null,
          contact_pref: (data.get("contact_pref") || "").toString().trim() || null,
          page: window.location.pathname
        };

        fetch(SUPABASE_URL.replace(/\/+$/, "").replace(/\/rest\/v1$/, "") + "/rest/v1/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: "Bearer " + SUPABASE_ANON_KEY,
            // Nothing is read back, so the anon role never needs select rights.
            Prefer: "return=minimal"
          },
          body: JSON.stringify(lead)
        })
          .then(function (res) {
            if (!res.ok) throw new Error("bad status");
            form.reset();
            track("quote_submitted", enquiryShape("supabase"));
            say("Thanks, that is with us. We will come back to you within one working day.", "ok");
          })
          .catch(function () {
            track("quote_failed", enquiryShape("supabase"));
            say("That did not send. Please try again, or email us using the button below.", "error");
          })
          .then(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
        return;
      }

      if (FORM_ENDPOINT) {
        if (submitBtn) submitBtn.disabled = true;
        say("Sending...", "pending");

        data.append("subject", subject);
        data.append("summary", body);

        fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (res) {
            if (!res.ok) throw new Error("bad status");
            form.reset();
            track("quote_submitted", enquiryShape("form_endpoint"));
            say("Thanks, that is with us. We will come back to you within one working day.", "ok");
          })
          .catch(function () {
            track("quote_failed", enquiryShape("form_endpoint"));
            say("That did not send. Please try again, or email us using the button below.", "error");
          })
          .then(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
        return;
      }

      track("quote_submitted", enquiryShape("mailto"));

      window.location.href =
        "mailto:" + inbox() + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

      say("Your email app should be opening with everything filled in. Send it and we will reply within one working day.", "ok");
    });
  }

  // Plain "email us" links elsewhere on the page get their address at runtime
  // for the same reason.
  var mailLinks = document.querySelectorAll("[data-mailto]");
  for (var m = 0; m < mailLinks.length; m++) {
    var subj = mailLinks[m].getAttribute("data-mailto") || "Hello AMORA";
    mailLinks[m].setAttribute("href", "mailto:" + inbox() + "?subject=" + encodeURIComponent(subj));
  }
})();
