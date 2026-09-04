import { fi } from "../content/fi";
import {
  captureFirstTouch,
  confirmSignupFromRedirect,
  getAttribution,
  getSessionId,
  track,
} from "../lib/analytics";
import { submitSurvey } from "../lib/survey-storage";
import { setupPrivacyDialog } from "./privacy";

captureFirstTouch();
setupPrivacyDialog();

const confirmed = confirmSignupFromRedirect();
const verifiedPanel = document.querySelector<HTMLElement>("[data-confirmed]");
const unverifiedPanel = document.querySelector<HTMLElement>("[data-unverified]");
const form = document.querySelector<HTMLFormElement>("[data-survey-form]");

if (confirmed) {
  verifiedPanel?.removeAttribute("hidden");
  unverifiedPanel?.setAttribute("hidden", "");
  void track("finland_signup_success");
}

if (confirmed && form) {
  const genreInputs = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[name="genres"]'),
  );
  const genreStatus = form.querySelector<HTMLElement>("[data-genre-status]");
  const genreError = form.querySelector<HTMLElement>("[data-error='genres']");
  const formStatus = form.querySelector<HTMLElement>("[data-form-status]");
  const submitButton = form.querySelector<HTMLButtonElement>("button[type='submit']");
  let surveyStarted = false;

  const recordSurveyStart = () => {
    if (surveyStarted) return;
    surveyStarted = true;
    void track("finland_survey_start");
  };
  form.addEventListener("input", recordSurveyStart, { once: true });

  const updateGenres = () => {
    const selected = genreInputs.filter((input) => input.checked).length;
    const atLimit = selected >= 3;
    genreInputs.forEach((input) => {
      input.disabled = atLimit && !input.checked;
    });
    if (genreStatus) {
      genreStatus.textContent = `${fi.thankYou.genreCounter(selected)}${atLimit ? ` ${fi.thankYou.genreLimit}` : ""}`;
    }
    if (selected > 0 && genreError) genreError.textContent = "";
  };
  genreInputs.forEach((input) => input.addEventListener("change", updateGenres));
  updateGenres();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
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
