/* ==========================================================================
   site.js

   Behaviour only. Everything here toggles a class or sends a request; none of
   it decides how anything looks. Style the classes yourself.

   Nothing is required. Each block checks for its own markup and does nothing
   if the page does not use it, so one file serves every page.

     [data-reveal]        fades in when scrolled into view
     [data-nav]           gets .is-stuck once the page is scrolled
     [data-nav-theme]     sections that tell the nav which theme it is over
     [data-menu-toggle]   opens [data-menu]
     [data-year]          filled with the current year
     [data-form]          submitted in the background, with fallbacks
     [data-form-status]   where the result message is written
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ====================================================================== */
  /* CONFIGURE                                                              */
  /* ====================================================================== */

  // Where enquiries go. Fill in whichever one you are using; the form tries
  // them in this order and falls back to the visitor's mail app. See
  // references/forms-and-leads.md.
  var SUPABASE_URL = "";
  var SUPABASE_ANON_KEY = "";
  var FORM_ENDPOINT = "";

  // Assembled at runtime so ordinary address scrapers, which read the HTML for
  // mailto: links, do not find it. Change the two halves.
  function inbox() {
    return ["hello", "example.com"].join("@");
  }

  // Analytics. Leave the key empty and no script loads and no requests are made.
  var POSTHOG_KEY = "";
  var POSTHOG_HOST = "https://us.i.posthog.com";

  /* ====================================================================== */
  /* ANALYTICS                                                              */
  /* ====================================================================== */

  // Every copy of a site carries the same key: the real site, a deploy preview
  // per branch, a laptop. Without this check they all land in one project and
  // the numbers stop meaning anything. A preview is not a visitor.
  function reporting() {
    var host = window.location.hostname;
    if (!host) return false;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    if (host.indexOf("-git-") !== -1) return false;
    return true;
  }

  if (POSTHOG_KEY && reporting()) {
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

  function track(event, properties) {
    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(event, properties || {});
    }
  }

  /* ====================================================================== */
  /* REVEAL ON SCROLL                                                       */
  /* ====================================================================== */

  var revealEls = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    // No observer, or the visitor asked for less motion. Either way they get
    // the whole page immediately rather than a page that never appears.
    for (var r = 0; r < revealEls.length; r++) revealEls[r].classList.add("is-visible");
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });

    for (var r2 = 0; r2 < revealEls.length; r2++) revealObserver.observe(revealEls[r2]);
  }

  /* ====================================================================== */
  /* NAV                                                                    */
  /* ====================================================================== */

  var nav = document.querySelector("[data-nav]");
  var themed = Array.prototype.slice.call(document.querySelectorAll("[data-nav-theme]"));

  // If the nav sits over sections of different themes, it swaps its own class
  // as it passes over them.
  //
  // Whatever you do in your CSS, re-declare `color` on the nav itself. CSS
  // resolves `color` to a literal at the element that declares it, so anything
  // inside the nav that only inherits keeps the value resolved back on body and
  // disappears against the opposite background. It is invisible until someone
  // reports that the logo vanishes half way down the page.
  function syncNavTheme() {
    if (!nav || !themed.length) return;
    var probe = (nav.offsetHeight || 72) * 0.6;
    var theme = null;
    for (var i = 0; i < themed.length; i++) {
      var box = themed[i].getBoundingClientRect();
      if (box.top <= probe && box.bottom > probe) theme = themed[i].getAttribute("data-nav-theme");
    }
    if (!theme) return;
    nav.setAttribute("data-theme", theme);
    if (menu) menu.setAttribute("data-theme", theme);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24);
      syncNavTheme();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ====================================================================== */
  /* MOBILE MENU                                                            */
  /* ====================================================================== */

  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");

  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("is-menu-open", open);
    };

    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });

    setMenu(false);
  }

  /* ====================================================================== */
  /* YEAR                                                                   */
  /* ====================================================================== */

  var years = document.querySelectorAll("[data-year]");
  for (var y = 0; y < years.length; y++) {
    years[y].textContent = String(new Date().getFullYear());
  }

  /* ====================================================================== */
  /* THE FORM                                                               */
  /* ====================================================================== */

  var form = document.querySelector("[data-form]");
  var status = document.querySelector("[data-form-status]");

  function say(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle("is-error", ok === false);
    status.classList.toggle("is-ok", ok === true);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);

      // Honeypot. A hidden field a person never sees and a bot fills in. Tell
      // the bot it worked so it does not come back and try something cleverer.
      if ((data.get("website") || "").toString().trim() !== "") {
        say("Thanks, that is with us.", true);
        form.reset();
        return;
      }

      var payload = {};
      data.forEach(function (v, k) {
        if (k === "website") return;
        if (payload[k] === undefined) payload[k] = v;
        else payload[k] = [].concat(payload[k], v).join(", ");
      });

      // The shape of the enquiry, never its contents. Names, emails, phone
      // numbers and message text belong in wherever you store leads, not in
      // analytics, which is for counting.
      var shape = {
        fields: Object.keys(payload).length,
        has_message: !!(payload.message && payload.message.length > 3)
      };

      var btn = form.querySelector("[type=submit]");
      if (btn) btn.disabled = true;
      say("Sending...");

      done(payload, shape, btn);
    });
  }

  function done(payload, shape, btn) {
    var reenable = function () { if (btn) btn.disabled = false; };

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      var base = SUPABASE_URL.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
      fetch(base + "/rest/v1/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        say("Thanks, that is with us. We will come back to you shortly.", true);
        track("enquiry_submitted", Object.assign({ method: "supabase" }, shape));
        form.reset();
      }).catch(function (err) {
        track("enquiry_failed", Object.assign({ method: "supabase", error: String(err.message || err) }, shape));
        mailto(payload, shape);
      }).finally(reenable);
      return;
    }

    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        say("Thanks, that is with us. We will come back to you shortly.", true);
        track("enquiry_submitted", Object.assign({ method: "form_endpoint" }, shape));
        form.reset();
      }).catch(function (err) {
        track("enquiry_failed", Object.assign({ method: "form_endpoint", error: String(err.message || err) }, shape));
        mailto(payload, shape);
      }).finally(reenable);
      return;
    }

    mailto(payload, shape);
    reenable();
  }

  // The zero setup fallback, and a real one. It opens the visitor's mail app
  // with the whole enquiry already written and addressed, so the owner gets one
  // tidy email rather than a vague "hi, interested".
  function mailto(payload, shape) {
    var lines = [];
    Object.keys(payload).forEach(function (k) {
      lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ": " + payload[k]);
    });
    var href = "mailto:" + inbox() +
      "?subject=" + encodeURIComponent("Enquiry from the website") +
      "&body=" + encodeURIComponent(lines.join("\n"));
    window.location.href = href;
    say("Your email app should be opening with everything filled in. Send it and we will reply shortly.", true);
    track("enquiry_submitted", Object.assign({ method: "mailto" }, shape));
  }
})();
