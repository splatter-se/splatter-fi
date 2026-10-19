const consentKey = 'splatter.fi.measurement-consent.v1';

export function measurementAllowed() {
  try { return window.sessionStorage.getItem(consentKey) === 'yes'; }
  catch { return false; }
}

export function setupMeasurement() {
  const panel = document.querySelector<HTMLElement>('[data-measurement]');
  try {
    if (!window.sessionStorage.getItem(consentKey)) panel?.removeAttribute('hidden');
  } catch { /* Measurement stays off if storage is unavailable. */ }
  document.querySelectorAll<HTMLButtonElement>('[data-measurement-choice]').forEach(button => {
    button.addEventListener('click', () => {
      try { window.sessionStorage.setItem(consentKey, button.dataset.measurementChoice || 'no'); }
      catch { /* No consent persistence means no analytics. */ }
      panel?.setAttribute('hidden', '');
      document.dispatchEvent(new CustomEvent('splatter:measurement-choice'));
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-measurement-settings]').forEach(button => {
    button.addEventListener('click', () => {
      button.closest<HTMLDialogElement>('dialog')?.close();
      panel?.removeAttribute('hidden');
    });
  });
}
