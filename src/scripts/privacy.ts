export function setupPrivacyDialog() {
  const dialog = document.querySelector("[data-privacy-dialog]");
  const privacyTriggers = document.querySelectorAll<HTMLElement>("[data-open-privacy]");
  let lastTrigger: HTMLElement | null = null;

  const closePrivacy = () => {
    if (!(dialog instanceof HTMLDialogElement)) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    lastTrigger?.focus();
  };

  privacyTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!(dialog instanceof HTMLDialogElement)) return;
      lastTrigger = trigger;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
  });
  document.querySelectorAll("[data-close-privacy]").forEach((button) => {
    button.addEventListener("click", closePrivacy);
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closePrivacy();
  });
}

