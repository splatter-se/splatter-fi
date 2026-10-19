import { fi } from "../content/fi";
import {
  captureFirstTouch,
  consumeSignupReturn,
  getAttribution,
  getSessionId,
  track,
} from "../lib/analytics";
import { submitSurvey } from "../lib/survey-storage";
import { setupPrivacyDialog } from "./privacy";
import { setupMeasurement, measurementAllowed } from '../lib/measurement';
import { demandRequest, readProof } from '../lib/demand-api';
import { experiment } from '../config/experiment';

setupMeasurement();
captureFirstTouch();
setupPrivacyDialog();

// Returning from a form is NOT proof of email ownership.
const returned = consumeSignupReturn();
const proof = readProof();
const verifiedPanel = document.querySelector<HTMLElement>("[data-confirmed]");
const unverifiedPanel = document.querySelector<HTMLElement>("[data-unverified]");
const checkPanel = document.querySelector<HTMLElement>('[data-email-check]');
const checkButton = document.querySelector<HTMLButtonElement>('[data-check-email]');
const checkStatus = document.querySelector<HTMLElement>('[data-verification-status]');
const intentForm = document.querySelector<HTMLFormElement>('[data-intent-form]');
const form = document.querySelector<HTMLFormElement>("[data-survey-form]");

if (returned || proof) {
  verifiedPanel?.removeAttribute("hidden");
  unverifiedPanel?.setAttribute("hidden", "");
  if (returned) void track("finland_signup_return");
}
if (proof) checkPanel?.removeAttribute('hidden');

checkButton?.addEventListener('click', async () => {
  if (!proof) return;
  checkButton.disabled = true;
  try {
    const result = await demandRequest('verify', { token: proof.token });
    if (result.verified === true) {
      checkPanel?.setAttribute('hidden', '');
      intentForm?.removeAttribute('hidden');
    } else if (checkStatus) {
      checkStatus.textContent = 'Vahvistusta ei vielä löytynyt. Avaa sähköpostin vahvistuslinkki ja kokeile uudelleen.';
    }
  } catch {
    if (checkStatus) checkStatus.textContent = 'Vahvistusta ei voitu tarkistaa. Yritä hetken kuluttua uudelleen.';
  } finally { checkButton.disabled = false; }
});

intentForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!proof || !intentForm.checkValidity()) return;
  const button = intentForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = intentForm.querySelector<HTMLElement>('[data-intent-status]');
  if (button) button.disabled = true;
  try {
    const result = await demandRequest('intent', { token: proof.token,
      intent: new FormData(intentForm).get('intent'), offerVersion: experiment.offerVersion });
    if (result.stored !== true) throw new Error('not_stored');
    if (status) status.textContent = 'Kiitos! Vastauksesi on tallennettu. Tämä ei ole tilaus.';
    intentForm.querySelectorAll<HTMLInputElement>('input').forEach(input => input.disabled = true);
  } catch {
    if (status) status.textContent = 'Vastausta ei voitu tallentaa. Yritä uudelleen.';
    if (button) button.disabled = false;
  }
});

if ((returned || proof) && form) {
  const genreInputs = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[name="genres"]'),
  );
  const genreStatus = form.querySelector<HTMLElement>("[data-genre-status]");
  const genreError = form.querySelector<HTMLElement>("[data-error='genres']");
  const formStatus = form.querySelector<HTMLElement>("[data-form-status]");
  const submitButton = form.querySelector<HTMLButtonElement>("button[type='submit']");
  let surveyStarted = false;
  let surveyStored = false;
  const updateMeasurement = () => {
    if (surveyStored) return;
    const allowed = measurementAllowed();
    form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button').forEach(control => control.disabled = !allowed);
    updateGenres();
    if (formStatus) formStatus.textContent = allowed ? '' : 'Salli vapaaehtoinen mittaus vastataksesi kyselyyn. Listalle liittyminen ei edellytä mittausta.';
  };
  document.addEventListener('splatter:measurement-choice', updateMeasurement);
  updateMeasurement();

  const recordSurveyStart = () => {
    if (surveyStarted) return;
    surveyStarted = true;
    void track("finland_survey_start");
  };
  form.addEventListener("input", recordSurveyStart, { once: true });

  function updateGenres() {
    const selected = genreInputs.filter((input) => input.checked).length;
    const atLimit = selected >= 3;
    genreInputs.forEach((input) => {
      input.disabled = !measurementAllowed() || (atLimit && !input.checked);
    });
    if (genreStatus) {
      genreStatus.textContent = `${fi.thankYou.genreCounter(selected)}${atLimit ? ` ${fi.thankYou.genreLimit}` : ""}`;
    }
    if (selected > 0 && genreError) genreError.textContent = "";
  }
  genreInputs.forEach((input) => input.addEventListener("change", updateGenres));
  updateGenres();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!measurementAllowed()) return;
    if (formStatus) formStatus.textContent = "";

    const data = new FormData(form);
    const reason = data.get("subscriptionReason");
    const frequency = data.get("viewingFrequency");
    const genres = data.getAll("genres").map(String);
    const device = data.get("device");

    const q1Error = form.querySelector<HTMLElement>("[data-error='subscriptionReason']");
    const q2Error = form.querySelector<HTMLElement>("[data-error='viewingFrequency']");
    if (q1Error) q1Error.textContent = reason ? "" : fi.thankYou.q1Error;
    if (q2Error) q2Error.textContent = frequency ? "" : fi.thankYou.q2Error;
    if (genreError) {
      genreError.textContent = genres.length >= 1 && genres.length <= 3 ? "" : fi.thankYou.q3Error;
    }

    if (!reason || !frequency || genres.length < 1 || genres.length > 3) {
      form.querySelector<HTMLElement>("[data-error]:not(:empty)")?.focus();
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = fi.thankYou.submitting;
    }

    const result = await submitSurvey({
      measurementConsent: true,
      answers: {
        subscriptionReason: String(reason),
        viewingFrequency: String(frequency),
        genres,
        ...(device ? { device: String(device) } : {}),
      },
      submittedAt: new Date().toISOString(),
      sessionId: getSessionId(),
      attribution: getAttribution(),
    });

    if (result.stored) {
      surveyStored = true;
      if (formStatus) formStatus.textContent = fi.thankYou.success;
      form.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button").forEach((control) => {
        control.disabled = true;
      });
      void track("finland_survey_complete");
    } else if (formStatus) {
      formStatus.textContent =
        result.reason === "not_configured"
          ? fi.thankYou.storageUnavailable
          : fi.thankYou.storageError;
    }

    if (submitButton && !result.stored) {
      submitButton.disabled = false;
      submitButton.textContent = fi.thankYou.submit;
    }
  });
}
