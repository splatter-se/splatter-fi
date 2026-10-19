import { createHash } from 'node:crypto';
import offer from '../src/config/experiment.json' with { type: 'json' };
import { EVENTS, attribution, isId, offerReady, validSurvey, cleanSurvey } from './protocol.mjs';

const now = () => new Date().toISOString();
const hash = (value) => createHash('sha256').update(value).digest('hex');
const memberHash = (email) => createHash('md5').update(email.toLowerCase()).digest('hex');
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
});

async function readBody(request) {
  if (!request.body) throw new Error('invalid_body');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new Error('body_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function mailchimp(env, path, method = 'GET', body) {
  const response = await fetch(`https://us11.api.mailchimp.com/3.0/lists/da9f94ebd6/${path}`, {
    method,
    headers: { Authorization: `Basic ${btoa(`finland:${env.MAILCHIMP_API_KEY}`)}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('mail_service_unavailable');
  return response.status === 204 ? {} : response.json();
}

const signupEnabled = (env) => offerReady(offer) && Boolean(env.MAILCHIMP_API_KEY);
const campaignValues = (a) => [a.source, a.medium, a.campaign, a.content];

export async function purgeExpired(env) {
  // This operation has no caller-controlled SQL, cutoff, table or identifier.
  return env.DB.batch(['events', 'leads', 'surveys'].map(table => {
    const column = table === 'events' ? 'received_at' : table === 'leads' ? 'created_at' : 'submitted_at';
    return env.DB.prepare(`DELETE FROM ${table} WHERE ${column} < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days')`);
  }));
}

export async function handle(request, env) {
  const path = new URL(request.url).pathname;
  if (path === '/health' && request.method === 'GET') {
    return json({ ok: Boolean(env.DB), experimentId: offer.id, offerVersion: offer.offerVersion,
      signupEnabled: signupEnabled(env), measurement: 'consented_sessions', retentionDays: 90 });
  }
  if (path === '/maintenance' && request.method === 'POST') {
    if (!env.DB) return json({ error: 'not_configured' }, 503);
    if (env.RATE_LIMITER && !(await env.RATE_LIMITER.limit({ key: 'retention' })).success) {
      return json({ error: 'rate_limited' }, 429);
    }
    try { await purgeExpired(env); return json({ ok: true }); }
    catch { return json({ error: 'maintenance_failed' }, 503); }
  }
  const origin = request.headers.get('Origin');
  const origins = (env.ALLOWED_ORIGINS || 'https://splatter.fi,https://www.splatter.fi').split(',');
  if (!origin || !origins.includes(origin)) return json({ error: 'origin_not_allowed' }, 403);
  const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  const reply = (body, status = 200) => json(body, status, cors);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  if (!['/v1/events', '/v1/subscribe', '/v1/verify', '/v1/intent', '/v1/surveys'].includes(path)) {
    return reply({ error: 'not_found' }, 404);
  }
  if (!env.DB) return reply({ error: 'not_configured' }, 503);
  if (request.cf?.botManagement?.verifiedBot) return reply({ error: 'automated_request' }, 403);
  // IP is used only by the edge rate limiter; never written to our database.
  if (env.RATE_LIMITER) {
    const key = `${path}:${request.headers.get('CF-Connecting-IP') || 'unknown'}`;
    const { success } = await env.RATE_LIMITER.limit({ key });
    if (!success) return reply({ error: 'rate_limited' }, 429);
  }
  if (path === '/v1/subscribe' && env.SIGNUP_RATE_LIMITER) {
    const { success } = await env.SIGNUP_RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
    if (!success) return reply({ error: 'rate_limited' }, 429);
  }
  let data;
  try { data = await readBody(request); }
  catch { return reply({ error: 'invalid_body' }, 400); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply({ error: 'invalid_body' }, 400);
  const country = /^[A-Z]{2}$/.test(request.cf?.country || '') ? request.cf.country : 'XX';
  const a = attribution(data.attribution);
  try {
    if (path === '/v1/events') {
      if (data.measurementConsent !== true || !isId(data.sessionId) || !isId(data.eventId) || !EVENTS.has(data.event)) {
        return reply({ error: 'invalid_event' }, 400);
      }
      await env.DB.prepare(`INSERT OR IGNORE INTO events
        (event_id, session_id, event, experiment_id, offer_version, source, medium, campaign, content, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(data.eventId, data.sessionId, data.event, offer.id,
          offerReady(offer) && data.offerVersion === offer.offerVersion ? offer.offerVersion : null,
          ...campaignValues(a), country).run();
      return reply({ stored: true });
    }
    if (path === '/v1/surveys') {
      if (data.measurementConsent !== true || !isId(data.sessionId) || !validSurvey(data.answers)) {
        return reply({ error: 'invalid_survey' }, 400);
      }
      await env.DB.prepare('INSERT INTO surveys (session_id, experiment_id, answers_json) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET answers_json=excluded.answers_json, submitted_at=excluded.submitted_at')
        .bind(data.sessionId, offer.id, JSON.stringify(cleanSurvey(data.answers))).run();
      return reply({ stored: true });
    }
    if (!signupEnabled(env)) return reply({ error: 'experiment_not_ready' }, 503);
    if (path === '/v1/subscribe') {
      if (data.consent !== true || typeof data.email !== 'string' || data.email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
          data.offerVersion !== offer.offerVersion || typeof data.honeypot !== 'string') {
        return reply({ error: 'invalid_signup' }, 400);
      }
      if (data.honeypot) return reply({ error: 'invalid_signup' }, 400);
      const id = memberHash(data.email.trim());
      // status_if_new does not alter existing contacts' subscriptions or opt-out state.
      const member = await mailchimp(env, `members/${id}`, 'PUT', {
        email_address: data.email.trim(), status_if_new: 'pending',
      });
      if (member.status === 'pending') {
        await mailchimp(env, `members/${id}`, 'PATCH', { merge_fields: { FICONSENT: 'fi-demand-v1-2026-10-19' } });
        await mailchimp(env, `members/${id}/tags`, 'POST', { tags: [{ name: 'Finland launch', status: 'active' }] });
      }
      const token = crypto.randomUUID() + crypto.randomUUID();
      // A pending->subscribed transition is required; existing subscribers never bypass verification.
      // Rotate a browser token only while still unverified; verified rows cannot be taken over.
      const previous = await env.DB.prepare('SELECT verified_at FROM leads WHERE member_hash=?').bind(id).first();
      if (previous?.verified_at) return reply({ state: 'check_email', token });
      await env.DB.prepare(`INSERT INTO leads
        (token_hash, member_hash, experiment_id, session_id, source, medium, campaign, content, country, can_verify)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(member_hash) DO UPDATE SET token_hash=excluded.token_hash, can_verify=excluded.can_verify,
          session_id=excluded.session_id, source=excluded.source, medium=excluded.medium,
          campaign=excluded.campaign, content=excluded.content, country=excluded.country,
          created_at=excluded.created_at
        WHERE leads.verified_at IS NULL`)
        .bind(hash(token), id, offer.id,
          data.measurementConsent === true && isId(data.sessionId) ? data.sessionId : null,
          ...campaignValues(data.measurementConsent === true ? a : attribution()), country, member.status === 'pending' ? 1 : 0).run();
      return reply({ state: 'check_email', token });
    }
    if (typeof data.token !== 'string' || data.token.length !== 72) return reply({ error: 'invalid_token' }, 401);
    const lead = await env.DB.prepare('SELECT * FROM leads WHERE token_hash=?').bind(hash(data.token)).first();
    if (!lead) return reply({ error: 'invalid_token' }, 401);
    if (path === '/v1/verify') {
      if (lead.verified_at) return reply({ verified: true });
      if (!lead.can_verify) return reply({ verified: false });
      const member = await mailchimp(env, `members/${lead.member_hash}?fields=status,timestamp_opt`);
      if (member.status !== 'subscribed') return reply({ verified: false });
      await env.DB.prepare('UPDATE leads SET verified_at=? WHERE token_hash=? AND verified_at IS NULL')
        .bind(now(), hash(data.token)).run();
      return reply({ verified: true });
    }
    if (!lead.verified_at) return reply({ error: 'confirmation_required' }, 403);
    if (!['yes', 'maybe', 'no'].includes(data.intent) || data.offerVersion !== offer.offerVersion) {
      return reply({ error: 'invalid_intent' }, 400);
    }
    await env.DB.prepare('UPDATE leads SET intent=?, offer_version=?, price_cents=?, intent_at=? WHERE token_hash=?')
      .bind(data.intent, offer.offerVersion, offer.monthlyPriceCents, now(), hash(data.token)).run();
    return reply({ stored: true });
  } catch {
    // Never log requests, addresses, provider responses or credentials.
    return reply({ error: 'service_unavailable' }, 503);
  }
}

export default {
  fetch: handle,
};
