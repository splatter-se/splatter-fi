import { fi } from "../content/fi";
import { captureFirstTouch, markSignupPending, track } from "../lib/analytics";
import { setupPrivacyDialog } from "./privacy";

const form = document.querySelector<HTMLFormElement>("[data-signup-form]");
const email = document.querySelector<HTMLInputElement>("#mce-EMAIL");
const consent = document.querySelector<HTMLInputElement>("#consent");
const emailError = document.querySelector<HTMLElement>("[data-email-error]");
const consentError = document.querySelector<HTMLElement>("[data-consent-error]");
const attribution = captureFirstTouch();

void track("finland_landing_view");
setupPrivacyDialog();

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

form?.addEventListener("submit", (event) => {
  if (!form.checkValidity()) {
    event.preventDefault();
    return;
  }
  markSignupPending();
  const button = form.querySelector<HTMLButtonElement>("button[type='submit']");
  if (button) {
    button.disabled = true;
    const label = button.querySelector("span");
    if (label) label.textContent = fi.landing.submitting;
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

