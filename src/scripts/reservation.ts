function scrollToBookingSection() {
  const anchor =
    document.getElementById("selection-summary") ||
    document.getElementById("booking-form");
  if (!anchor) return;

  const navOffset =
    parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) ||
    72;
  const extraGap = 24;
  const top =
    anchor.getBoundingClientRect().top + window.scrollY - navOffset - extraGap;

  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function showFormError(message: string) {
  const el = document.getElementById("form-error");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideFormError() {
  const el = document.getElementById("form-error");
  if (!el) return;
  el.classList.add("hidden");
  el.textContent = "";
}

function showSuccess(tableId: string, date: string, time: string) {
  const flow = document.getElementById("booking-flow");
  const success = document.getElementById("booking-success");
  const text = document.getElementById("booking-success-text");
  if (!flow || !success || !text) return;

  const dateLabel = date.split("-").reverse().join(".");
  text.innerHTML =
    `Stolik <strong class="text-graphite">${tableId}</strong> na ` +
    `<strong class="text-graphite">${dateLabel}</strong> ` +
    `godz. <strong class="text-graphite">${time}</strong> — zarezerwowany. ` +
    `Potwierdzenie wyślemy na podany e-mail.`;

  flow.classList.add("hidden");
  success.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initBookingForm() {
  const form = document.getElementById(
    "booking-form",
  ) as HTMLFormElement | null;
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormError();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const btn = document.getElementById(
      "form-submit-btn",
    ) as HTMLButtonElement | null;
    const originalLabel = btn?.textContent ?? "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Rezerwuję…";
    }

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        body: new FormData(form),
      });
      const data = await res.json().catch(() => null);

      if (data?.success) {
        showSuccess(data.tableId, data.date, data.time);
        return;
      }

      showFormError(
        data?.message ?? "Nie udało się złożyć rezerwacji. Spróbuj ponownie.",
      );
    } catch {
      showFormError("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    }
  });
}

document.addEventListener("tableSelected", (e) => {
  const { tableId, date, time } = (e as CustomEvent).detail;

  const form = document.getElementById("booking-form") as HTMLFormElement;
  if (!form) return;

  hideFormError();
  (document.getElementById("form-table-id") as HTMLInputElement).value =
    tableId ?? "";
  (document.getElementById("form-date") as HTMLInputElement).value = date ?? "";
  (document.getElementById("form-time") as HTMLInputElement).value = time ?? "";

  form.classList.remove("hidden");
  requestAnimationFrame(() => scrollToBookingSection());
});

document.addEventListener("bookingReset", () => {
  const form = document.getElementById("booking-form") as HTMLFormElement;
  if (!form) return;

  hideFormError();
  form.classList.add("hidden");
  form.reset();
});

initBookingForm();
document.addEventListener("astro:page-load", initBookingForm);
