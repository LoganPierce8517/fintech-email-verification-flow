import { handleSignup } from "./verification_flow.js";

const to = process.env.DEMO_EMAIL_TO;
if (!to) throw new Error("DEMO_EMAIL_TO is required");
const result = await handleSignup({ email: to, accountId: "acct-course-101", amountCents: 4900, paymentEventId: "pay-demo-1" }, "https://example.test/verify/pay-demo-1");
console.log(JSON.stringify(result, null, 2));
