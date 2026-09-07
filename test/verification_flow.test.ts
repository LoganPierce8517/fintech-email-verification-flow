import assert from "node:assert/strict";
import { riskDecision, signupSchema } from "../src/verification_flow.js";

assert.equal(riskDecision({ id: "p1", accountId: "a1", amountCents: 4900, kind: "signup" }), "verify-email");
assert.equal(riskDecision({ id: "p2", accountId: "a1", amountCents: 100000, kind: "signup" }), "manual-review");
assert.throws(() => signupSchema.parse({ email: "not-an-email", accountId: "a1", amountCents: 1, paymentEventId: "p" }));
console.log("verification flow decisions pass");
