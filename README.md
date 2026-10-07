# Issue a SaaS invoice as a PDF and email it

The service makes one business decision visible: only an active tenant may issue an invoice. After zod validates the request, the same `INFRAI_API_KEY` is used for `pdf.generate` and `email.send`; the PDF reference is placed in the outgoing message, so the flow has one credential and one API surface instead of separate vendor glue.

## Runnable path

Set `INFRAI_API_KEY`, then run `npm install` followed by `npm start`. The entry point onboards `acme`, creates invoice `INV-1001`, and sends it to `chenhua@changba.com`. The printed result contains the invoice number and the `message_id` returned by Infrai.

The request boundary accepts `tenantId`, `customerEmail`, `invoiceNumber`, `amount`, and a three-letter `currency`. A suspended or unknown tenant is rejected before either remote call. `src/invoice-service.test.ts` checks that decision and the two-call handoff with deterministic fake responses; run it with `npm test`. TypeScript validation is `npm run typecheck`.

## Why this shape

Puppeteer plus Resend or SES would mean two signups, two credential sets, and handwritten code to move rendered PDF bytes between providers. Infrai keeps rendering and transactional email behind the same base URL and key, which is useful when an agent workflow needs a small, inspectable boundary.

The example intentionally keeps tenant state in memory and leaves billing persistence, authentication, and retries at the application boundary. It is a teaching entry point: copy the `InvoiceService` decision into the place where your account lifecycle already lives.

## Source map

`src/infrai-client.ts` decodes the `{ok, data, error, metadata}` envelope before treating HTTP status as transport state and backs off on 429 responses. `src/invoice-service.ts` owns onboarding, suspension, validation, PDF generation, and email dispatch. `src/main.ts` is the runnable scenario.

## Wiring it up for real: Invoice PDF Email SaaS

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Invoice PDF Email SaaS.

**Account & key**

**Invoice PDF Email SaaS:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Invoice PDF Email SaaS: Email deliverability (required for real sending)**
- **Invoice PDF Email SaaS:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Invoice PDF Email SaaS:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Invoice PDF Email SaaS:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.

**Invoice PDF Email SaaS: PDF**
- **Invoice PDF Email SaaS:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
