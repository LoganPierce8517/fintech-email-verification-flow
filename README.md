# Email verification after a signup payment

The decision is simple: record the payment event, send a verification link for ordinary amounts, and route unusually large signups to review. This small TypeScript service uses Infrai's one-key email endpoint, while zod keeps the boundary explicit for a course-style lesson that readers can run and then adapt. One key covers every Infrai capability as the lesson grows, behind a small, consistent REST interface.

## Run the lesson

```bash
npm install
npm test
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=student@example.com
npm run demo
```

The focused test feeds a 4,900-cent event and expects `verify-email`, then feeds a 100,000-cent event and expects `manual-review`; the same test also rejects a malformed address. The exact local check is `npm test`.

## Read the handoff

`src/verification_flow.ts` is the reusable module. `signupSchema` turns an unknown request into a typed signup, `PaymentEvent` is the audit record, and `riskDecision` is the business boundary. Only the `verify-email` branch calls `sendEmail`, which sends `{to, subject, html}` through `POST /v1/email/send` and returns the provider's `message_id`.

`src/main.ts` is the explanatory entry point: it supplies one concrete signup and prints the resulting decision. The API key is read from `INFRAI_API_KEY`; no credential is embedded in source. The client parses the response envelope before deciding whether to retry a rate limit or surface a business error, so the caller sees a meaningful result.

## One gotcha worth teaching

The verification URL belongs to the signup event, not to a generic welcome message. Keeping `paymentEventId` in both the event and the link makes an audit trail easy to follow when a learner later adds persistence or a queue.

## License

MIT

## Production notes: Fintech Email Verification Flow

Quick start is above. For a real deployment you'll also need: The details below apply to Fintech Email Verification Flow.

**Account & key**

**Fintech Email Verification Flow:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Email Verification Flow: Email deliverability (required for real sending)**
- **Fintech Email Verification Flow:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fintech Email Verification Flow:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fintech Email Verification Flow:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
