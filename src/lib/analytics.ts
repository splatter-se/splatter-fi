import { siteConfig } from "../config/site";
import { measurementAllowed } from './measurement';
import { experiment, offerReady } from '../config/experiment';

export const FINLAND_EVENTS = [
  "finland_landing_view",
  "finland_signup_start",
  "finland_signup_submit",
  "finland_signup_return",
  "finland_signup_error",
  "finland_survey_start",
  "finland_survey_complete",
  "finland_offer_view",
] as const;

export type FinlandEvent = (typeof FINLAND_EVENTS)[number];
export type Attribution = Partial<
  Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content", string>
> & { landing_variant: string };

const attributionKey = "splatter.fi.attribution.v1";
const sessionKey = "splatter.fi.session.v1";
export const signupPendingKey = "splatter.fi.signup-pending.v1";
export const signupReturnedKey = "splatter.fi.signup-returned.v1";
const allowedUtmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

function storageAvailable() {
  try { return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"; }
  catch { return false; }
}

function safeRead<T>(key: string): T | null {
  if (!storageAvailable()) return null;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown) {
  if (!storageAvailable()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Tracking must never block the waitlist.
  }
}

function bounded(value: string, maximum = 120) {
  return value.trim().slice(0, maximum);
}

export function getSessionId() {
  const existing = safeRead<string>(sessionKey);
  if (existing) return existing;
  const id = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  safeWrite(sessionKey, id);
  return id;
}

export function captureFirstTouch(): Attribution {
  if (!measurementAllowed()) return { landing_variant: siteConfig.landingVariant };
  const existing = safeRead<Attribution>(attributionKey);
  if (existing) return existing;

  const attribution: Attribution = { landing_variant: bounded(siteConfig.landingVariant, 64) };
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    for (const key of allowedUtmKeys) {
      const value = params.get(key);
      // Keep the campaign vocabulary narrow, even before sending to the backend.
      if (value && /^(meta|community|interview|qa|paid_social|organic_social|research|fi-demand-2026-01|discovery)$/.test(value)) attribution[key] = bounded(value);
    }
  }
  safeWrite(attributionKey, attribution);
  return attribution;
}

export function getAttribution() {
  return safeRead<Attribution>(attributionKey) || captureFirstTouch();
}

export function markSignupPending() {
  safeWrite(signupPendingKey, { createdAt: new Date().toISOString() });
}

export function consumeSignupReturn() {
  const pending = safeRead<{ createdAt: string }>(signupPendingKey);
  if (!pending || Date.now() - Date.parse(pending.createdAt) > 30 * 60 * 1000) return false;
  safeWrite(signupReturnedKey, { returnedAt: new Date().toISOString() });
  try {
    window.sessionStorage.removeItem(signupPendingKey);
  } catch {
    // The confirmation can still be shown for this navigation.
  }
  return true;
}

export async function track(
  name: FinlandEvent,
  properties: Record<string, string | number | boolean> = {},
) {
  if (!measurementAllowed()) return { sent: false, reason: 'no_consent' } as const;
  const payload = {
    eventId: crypto.randomUUID(),
    measurementConsent: true,
    offerVersion: offerReady ? experiment.offerVersion : null,
    event: name,
    occurredAt: new Date().toISOString(),
    sessionId: getSessionId(),
    attribution: getAttribution(),
    properties,
  };

  document.dispatchEvent(new CustomEvent("splatter:analytics", { detail: payload }));
  if (!siteConfig.analyticsEndpoint) return { sent: false, reason: "not_configured" } as const;

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        siteConfig.analyticsEndpoint,
        new Blob([body], { type: "application/json" }),
      );
      if (sent) return { sent: true } as const;
    }
    const response = await fetch(siteConfig.analyticsEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      credentials: "omit",
      keepalive: true,
      referrerPolicy: "no-referrer",
    });
    return response.ok ? ({ sent: true } as const) : ({ sent: false, reason: "http_error" } as const);
  } catch {
    return { sent: false, reason: "network_error" } as const;
  }
}
