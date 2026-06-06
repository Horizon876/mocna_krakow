type ScheduleEntry = {
  label: string;
  days: number[];
  open: string;
  close: string;
};

type SchedulePayload = {
  schedule: ScheduleEntry[];
  labels: string[];
};

function parseMinutes(time: string) {
  const [hours, minutes] = time.trim().split(":").map(Number);
  return hours * 60 + minutes;
}

function getLocalNow() {
  const now = new Date();
  return {
    dayIndex: now.getDay(),
    minutes: now.getHours() * 60 + now.getMinutes(),
  };
}

function findScheduleForDay(schedule: ScheduleEntry[], dayIndex: number) {
  return schedule.find((entry) => entry.days.includes(dayIndex));
}

function getStatus(payload: SchedulePayload) {
  const { schedule, labels } = payload;
  const { dayIndex, minutes } = getLocalNow();
  const today = findScheduleForDay(schedule, dayIndex);
  if (!today) {
    return { open: false, detail: "Brak danych o godzinach otwarcia." };
  }

  const open = parseMinutes(today.open);
  const close = parseMinutes(today.close);
  const isOpen = minutes >= open && minutes < close;

  if (isOpen) {
    return {
      open: true,
      detail: `Zapraszamy na kawę. Jesteśmy otwarci do ${today.close}.`,
    };
  }

  if (minutes < open) {
    return {
      open: false,
      detail: `Jeszcze zamknięte. Otwieramy dziś o ${today.open}.`,
    };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDayIndex = (dayIndex + offset) % 7;
    const nextEntry = findScheduleForDay(schedule, nextDayIndex);
    if (!nextEntry) continue;

    const nextWeekday = labels[nextDayIndex] ?? "";
    const dayLabel = offset === 1 ? "jutro" : nextWeekday.toLowerCase();
    return {
      open: false,
      detail: `Dziś jesteśmy już zamknięci. Zapraszamy ${dayLabel} od ${nextEntry.open}.`,
    };
  }

  return { open: false, detail: "Dziś jesteśmy już zamknięci." };
}

function updateOpenStatus() {
  document.querySelectorAll("[data-open-schedule]").forEach((card) => {
    const raw = card.getAttribute("data-open-schedule");
    const panel = card.querySelector("[data-open-status]");
    const label = card.querySelector("[data-open-label]");
    const detail = card.querySelector("[data-open-detail]");
    if (!raw || !panel || !label || !detail) return;

    let payload: SchedulePayload | null = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      label.textContent = "Brak danych";
      detail.textContent = "Nie udało się odczytać godzin otwarcia.";
      return;
    }

    const status = getStatus(payload);
    label.textContent = status.open ? "Teraz otwarte" : "Teraz zamknięte";
    detail.textContent = status.detail;

    panel.classList.toggle("bg-green", status.open);
    panel.classList.toggle("bg-red", !status.open);
    panel.classList.toggle("bg-graphite", false);

  });
}

function initOpenStatus() {
  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60_000);
}

initOpenStatus();
document.addEventListener("astro:page-load", initOpenStatus);
