// Tests for the auto-reply placeholder logic.
//
//   node --experimental-strip-types --test supabase/functions/notify-lead/
//
// The helper is pure on purpose, so none of this needs a network, a database,
// or a running function.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildAutoReply,
  firstNameComma,
  resolvePref,
  isSendableEmail,
  escapeHtml,
  HTML_TEMPLATE,
  TEXT_TEMPLATE,
  AUTO_REPLY_SUBJECT
} from "./autoreply.ts";

const base = { name: "Marcus Webb", email: "marcus@example.com" };

/* -------------------------------------------------- contact preference --- */

test("email preference promises an email", () => {
  const r = buildAutoReply({ ...base, contactPref: "email" });
  assert.equal(r.pref, "email");
  assert.match(r.html, /will email it to you within one business day/);
  assert.match(r.html, /Ari emails you the quote\./);
  assert.match(r.text, /Ari emails you the quote\./);
  assert.doesNotMatch(r.html, /calls you/);
});

test("phone preference promises a call, when there is a number to call", () => {
  const r = buildAutoReply({ ...base, contactPref: "phone", phone: "218 555 0142" });
  assert.equal(r.pref, "phone");
  assert.match(r.html, /will call you within one business day/);
  assert.match(r.html, /Ari calls you with the quote\./);
  assert.match(r.html, /He&rsquo;ll send it in writing/);
  assert.match(r.text, /He’ll send it in writing/);
});

test("missing preference falls back to email or call", () => {
  const r = buildAutoReply({ ...base });
  assert.equal(r.pref, "unknown");
  assert.match(r.html, /will email or call you within one business day/);
  assert.match(r.html, /Ari emails or calls you with the quote\./);
});

test("unrecognised preference falls back rather than guessing", () => {
  for (const junk of ["carrier pigeon", "EMAIL ", "", null, undefined, 7, {}]) {
    const r = buildAutoReply({ ...base, contactPref: junk as unknown });
    if (junk === "EMAIL ") {
      assert.equal(r.pref, "email", "case and whitespace are tolerated");
      continue;
    }
    assert.equal(r.pref, "unknown", `expected fallback for ${JSON.stringify(junk)}`);
  }
});

test("phone preference with no number never promises a call", () => {
  for (const phone of [undefined, null, "", "   "]) {
    const r = buildAutoReply({ ...base, contactPref: "phone", phone });
    assert.equal(r.pref, "unknown");
    assert.doesNotMatch(r.html, /Ari calls you/);
    assert.doesNotMatch(r.text, /Ari calls you/);
    assert.match(r.html, /Ari emails or calls you with the quote\./);
  }
});

/* -------------------------------------------------------------- names --- */

test("a name becomes a leading comma and the first word only", () => {
  const r = buildAutoReply({ ...base, name: "  Marcus  Webb " });
  assert.match(r.html, /Thanks, Marcus/);
  assert.match(r.text, /Thanks, Marcus/);
});

test("no name leaves the greeting clean, with no stray comma", () => {
  for (const name of [undefined, null, "", "   "]) {
    const r = buildAutoReply({ ...base, name });
    assert.match(r.text, /Thanks — we've got it\./);
    assert.doesNotMatch(r.text, /Thanks,/);
  }
});

test("a name containing HTML is escaped in the html and left literal in text", () => {
  const r = buildAutoReply({ ...base, name: '<script>alert("x")</script>' });
  assert.doesNotMatch(r.html, /<script>/);
  assert.match(r.html, /&lt;script&gt;/);
  assert.match(r.text, /<script>/, "the text part is not markup, so it is not escaped");
});

test("a very long name is capped", () => {
  const r = buildAutoReply({ ...base, name: "a".repeat(200) });
  assert.match(r.html, /Thanks, a{40}[^a]/);
});

test("firstNameComma directly", () => {
  assert.equal(firstNameComma("Marcus Webb", true), ", Marcus");
  assert.equal(firstNameComma("  ", true), "");
  assert.equal(firstNameComma("Ari & Co", true), ", Ari");
  assert.equal(firstNameComma("<b>", true), ", &lt;b&gt;");
  assert.equal(firstNameComma("<b>", false), ", <b>");
});

/* ------------------------------------------------------------ hygiene --- */

test("no placeholder survives in either part, for any preference", () => {
  for (const contactPref of ["email", "phone", "nonsense", undefined]) {
    const r = buildAutoReply({ ...base, contactPref, phone: "555" });
    assert.equal(r.html.match(/\{\{[A-Z0-9_]+\}\}/g), null, `html, pref=${contactPref}`);
    assert.equal(r.text.match(/\{\{[A-Z0-9_]+\}\}/g), null, `text, pref=${contactPref}`);
  }
});

test("html entities never leak into the plain text part", () => {
  for (const contactPref of ["email", "phone", undefined]) {
    const r = buildAutoReply({ ...base, contactPref, phone: "555" });
    assert.doesNotMatch(r.text, /&mdash;|&rsquo;|&amp;|&quot;|&#39;/);
  }
});

test("the subject is exactly what was asked for", () => {
  assert.equal(AUTO_REPLY_SUBJECT, "We’ve got your request — AMORA Studios");
});

test("escapeHtml covers the five characters that matter", () => {
  assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

/* ------------------------------------------------------ address check --- */

test("obviously invalid addresses are rejected, ordinary ones are not", () => {
  for (const good of ["a@b.co", "marcus.webb+quote@example.co.uk", "x@y.z.dev"]) {
    assert.ok(isSendableEmail(good), good);
  }
  for (const bad of ["", "   ", "marcus", "marcus@", "@example.com", "a b@c.com",
                     "marcus@example", "two@@example.com", null, undefined]) {
    assert.ok(!isSendableEmail(bad as string), JSON.stringify(bad));
  }
});

/* --------------------------------------------------------------- drift --- */

test("the embedded templates still match the files in emails/", () => {
  const here = new URL(".", import.meta.url).pathname;
  const root = here + "../../../";
  assert.equal(
    HTML_TEMPLATE,
    readFileSync(root + "emails/quote-confirmation.html", "utf8"),
    "emails/quote-confirmation.html changed — regenerate the copy in autoreply.ts"
  );
  assert.equal(
    TEXT_TEMPLATE,
    readFileSync(root + "emails/quote-confirmation.txt", "utf8"),
    "emails/quote-confirmation.txt changed — regenerate the copy in autoreply.ts"
  );
});
