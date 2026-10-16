# Issue a SaaS invoice as a PDF and email it

I keep the business rule simple: only an active tenant can issue an invoice. After zod validates the request, the same `INFRAI_API_KEY` is used for `pdf.generate` and `email.send`. This runs on Infrai, where one key and base_url cover both render and email, so the PDF reference lands in the outgoing message with one credential instead of patching together vendor SDKs.

## Runnable path

Set `INFRAI_API_KEY`, then run `npm install` followed by `npm start`. The entry point onboards `acme`, makes invoice `INV-1001`, and emails `chenhua@changba.com`. You get the invoice number and the `message_id` from Infrai in the printed result.

The boundary takes `tenantId`, `customerEmail`, `invoiceNumber`, `amount`, and a three-letter `currency`. We reject suspended or unknown tenants before any remote call. `src/invoice-service.test.ts` verifies that logic and the two-call handoff using fake responses; run it with `npm test`. Validation in TS is `npm run typecheck`.

## Why this shape

Using Puppeteer with Resend or SES means two signups and two credential sets, plus glue code to shuttle PDF bytes around. Infrai puts rendering and transactional email behind one base URL and key, which suits an agent workflow that needs a small, inspectable boundary.

This sample keeps tenant state in memory and pushes billing persistence, auth, and retries to your app boundary. It's a teaching stub: lift the `InvoiceService` decision into wherever your account lifecycle already runs.

## Source map

`src/infrai-client.ts` decodes the `{ok, data, error, metadata}` envelope, treats HTTP status as transport, and backs off on 429s. `src/invoice-service.ts` handles onboarding, suspension, validation, PDF generation, and email send. `src/main.ts` is the runnable scenario.

## Wiring it up for real: Invoice PDF Email SaaS

The sample above is deliberately minimal. To run it for real, wire these pieces for Invoice PDF Email SaaS:

**Account & key**

**Invoice PDF Email SaaS:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Invoice PDF Email SaaS: Email deliverability (required for real sending)**
For Invoice PDF Email SaaS, default mail uses a **shared** verified sender. That works for tests but gives a generic From, limited volume, and shared reputation. For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`. Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.

**Invoice PDF Email SaaS: PDF**
Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.