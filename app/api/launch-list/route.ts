import { launchContactKey, sendLaunchMail } from '@/lib/launch-mail';
import { parseLaunchRequest } from '@/lib/launch-request';
import { createHmac } from 'node:crypto';

export const runtime = 'nodejs';
export const maxDuration = 30;
const day = 24 * 60 * 60 * 1000;
// Bounded best-effort cache, NOT a durable cross-instance ledger. Uses the user-approved browser policy; no durable cross-device guarantee.
const deliveries = new Map<string, { created: number; result: Promise<void> }>();
const rateWindow = new Map<string, { created: number; count: number }>();
function response(status: number, accepted = false) {
  return Response.json({ accepted, confirmationRequired: false }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function failureResponse(key: string, error: unknown) {
  const failure = error && typeof error === 'object' ? error as { responseCode?: number; code?: string } : {};
  const rejected = typeof failure.responseCode === 'number' && failure.responseCode >= 400
    || ['EAUTH', 'EENVELOPE', 'EDNS', 'ENOTFOUND'].includes(failure.code ?? '');
  if (rejected) { deliveries.delete(key); return response(503); }
  // SMTP may have accepted DATA before a connection was lost. Never blindly resend that attempt.
  return response(409);
}

export async function POST(request: Request) {
  const password = process.env.GOOGLE_SMTP_APP_PASSWORD?.replace(/\s/g, '');
  const oncePolicy = process.env.LEAD_CAPTURE_ONCE_POLICY ?? 'browser';
  if (process.env.LEAD_CAPTURE_ENABLED === 'false' || !password || oncePolicy !== 'browser') return response(503);
  if (request.headers.get('origin') !== new URL(request.url).origin) return response(403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return response(415);
  const requestId = request.headers.get('idempotency-key') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return response(400);
  let value: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return response(400);
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8192) { await reader.cancel(); return response(413); }
      chunks.push(chunk.value);
    }
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return response(400); }
  const lead = parseLaunchRequest(value);
  if (!lead) return response(400);
  const key = launchContactKey(lead, password);
  const now = Date.now();
  for (const [id, item] of deliveries) if (now - item.created > day) deliveries.delete(id);
  for (const [id, item] of rateWindow) if (now - item.created > 15 * 60 * 1000) rateWindow.delete(id);
  const previous = deliveries.get(key);
  if (previous) {
    try { await previous.result; return response(200, true); } catch (error) { return failureResponse(key, error); }
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ipKey = createHmac('sha256', password).update(`uno-launch-rate:${ip}`).digest('hex');
  const rate = rateWindow.get(ipKey) ?? { created: now, count: 0 };
  if (rate.count >= 10 || rateWindow.size >= 5000) return response(429);
  rate.count++; rateWindow.set(ipKey, rate);
  if (deliveries.size >= 1000) return response(503);
  const result = sendLaunchMail(lead, key, password);
  deliveries.set(key, { created: now, result });
  try { await result; return response(200, true); }
  catch (error) { return failureResponse(key, error); }
}
