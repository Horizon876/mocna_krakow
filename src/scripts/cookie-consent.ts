export const COOKIE_CONSENT_KEY = "mocna-cookie-consent";

export function initCookieConsent(): void {
  const banner = document.getElementById("cookie-consent");
  const acceptBtn = document.getElementById("cookie-consent-accept");
  if (!banner || !acceptBtn) return;

  const hide = () => {
    banner.classList.add("hidden");
    banner.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cookie-consent-open");
    document.body.style.removeProperty("--cookie-banner-offset");
  };

  try {
    if (localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted") {
      hide();
      return;
    }
  } catch {
    /* localStorage niedostępne (np. tryb prywatny) */
  }

  banner.classList.remove("hidden");
  banner.setAttribute("aria-hidden", "false");
  document.body.classList.add("cookie-consent-open");
  syncBodyOffset(banner);

  if (acceptBtn.dataset.bound === "1") return;
  acceptBtn.dataset.bound = "1";

  acceptBtn.addEventListener("click", () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      /* ignoruj */
    }
    hide();
  });

  window.addEventListener("resize", () => syncBodyOffset(banner), {
    passive: true,
  });
}

function syncBodyOffset(banner: HTMLElement): void {
  if (banner.classList.contains("hidden")) return;
  const height = banner.getBoundingClientRect().height;
  document.body.style.setProperty("--cookie-banner-offset", `${height}px`);
}
