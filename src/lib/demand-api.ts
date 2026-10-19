import { siteConfig } from '../config/site';

export type SignupProof = { token: string; createdAt: number };
const key = 'splatter.fi.signup-proof.v1';

export function readProof(): SignupProof | null {
  try {
    const proof = JSON.parse(window.sessionStorage.getItem(key) || 'null');
    return proof && typeof proof.token === 'string' && proof.createdAt > Date.now() - 7 * 86400000 ? proof : null;
  } catch { return null; }
}
export function saveProof(token: string) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ token, createdAt: Date.now() }));
    return true;
  } catch { return false; }
}
export function clearProof() {
  try { window.sessionStorage.removeItem(key); } catch { /* No proof to reuse. */ }
}
export async function demandRequest(path: string, data: unknown): Promise<Record<string, unknown>> {
  if (!siteConfig.demandApi) throw new Error('not_configured');
  const response = await fetch(`${siteConfig.demandApi}/v1/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('request_failed');
  return response.json();
}
