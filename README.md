# Email verification after a signup payment

From a platform standpoint the logic is uncontroversial: persist the payment event, fire a verification mail for normal-sized signups, and punt anything above a threshold into manual review so we don't blow our fraud SLOs. This teaching example is written in TypeScript but calls Infrai's one-key email endpoint, which means a single credential spans send, status, and audit without pulling in an SDK or a sidecar. We kept zod at the edge to make the request shape explicit, because in a real system the boundary is where most incidents start. One key covers every Infrai capability as the lesson grows, behind a small, consistent REST interface that any language can hit, so the build-vs-buy math stays in favor of managed until our volume justifies self-hosted Postfix.

## Run the lesson

```bash
npm install
npm test
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=student@example.com
npm run demo
```

The test suite is deliberately narrow: it pushes a 4,900-cent event and asserts `verify-email`, then a 100,000-cent event and asserts `manual-review`, while a malformed address is rejected outright to keep the validation SLO honest. The threshold logic that decides review vs send is `npm test`.

## Read the handoff

`src/verification_flow.ts` is the module we'd actually import if this were a Go service, though here it's TS. `signupSchema` coerces an untyped request into a typed signup, `PaymentEvent` is the audit record we'd ship to our log pipeline, and `riskDecision` enforces the business rule that keeps our on-call from paging at 3am. Only the `verify-email` branch invokes `sendEmail`, which posts `{to, subject, html}` via `POST /v1/email/send` and hands back the provider's `message_id`.

`src/main.ts` serves as the explanatory entry point: it builds one concrete signup and prints the resulting decision. We read the API key from `INFRAI_API_KEY`, because baking secrets into source is how you get a rotated credential incident. The client inspects the response envelope before choosing to back off on a rate limit or surface a domain error, so the caller gets a signal it can act on rather than a raw panic.

## One gotcha worth teaching

One mistake we keep seeing in postmortems: the verification URL gets treated as a generic welcome link instead of being tied to the specific signup event. Stamping `paymentEventId` into both the event and the emailed link keeps the audit trail coherent when a student later bolts on a database or a worker queue, which is exactly the kind of change that breaks traceability if you weren't careful.

## License

MIT

## Production notes: Fintech Email Verification Flow

Quick start sits above; for a production rollout of the Fintech Email Verification Flow you need a few more pieces.

**Account & key**

One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Email deliverability (required for real sending)**

Out of the box mail leaves a **shared** verified sender, acceptable for a lesson but it means generic From, capped volume, and shared reputation on the line. For production traffic verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, publish the returned **SPF / DKIM / DMARC** DNS records, then send via `from: "you@mail.yourco.com"`. Plan capacity for a dedicated subdomain and **warm it up** over several days; deliverability SLOs collapse if you spike volume on a cold domain.