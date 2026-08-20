// Builds the auto-reply that goes to whoever submitted the quote form.
//
// Everything here is pure: strings in, strings out, no network, no Deno APIs.
// That is deliberate. It means the placeholder logic can be tested on its own
// (see autoreply.test.ts) and it means nothing in this file can throw in a way
// that reaches the notification email, which must always send.
//
// The two templates below are embedded copies of emails/quote-confirmation.html
// and emails/quote-confirmation.txt. They are embedded rather than read from
// disk because this runs as a Supabase edge function, where there is no
// project filesystem to read from at request time. A test asserts the copies
// still match the files, so the two cannot drift apart unnoticed.

export const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Thanks — we've got your request</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  /* Client resets */
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; line-height:100%; outline:none; text-decoration:none; }
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  a { color:#0a0908; }

  /* Mobile */
  @media screen and (max-width:620px) {
    .wrap { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:26px !important; line-height:34px !important; }
    .wordmark { font-size:17px !important; letter-spacing:3px !important; }
    .stepnum { width:34px !important; }
    .logo { width:140px !important; height:130px !important; }
  }

  /* Dark mode: keep the paper panel readable rather than letting clients invert it badly */
  @media (prefers-color-scheme: dark) {
    .bg-outer { background:#000000 !important; }
    .paper { background:#141312 !important; }
    .t-ink { color:#f7f6f4 !important; }
    .t-muted { color:#a8a29b !important; }
    .rule { border-color:#2a2724 !important; }
    .callout { background:#1c1a18 !important; border-color:#33302c !important; border-left-color:#c9a15a !important; }
    .gold { color:#c9a15a !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:#e9e7e3;">

<!-- Preview text -->
<div style="display:none; font-size:1px; color:#e9e7e3; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
  {{PREHEADER}}
  &#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;
</div>

<table role="presentation" class="bg-outer" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e9e7e3;">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

        <!-- ══ HEADER ══ -->
        <tr>
          <td class="px" bgcolor="#0a0908" align="center" style="background:#0a0908; padding:36px 44px 32px 44px; border-radius:4px 4px 0 0;">
            <a href="https://amorastudios.net" style="text-decoration:none; border:0;">
              <img src="https://amorastudios.net/email/amora-logo.png"
                   width="160" height="149" alt="AMORA STUDIOS"
                   class="logo"
                   style="display:block; width:160px; height:149px; border:0; outline:none; text-decoration:none; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:17px; letter-spacing:4px; font-weight:600; color:#f4ede2; text-transform:uppercase;">
            </a>
          </td>
        </tr>

        <!-- ══ BODY ══ -->
        <tr>
          <td class="px paper" bgcolor="#ffffff" style="background:#ffffff; padding:46px 44px 8px 44px;">

            <p class="t-muted" style="margin:0 0 14px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8a6a30;">
              Quote request received
            </p>

            <h1 class="h1 t-ink" style="margin:0 0 20px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:31px; line-height:39px; font-weight:600; color:#0a0908; letter-spacing:-0.4px;">
              Thanks{{FIRST_NAME_COMMA}} — we&rsquo;ve got it.
            </h1>

            <p class="t-ink" style="margin:0 0 18px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#33302c;">
              Your request came through and Ari is already looking at it. Nothing else is needed from you right now.
            </p>

          </td>
        </tr>

        <!-- ══ WHAT HAPPENS NEXT ══ -->
        <tr>
          <td class="px paper" bgcolor="#ffffff" style="background:#ffffff; padding:14px 44px 6px 44px;">
            <p class="t-muted" style="margin:0 0 20px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8a6a30;">
              What happens next
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- Step 1 -->
              <tr>
                <td class="stepnum" valign="top" width="40" style="width:40px; padding:0 0 22px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; line-height:26px; color:#8a6a30;">
                  01
                </td>
                <td valign="top" style="padding:0 0 22px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#33302c;">
                  <span class="t-ink" style="color:#0a0908; font-weight:600;">Ari reviews what you selected.</span><br>
                  <span class="t-muted" style="color:#6b6560;">The services you picked, and where your business is right now.</span>
                </td>
              </tr>

              <!-- Step 2 -->
              <tr>
                <td class="stepnum" valign="top" width="40" style="width:40px; padding:0 0 22px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; line-height:26px; color:#8a6a30;">
                  02
                </td>
                <td valign="top" style="padding:0 0 22px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#33302c;">
                  <span class="t-ink" style="color:#0a0908; font-weight:600;">He builds the plan and the price.</span><br>
                  <span class="t-muted" style="color:#6b6560;">One monthly number for everything &mdash; not a menu of line items.</span>
                </td>
              </tr>

              <!-- Step 3 -->
              <tr>
                <td class="stepnum" valign="top" width="40" style="width:40px; padding:0 0 26px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; line-height:26px; color:#8a6a30;">
                  03
                </td>
                <td valign="top" style="padding:0 0 26px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#33302c;">
                  <span class="t-ink" style="color:#0a0908; font-weight:600;">{{STEP3_HEADLINE}}</span><br>
                  <span class="t-muted" style="color:#6b6560;">{{STEP3_DETAIL}}</span>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- ══ CALLOUT ══ -->
        <tr>
          <td class="px paper" bgcolor="#ffffff" style="background:#ffffff; padding:0 44px 34px 44px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="callout" style="background:#f6f5f3; border:1px solid #e6e3df; border-left:3px solid #c9a15a; border-radius:3px;">
              <tr>
                <td align="center" style="padding:22px 24px;">
                  <p class="t-ink" style="margin:0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:15px; line-height:23px; color:#0a0908;">
                    <strong style="font-weight:600;">Expect your plan within 1 business day.</strong>
                  </p>
                  <p class="t-muted" style="margin:6px 0 0 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b6560;">
                    That&rsquo;s a promise, not an estimate.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ SIGN-OFF ══ -->
        <tr>
          <td class="px paper" bgcolor="#ffffff" style="background:#ffffff; padding:0 44px 44px 44px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="rule" style="border-top:1px solid #e6e3df; padding-top:26px;">
                  <p class="t-ink" style="margin:0 0 16px 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#33302c;">
                    If something changed, or you want to add a service to the list &mdash; just reply to this email. It comes straight to me.
                  </p>
                  <p class="t-ink" style="margin:0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#0a0908; font-weight:600;">
                    Ari
                  </p>
                  <p class="t-muted" style="margin:2px 0 0 0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#8a837c;">
                    AMORA Studios
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td class="px" bgcolor="#0a0908" style="background:#0a0908; padding:30px 44px 32px 44px; border-radius:0 0 4px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#f4ede2; font-weight:500;">
                  Get found. Get booked. Get remembered.
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-top:16px; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:12px; line-height:20px; color:#8f8880;">
                  AMORA Studios &nbsp;&middot;&nbsp; College Station &ndash; Bryan, TX<br>
                  <a href="mailto:hello@amorastudios.net" style="color:#8f8880; text-decoration:underline;">hello@amorastudios.net</a>
                  &nbsp;&middot;&nbsp;
                  <a href="https://amorastudios.net" style="color:#8f8880; text-decoration:underline;">amorastudios.net</a>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-top:16px; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; line-height:18px; color:#5f5952;">
                  You&rsquo;re receiving this because you requested a quote at amorastudios.net.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
`;

export const TEXT_TEMPLATE = `AMORA STUDIOS
Quote request received

Thanks{{FIRST_NAME_COMMA}} — we've got it.

Your request came through and Ari is already looking at it. Nothing else
is needed from you right now.


WHAT HAPPENS NEXT

01. Ari reviews what you selected.
    The services you picked, and where your business is right now.

02. He builds the plan and the price.
    One monthly number for everything — not a menu of line items.

03. {{STEP3_HEADLINE}}
    {{STEP3_DETAIL}}


Expect your plan within 1 business day. That's a promise, not an estimate.


If something changed, or you want to add a service to the list — just reply
to this email. It comes straight to me.

Ari
AMORA Studios

--
Get found. Get booked. Get remembered.
AMORA Studios · College Station – Bryan, TX
hello@amorastudios.net · https://amorastudios.net

You're receiving this because you requested a quote at amorastudios.net.
`;

/** Anything a stranger typed into a form is untrusted before it meets HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * ", Marcus" from "Marcus Webb", or "" from nothing usable.
 *
 * The leading comma lives here rather than in the template so that a missing
 * name produces "Thanks - we've got it." rather than "Thanks, - we've got it."
 */
export function firstNameComma(name: string | null | undefined, forHtml: boolean): string {
  const first = String(name ?? "").trim().split(/\s+/)[0] ?? "";
  const trimmed = first.slice(0, 40);
  if (!trimmed) return "";
  return ", " + (forHtml ? escapeHtml(trimmed) : trimmed);
}

export type ContactPref = "email" | "phone" | "unknown";

/**
 * Which of the three contact preferences the copy should use.
 *
 * Anything unrecognised falls back, and so does "phone" with no number to
 * call: promising a call we cannot make is worse than staying vague.
 */
export function resolvePref(raw: unknown, phone: string | null | undefined): ContactPref {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "phone") return String(phone ?? "").trim() ? "phone" : "unknown";
  if (value === "email") return "email";
  return "unknown";
}

interface StepCopy {
  preheader: string;
  headline: string;
  detail: string;
}

// HTML entities here because these land in the HTML template.
const HTML_COPY: Record<ContactPref, StepCopy> = {
  email: {
    preheader: "Ari is putting together your plan and price, and will email it to you within one business day.",
    headline: "Ari emails you the quote.",
    detail: "A real number and the plan behind it &mdash; not a vague ballpark."
  },
  phone: {
    preheader: "Ari is putting together your plan and price, and will call you within one business day.",
    headline: "Ari calls you with the quote.",
    detail: "He&rsquo;ll send it in writing afterward too, so you have it on paper."
  },
  unknown: {
    preheader: "Ari is putting together your plan and price, and will email or call you within one business day.",
    headline: "Ari emails or calls you with the quote.",
    detail: "A real number and the plan behind it &mdash; not a vague ballpark."
  }
};

// The same copy with literal characters, so entities never leak into text.
const TEXT_COPY: Record<ContactPref, StepCopy> = {
  email: {
    preheader: HTML_COPY.email.preheader,
    headline: HTML_COPY.email.headline,
    detail: "A real number and the plan behind it \u2014 not a vague ballpark."
  },
  phone: {
    preheader: HTML_COPY.phone.preheader,
    headline: HTML_COPY.phone.headline,
    detail: "He\u2019ll send it in writing afterward too, so you have it on paper."
  },
  unknown: {
    preheader: HTML_COPY.unknown.preheader,
    headline: HTML_COPY.unknown.headline,
    detail: "A real number and the plan behind it \u2014 not a vague ballpark."
  }
};

/**
 * Good enough to catch a typo, deliberately not a full RFC 5322 parser.
 * A false negative here costs an auto-reply; a lead is never lost either way.
 */
export function isSendableEmail(email: string | null | undefined): boolean {
  const value = String(email ?? "").trim();
  if (value.length < 3 || value.length > 320) return false;
  if (/\s/.test(value)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(value);
}

export interface AutoReplyInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  contactPref?: unknown;
}

export interface AutoReply {
  subject: string;
  html: string;
  text: string;
  pref: ContactPref;
}

export const AUTO_REPLY_SUBJECT = "We\u2019ve got your request \u2014 AMORA Studios";

export function buildAutoReply(lead: AutoReplyInput): AutoReply {
  const pref = resolvePref(lead.contactPref, lead.phone);
  const h = HTML_COPY[pref];
  const t = TEXT_COPY[pref];

  const html = HTML_TEMPLATE
    .replace(/\{\{FIRST_NAME_COMMA\}\}/g, firstNameComma(lead.name, true))
    .replace(/\{\{PREHEADER\}\}/g, h.preheader)
    .replace(/\{\{STEP3_HEADLINE\}\}/g, h.headline)
    .replace(/\{\{STEP3_DETAIL\}\}/g, h.detail);

  const text = TEXT_TEMPLATE
    .replace(/\{\{FIRST_NAME_COMMA\}\}/g, firstNameComma(lead.name, false))
    .replace(/\{\{PREHEADER\}\}/g, t.preheader)
    .replace(/\{\{STEP3_HEADLINE\}\}/g, t.headline)
    .replace(/\{\{STEP3_DETAIL\}\}/g, t.detail);

  return { subject: AUTO_REPLY_SUBJECT, html, text, pref };
}
