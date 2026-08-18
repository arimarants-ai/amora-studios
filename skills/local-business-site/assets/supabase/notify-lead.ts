// Emails you when a new enquiry lands in the leads table.
//
// Supabase calls this from a database webhook on insert, and it hands the
// enquiry to Resend. The Resend API key lives in this function's secrets, so
// the email is sent by whichever Resend account that key belongs to.
//
// Set up steps are in README.md under "Getting told about new enquiries".

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface Lead {
  business?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  package?: string[] | null;
  services?: string[] | null;
  message?: string | null;
  page?: string | null;
  created_at?: string | null;
}

// Anything that came from the form is untrusted text, so it is escaped before
// going anywhere near the HTML body of the email.
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function list(items: string[] | null | undefined, empty: string): string {
  if (!items || items.length === 0) return `<em>${empty}</em>`;
  return items.map(esc).join(", ");
}

export async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // The function is reachable without a Supabase key, so this shared secret is
  // what stops anyone who finds the URL from making the account send email.
  // Set WEBHOOK_SECRET here and send the same value as the x-webhook-secret
  // header on the database webhook.
  const expected = Deno.env.get("WEBHOOK_SECRET");
  if (expected && req.headers.get("x-webhook-secret") !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("NOTIFY_TO");
  const from = Deno.env.get("NOTIFY_FROM") ?? "the business <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.error("Missing RESEND_API_KEY or NOTIFY_TO");
    return new Response("Not configured", { status: 500 });
  }

  let lead: Lead;
  try {
    const payload = await req.json();
    lead = (payload?.record ?? payload) as Lead;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const business = lead.business || "A small business";
  const subject = `New quote request from ${business}`;

  const rows: Array<[string, string]> = [
    ["Business", esc(business)],
    ["Contact", esc(lead.name)],
    ["Email", `<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>`],
    ["Phone", lead.phone ? esc(lead.phone) : "<em>not given</em>"],
    ["Package", list(lead.package, "none picked")],
    ["Services", list(lead.services, "not sure yet")],
  ];

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#141110">
      <h2 style="font-size:18px;margin:0 0 16px">New quote request</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        ${rows
          .map(
            ([label, value]) =>
              `<tr>
                 <td style="padding:4px 16px 4px 0;color:#6b625a;vertical-align:top;white-space:nowrap">${label}</td>
                 <td style="padding:4px 0">${value}</td>
               </tr>`,
          )
          .join("")}
      </table>
      <p style="margin:18px 0 6px;color:#6b625a">About the business</p>
      <div style="white-space:pre-wrap;padding:12px 14px;background:#faf6f0;border-radius:8px">${
        lead.message ? esc(lead.message) : "<em>nothing added</em>"
      }</div>
      <p style="margin-top:20px;color:#6b625a;font-size:13px">
        Sent from the quote form${lead.page ? ` on ${esc(lead.page)}` : ""}. Reply straight to this email to answer them.
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((address) => address.trim()),
      subject,
      html,
      // Hitting reply goes to the person who filled in the form.
      reply_to: lead.email || undefined,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend rejected the send:", res.status, detail);
    return new Response("Send failed", { status: 502 });
  }

  return new Response("Sent", { status: 200 });
}

// A database webhook arrives with no Supabase key, so the platform auth gate is
// off and the shared secret above does the checking instead.
export default {
  fetch: withSupabase({ auth: "none" }, handler),
};
