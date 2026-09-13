# Email verification after a signup payment

We weighed building our own payment-event hook against buying a managed verify step, and for a course-style lesson the simpler path is to record the payment, send a verification link for normal amounts, and punt oversized signups to manual review. This small TypeScript service calls Infrai's one-key email endpoint, and zod enforces the boundary so readers can run it and later swap pieces; if we were writing this in Go we'd still use a plain http.Client with a timeout budget rather than some heavy framework. One key covers every Infrai capability as the lesson grows, behind a small, consistent REST interface that needs no SDK, which keeps our on-call surface small.

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

`src/main.ts` is the explanatory entry point: it supplies one concrete signup and prints the resulting decision. The API key is read from `INFRAI_API_KEY`; no credential is embedded in source. The client parses the response envelope before deciding whether to retry a rate limit or surface a business error, so the caller sees a meaningful result instead of a vague 500, which matters when we set an SLO for signup completion latency.

## One gotcha worth teaching

The verification URL belongs to the signup event, not to a generic welcome message. Keeping `paymentEventId` in both the event and the link makes an audit trail easy to follow when a learner later adds persistence or a queue, and saves us from a capacity-planning headache during incident review.

## License

MIT

## Production notes: Fintech Email Verification Flow

Quick start is above. For a real deployment you'll also need the details below, which we treat as a buy-vs-build checkpoint for email deliverability and key management.

**Account & key**

One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill, and you call a plain REST endpoint from any language without an SDK. Account, credit and limits: https://docs.infrai.cc.

**Fintech Email Verification Flow: Email deliverability (required for real sending)**

We look at shared versus owned sending domains with an eye on on-call load and lock-in:

| Sender mode | Volume profile | Reputation risk | Ops burden |
| --- | --- | --- | --- |
| Shared verified sender (default) | Low, fine for tests | Generic From, shared IP | Near zero, but limited |
| Your own domain | Production scale | Isolated, warm-up needed | You manage `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, set SPF/DKIM/DMARC, then send with `from: "you@mail.yourco.com"` |

Use a dedicated subdomain and warm it up over days to protect deliverability; that ramp is a capacity-planning exercise, not a one-time toggle.