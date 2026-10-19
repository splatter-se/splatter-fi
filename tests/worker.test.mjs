import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { handle } from '../worker/index.mjs';
import offer from '../src/config/experiment.json' with { type: 'json' };
import { offerReady } from '../worker/protocol.mjs';

const schema = await readFile(new URL('../worker/schema.sql', import.meta.url), 'utf8');
function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(schema);
  const binding = {
    async batch(statements) { return Promise.all(statements.map(statement => statement.run())); },
    prepare(sql) {
      let args = [];
      return { bind(...values) { args = values; return this; },
        async run() { return db.prepare(sql).run(...args); },
        async first() { return db.prepare(sql).get(...args) || null; } };
    },
  };
  return { db, env: { DB: binding } };
}
const id = () => crypto.randomUUID();
const event = () => ({ eventId: id(), sessionId: id(), event: 'finland_landing_view', measurementConsent: true });
function request(path, data, origin = 'https://splatter.fi') {
  const req = new Request(`https://demand.example${path}`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  Object.defineProperty(req, 'cf', { value: { country: 'FI' } });
  return req;
}

test('public collection requires a permitted origin, consent, valid event and edge rate limit', async () => {
  const { db, env } = database();
  for (const [body, origin] of [[event(), 'https://evil.example'], [{ ...event(), measurementConsent: false }],
    [{ ...event(), event: 'finland_email_confirmed' }], [{ ...event(), sessionId: 'private@example.com' }]]) {
    const response = await handle(request('/v1/events', body, origin), env);
    assert.ok([400, 403].includes(response.status));
  }
  assert.equal((await handle(request('/v1/events', event()), { ...env, RATE_LIMITER: { limit: async () => ({ success: false }) } })).status, 429);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM events').get().n, 0);
  db.close();
});

test('retries and reloads count once; arbitrary campaign text and personal fields are discarded', async () => {
  const { db, env } = database();
  const payload = { ...event(), attribution: { utm_source: 'meta', utm_campaign: 'private@example.com' },
    email: 'private@example.com', properties: { email: 'private@example.com' } };
  assert.equal((await handle(request('/v1/events', payload), env)).status, 200);
  await handle(request('/v1/events', { ...payload, eventId: id() }), env);
  const rows = db.prepare('SELECT * FROM events').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source, 'meta');
  assert.equal(rows[0].country, 'FI');
  assert.equal(rows[0].offer_version, null);
  assert.doesNotMatch(JSON.stringify(rows), /private@example/);
  db.close();
});

test('surveys validate answers, discard unknown fields and acknowledge only saved data', async () => {
  const { db, env } = database();
  const payload = { sessionId: id(), measurementConsent: true, answers: {
    subscriptionReason: 'exclusive', viewingFrequency: 'few-monthly', genres: ['giallo'], email: 'private@example.com' } };
  assert.equal((await handle(request('/v1/surveys', { ...payload, answers: { ...payload.answers, genres: ['giallo', 'giallo'] } }), env)).status, 400);
  assert.deepEqual(await (await handle(request('/v1/surveys', payload), env)).json(), { stored: true });
  assert.doesNotMatch(db.prepare('SELECT answers_json FROM surveys').get().answers_json, /private@example/);
  db.close();
});

test('an unapproved offer is rejected and a missing Mailchimp key keeps signups disabled', async () => {
  const { db, env } = database();
  assert.equal(offerReady({ ...offer, approved: false }), false);
  assert.equal((await handle(request('/v1/subscribe', { consent: true }), env)).status, 503);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM leads').get().n, 0);
  db.close();
});

test('maintenance can only expire records older than 90 days', async () => {
  const { db, env } = database();
  await handle(request('/v1/events', event()), env);
  const old = event();
  await handle(request('/v1/events', old), env);
  db.prepare("UPDATE events SET received_at='2020-01-01T00:00:00.000Z' WHERE event_id=?").run(old.eventId);
  const response = await handle(new Request('https://demand.example/maintenance?cutoff=tomorrow', { method: 'POST' }), env);
  assert.equal(response.status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM events').get().n, 1);
  db.close();
});

test('report separates baseline, Finland, QA and leads without a measured session', async () => {
  const { db } = database();
  const insertEvent = db.prepare(`INSERT INTO events
    (event_id,session_id,event,experiment_id,offer_version,source,medium,campaign,content,country)
    VALUES (?,?,'finland_landing_view','fi-demand-2026-01',?,?,'paid_social','fi-demand-2026-01','discovery',?)`);
  const measured = id();
  insertEvent.run(id(), measured, 'fi-offer-v1', 'meta', 'FI');
  insertEvent.run(id(), id(), null, 'meta', 'FI');
  insertEvent.run(id(), id(), 'fi-offer-v1', 'qa', 'FI');
  insertEvent.run(id(), id(), 'fi-offer-v1', 'meta', 'SE');
  const insertLead = db.prepare(`INSERT INTO leads
    (token_hash,member_hash,experiment_id,session_id,source,medium,campaign,content,country,verified_at,intent,offer_version,price_cents)
    VALUES (?,?,'fi-demand-2026-01',?,'meta','paid_social','fi-demand-2026-01','discovery','FI','2026-10-19','yes','fi-offer-v1',790)`);
  insertLead.run('a', 'a', measured);
  insertLead.run('b', 'b', null);
  const report = await readFile(new URL('../worker/report.sql', import.meta.url), 'utf8');
  const statements = report.replace(/^--.*$/gm, '').split(';').map(value => value.trim()).filter(Boolean);
  const rows = db.prepare(statements[0]).all();
  assert.equal(rows.length, 2);
  const priced = rows.find(row => row.offer_version === 'fi-offer-v1');
  assert.equal(priced.measured_fi_sessions, 1);
  assert.equal(priced.verified_leads, 1);
  assert.equal(priced.qualified_leads, 1);
  assert.equal(db.prepare(statements[1]).get().confirmed_without_session_measurement, 1);
  db.close();
});

test('only a provider-verified pending signup can save intent at the server price; a repeated signup cannot take over a confirmed address', async (t) => {
  const originalOffer = structuredClone(offer);
  const originalFetch = globalThis.fetch;
  Object.assign(offer, { approved: true, monthlyPriceCents: 790, subtitleLanguages: ['English'], devices: ['Web'],
    films: Array.from({ length: 6 }, (_, i) => ({ title: `QA ${i}`, poster: '/qa.webp', rightsApproved: true })) });
  t.after(() => { Object.assign(offer, originalOffer); globalThis.fetch = originalFetch; });
  let providerStatus = 'pending';
  const providerCalls = [];
  globalThis.fetch = async (url, options) => {
    providerCalls.push({ url, method: options.method, body: options.body && JSON.parse(options.body) });
    return new Response(JSON.stringify({ status: providerStatus }), { status: 200 });
  };
  const { db, env } = database();
  env.MAILCHIMP_API_KEY = 'test-only';
  const signup = { email: 'qa@example.com', consent: true, honeypot: '', offerVersion: offer.offerVersion,
    measurementConsent: true, sessionId: id() };
  const first = await (await handle(request('/v1/subscribe', signup), env)).json();
  assert.equal(typeof first.token, 'string');
  assert.equal(providerCalls[0].body.status_if_new, 'pending');
  const intent = { token: first.token, offerVersion: offer.offerVersion, intent: 'yes', priceCents: 1 };
  assert.equal((await handle(request('/v1/intent', intent), env)).status, 403);
  assert.equal((await (await handle(request('/v1/verify', { token: first.token }), env)).json()).verified, false);
  providerStatus = 'subscribed';
  // An attacker re-enters someone else's now-confirmed email before its original browser checks.
  const repeated = await (await handle(request('/v1/subscribe', signup), env)).json();
  assert.equal((await (await handle(request('/v1/verify', { token: repeated.token }), env)).json()).verified, false);
  assert.equal((await handle(request('/v1/intent', { ...intent, token: repeated.token }), env)).status, 403);
  // A separate genuinely pending signup completes verification and saves the server-side offer.
  providerStatus = 'pending';
  const next = await (await handle(request('/v1/subscribe', { ...signup, email: 'next@example.com' }), env)).json();
  providerStatus = 'subscribed';
  assert.equal((await (await handle(request('/v1/verify', { token: next.token }), env)).json()).verified, true);
  assert.equal((await handle(request('/v1/intent', { ...intent, token: next.token, offerVersion: 'stale' }), env)).status, 400);
  assert.equal((await handle(request('/v1/intent', { ...intent, token: next.token }), env)).status, 200);
  const lead = db.prepare("SELECT * FROM leads WHERE intent='yes'").get();
  assert.equal(lead.price_cents, 790);
  assert.notEqual(lead.token_hash, next.token);
  assert.doesNotMatch(JSON.stringify(db.prepare('SELECT * FROM leads').all()), /@example/);
  assert.ok(providerCalls.every(call => call.body?.status !== 'subscribed'));
  db.close();
});
