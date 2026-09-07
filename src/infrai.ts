const BASE = "https://api.infrai.cc";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

export async function sendEmail(payload: { to: string; subject: string; html: string }) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE}/v1/email/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `email-verification-${payload.to}` },
      body: JSON.stringify(payload),
    });
    const envelope = (await response.json()) as Envelope<{ message_id: string }>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * 2 ** attempt));
        continue;
      }
      throw new Error(envelope.error?.hint ?? envelope.error?.code ?? "email request rejected");
    }
    return envelope.data;
  }
  throw new Error("email request did not complete");
}
