import { fi } from "../content/fi";
import { captureFirstTouch, markSignupPending, track } from "../lib/analytics";
import { setupPrivacyDialog } from "./privacy";
import { setupMeasurement, measurementAllowed } from '../lib/measurement';
import { demandRequest, saveProof, clearProof } from '../lib/demand-api';
import { experiment, offerReady } from '../config/experiment';
import { siteConfig } from '../config/site';

const form = document.querySelector<HTMLFormElement>("[data-signup-form]");
const email = document.querySelector<HTMLInputElement>("#mce-EMAIL");
const consent = document.querySelector<HTMLInputElement>("#consent");
const emailError = document.querySelector<HTMLElement>("[data-email-error]");
const consentError = document.querySelector<HTMLElement>("[data-consent-error]");
setupMeasurement();
let attribution = captureFirstTouch();

void track("finland_landing_view");
setupPrivacyDialog();
document.addEventListener('splatter:measurement-choice', () => {
  attribution = captureFirstTouch();
  void track('finland_landing_view');
  if (offerReady) void track('finland_offer_view');
});
if (offerReady) void track('finland_offer_view');

document.querySelectorAll<HTMLInputElement>("[data-attribution-field]").forEach((field) => {
  const key = field.dataset.attributionField as keyof typeof attribution | undefined;
  if (key) field.value = attribution[key] || "";
});

let signupStarted = false;
const recordStart = () => {
  if (signupStarted) return;
  signupStarted = true;
  void track("finland_signup_start");
};
form?.addEventListener("focusin", recordStart, { once: true });

email?.addEventListener("invalid", () => {
  email.setAttribute("aria-invalid", "true");
  if (emailError) emailError.textContent = fi.landing.emailError;
  void track("finland_signup_error", { reason: "email_validation" });
});

consent?.addEventListener("invalid", () => {
  consent.setAttribute("aria-invalid", "true");
  if (consentError) consentError.textContent = fi.landing.consentError;
  void track("finland_signup_error", { reason: "consent_validation" });
});

form?.addEventListener("submit", async (event) => {
  if (!form.checkValidity()) {
    event.preventDefault();
    return;
  }
  const useApi = form.dataset.demandReady === 'true';
  if (useApi) event.preventDefault();
  void track('finland_signup_submit');
  markSignupPending();
  const button = form.querySelector<HTMLButtonElement>("button[type='submit']");
  if (button) {
    button.disabled = true;
    const label = button.querySelector("span");
    if (label) label.textContent = fi.landing.submitting;
  }
  if (useApi) {
    const status = form.querySelector<HTMLElement>('[data-signup-status]');
    if (status) status.textContent = '';
    try {
      const result = await demandRequest('subscribe', {
        email: email?.value.trim(), consent: consent?.checked === true,
        honeypot: form.querySelector<HTMLInputElement>('#mailchimp-honeypot')?.value || '',
        offerVersion: experiment.offerVersion,
        measurementConsent: measurementAllowed(),
        ...(measurementAllowed() ? { sessionId: (await import('../lib/analytics')).getSessionId(), attribution } : {}),
      });
      if (result.state !== 'check_email') throw new Error('invalid_response');
      clearProof();
      if (typeof result.token === 'string' && !saveProof(result.token)) {
        if (status) status.textContent = fi.landing.sentWithoutProof(siteConfig.contactEmail);
        if (button) { const label = button.querySelector('span'); if (label) label.textContent = fi.landing.sent; }
        return;
      }
      window.location.assign('/kiitos');
    } catch {
      if (status) status.textContent = fi.landing.signupError;
      if (button) { button.disabled = false; const label = button.querySelector('span'); if (label) label.textContent = fi.landing.submit; }
      void track('finland_signup_error', { reason: 'request_failed' });
    }
  }
});

email?.addEventListener("input", () => {
  email.removeAttribute("aria-invalid");
  if (emailError) emailError.textContent = "";
});
consent?.addEventListener("change", () => {
  consent.removeAttribute("aria-invalid");
  if (consentError) consentError.textContent = "";
});

window.addEventListener("pageshow", () => {
  const button = form?.querySelector<HTMLButtonElement>("button[type='submit']");
  if (button && form?.dataset.signupReady === "true") {
    button.disabled = false;
    const label = button.querySelector("span");
    if (label) label.textContent = fi.landing.submit;
  }
});
