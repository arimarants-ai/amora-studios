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
     THE STAGE

     The whole story is one pinned section holding one SVG world. Scrolling
     does not switch between scenes, it moves a camera through the world by
     rewriting the viewBox, and writes two numbers onto the stage that every
     moving part in the CSS reads.

       --t    0 to 1, how far through the story you are
       --day  0 at midnight, 1 at noon
     ====================================================================== */

  // Where the camera looks at each point in the story. x and y are the centre
  // of the shot in world units, w is how much of the world is in frame, so a
  // smaller w is a closer shot.
  var SHOTS = [
    { t: 0.0, x: 330, y: 545, w: 900 }, // the shop, at night
    { t: 0.13, x: 322, y: 520, w: 770 }, // push in on it
    { t: 0.27, x: 762, y: 468, w: 1000 }, // the empty inbox
    { t: 0.42, x: 1160, y: 458, w: 1000 }, // choosing the plan
    { t: 0.57, x: 1560, y: 456, w: 1040 }, // building it
    { t: 0.72, x: 1962, y: 460, w: 1000 }, // the work coming in
    { t: 0.88, x: 1480, y: 420, w: 1480 }, // pull back
    { t: 1.0, x: 620, y: 386, w: 1700 } // home again, in daylight
  ];

  var WORLD_H = 900;

  function shotAt(t) {
    if (t <= SHOTS[0].t) return SHOTS[0];
    if (t >= SHOTS[SHOTS.length - 1].t) return SHOTS[SHOTS.length - 1];

    for (var i = 0; i < SHOTS.length - 1; i++) {
      var a = SHOTS[i];
      var b = SHOTS[i + 1];
      if (t >= a.t && t <= b.t) {
        var u = ease((t - a.t) / (b.t - a.t));
        return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u) };
      }
    }
    return SHOTS[SHOTS.length - 1];
  }

  var stage = document.querySelector("[data-stage]");
  var world = document.querySelector("[data-world]");
  var scene = document.querySelector(".stage__scene");
  var progressBar = document.querySelector("[data-progress]");
  var rail = document.querySelector("[data-rail]");
  var railBtns = rail ? Array.prototype.slice.call(rail.querySelectorAll("button")) : [];

  var smoothT = 0;
  var viewportH = window.innerHeight;
  var ticking = false;

  function stageProgress() {
    if (!stage) return 0;
    var box = stage.getBoundingClientRect();
    var travel = stage.offsetHeight - viewportH;
    if (travel <= 0) return 0;
    return clamp(-box.top / travel, 0, 1);
  }

  function drawCamera(t) {
    if (!world || !scene) return;

    var cw = scene.clientWidth || 1;
    var chHeight = scene.clientHeight || 1;
    var aspect = chHeight / cw;

    var shot = shotAt(t);
    var w = shot.w;
    var h = w * aspect;

    // Never frame more than the painted world can fill.
    if (h > 1400) {
      h = 1400;
      w = h / aspect;
    }

    // Tall screens get the horizon lifted so the copy at the bottom is not
    // sitting on top of the scene.
    var cy = shot.y - (aspect > 1.2 ? 80 : 0);

    world.setAttribute("viewBox", (shot.x - w / 2).toFixed(1) + " " + (cy - h / 2).toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1));
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

      // Chase the target instead of jumping to it. This is what makes the
      // camera feel like a camera rather than a slider bolted to the wheel.
      smoothT = reduceMotion ? raw : lerp(smoothT, raw, 0.09);
      if (Math.abs(smoothT - raw) < 0.0002) smoothT = raw;

      var t = smoothT;
      stage.style.setProperty("--t", t.toFixed(4));
      stage.style.setProperty("--day", ease((t - 0.8) / 0.16).toFixed(4));

      drawCamera(t);

      if (railBtns.length) {
        var active = 0;
        for (var k = 0; k < railBtns.length; k++) {
          if (t >= parseFloat(railBtns[k].getAttribute("data-to")) - 0.06) active = k;
          railBtns[k].classList.remove("is-active");
        }
        railBtns[active].classList.add("is-active");
        stage.setAttribute("data-beat", String(active));
        rail.classList.toggle("is-visible", t > 0.02 && t < 0.995);
      }

      if (!reduceMotion && Math.abs(smoothT - raw) > 0.0002) request();
    }
  }

  function request() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  function measure() {
    viewportH = window.innerHeight;
  }

  // Rail dots scroll to the point in the story they represent.
  railBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!stage) return;
      var target = parseFloat(btn.getAttribute("data-to"));
      var travel = stage.offsetHeight - viewportH;
      var top = stage.offsetTop + travel * target;
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
    request();
  }

  // In reduced motion the stage is a plain stacked page, so the world is
  // shown once at full width rather than being flown through.
  if (reduceMotion && world) {
    world.setAttribute("viewBox", "40 60 2360 800");
    if (stage) {
      stage.style.setProperty("--t", "1");
      stage.style.setProperty("--day", "1");
    }
  }

  /* ------------------------------------------------- path length setup */

  // Any stroke that draws itself needs its own length, so read it from the
  // DOM once instead of guessing a dasharray per shape.
  var drawn = document.querySelectorAll(".sv-draw");
  for (var d = 0; d < drawn.length; d++) {
    var node = drawn[d];
    if (typeof node.getTotalLength === "function") {
      try {
        var len = node.getTotalLength();
        if (len) node.style.setProperty("--len", Math.ceil(len));
      } catch (err) {
        /* not rendered, the fallback length stays in place */
      }
    }
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
  var SUPABASE_URL = "";
  var SUPABASE_ANON_KEY = "";

  // Left empty on purpose. Fill it in and the form posts instead of opening
  // a mail app. See README.md.
  var FORM_ENDPOINT = "";

  // Assembled at runtime rather than written into the page, so the address is
  // never rendered as text and never sits in the markup for scrapers to lift.
  function inbox() {
    return ["arimarants", "gmail.com"].join("@");
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

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var services = data.getAll("services");
      var packages = data.getAll("package");

      var lines = [
        "Business name: " + (data.get("business") || ""),
        "Contact name: " + (data.get("name") || ""),
        "Email: " + (data.get("email") || ""),
        "Phone: " + (data.get("phone") || "not given"),
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
          page: window.location.pathname
        };

        fetch(SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/leads", {
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
            say("Thanks, that is with us. We will come back to you within one working day.", "ok");
          })
          .catch(function () {
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
            say("Thanks, that is with us. We will come back to you within one working day.", "ok");
          })
          .catch(function () {
            say("That did not send. Please try again, or email us using the button below.", "error");
          })
          .then(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
        return;
      }

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
