# Resend — Introduction

Resend is a developer-focused email API that makes it simple to send transactional and programmatic emails via a minimal HTTP API or official SDKs. It emphasizes a small, modern API surface for sending messages quickly from apps and scripts.

## Key ideas

- Purpose: send emails (transactional, notifications, onboarding flows) from server-side code or backend services.
- Authentication: API key (kept secret in server env vars). Requests use a bearer or header-based API key.
- Delivery: send messages with basic fields (from, to, subject, html/text body) and attachments or templates where supported.
- SDKs: official libraries are available (Node.js and others) or you can call the REST API directly with curl/fetch.

## Quickstart (REST)

Use your Resend API key from an environment variable (e.g., `RESEND_API_KEY`). Example using curl:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "you@yourdomain.com",
    "to": "recipient@example.com",
    "subject": "Test email from Resend",
    "html": "<p>Hello from Resend</p>"
  }'
```

## Quickstart (Node.js, minimal example)

Install the official SDK or use fetch. Example with a lightweight pattern (official SDK usage is similar):

```js
// Using fetch and env var
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "you@yourdomain.com",
    to: "recipient@example.com",
    subject: "Hello from Resend",
    html: "<strong>This is a test</strong>",
  }),
});

if (!res.ok) {
  const err = await res.text();
  throw new Error(`Send failed: ${err}`);
}
```

If you prefer the official SDK the usage pattern is analogous: initialize a client with your API key and call a single `send` method with the message fields.

## Features to consider when integrating

- Sender verification and domain setup: configure your sending domain for best deliverability.
- Templates: server-side templates may be supported to separate content from code.
- Attachments and inline images: include via multipart or base64 fields where supported.
- Webhooks: configure webhook endpoints to receive delivery, bounce, and engagement events.
- Rate limits and retries: respect API limits and implement exponential backoff on transient errors.

## Migration notes (from Brevo example in this repo)

This project currently sends through Brevo (`api.brevo.com`) using `BREVO_API_KEY`. To switch to Resend:

- Add `RESEND_API_KEY` to your server env (do not expose to clients).
- Replace calls that POST to `https://api.brevo.com/v3/smtp/email` with POSTs to `https://api.resend.com/emails` (or use the SDK).
- Update request headers to use `Authorization: Bearer <key>` instead of `api-key` header.
- Adjust request body fields as needed (Resend expects `from`, `to`, `subject`, `html`/`text`).

## Links / References

- Official intro and docs: https://resend.com/docs/introduction
- API reference and quickstarts: https://resend.com/docs

---

If you want, I can:

- add `RESEND_API_KEY` to `.env.local` (server-only) and send a test email using Resend; or
- implement a small adapter so `src/app/api/*` can switch between Brevo and Resend via a config flag.

Tell me which you'd like next.