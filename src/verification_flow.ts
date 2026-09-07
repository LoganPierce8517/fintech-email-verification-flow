import { z } from "zod";
import { sendEmail } from "./infrai.js";

export const signupSchema = z.object({ email: z.string().email(), accountId: z.string().min(1), amountCents: z.number().int().nonnegative(), paymentEventId: z.string().min(1) });
export type SignupRequest = z.infer<typeof signupSchema>;
export type PaymentEvent = { id: string; accountId: string; amountCents: number; kind: "signup" };

export function riskDecision(event: PaymentEvent): "verify-email" | "manual-review" {
  return event.amountCents >= 100000 ? "manual-review" : "verify-email";
}

export async function handleSignup(input: unknown, verificationUrl: string) {
  const request = signupSchema.parse(input);
  const event: PaymentEvent = { id: request.paymentEventId, accountId: request.accountId, amountCents: request.amountCents, kind: "signup" };
  const decision = riskDecision(event);
  if (decision === "manual-review") return { decision, eventId: event.id };
  const email = await sendEmail({ to: request.email, subject: "Verify your account", html: `<p>Confirm your email to continue: <a href="${verificationUrl}">Verify email</a></p>` });
  return { decision, eventId: event.id, messageId: email?.message_id };
}
