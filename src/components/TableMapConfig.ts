export const TIME_SLOTS: string[] = [];
for (let h = 9; h <= 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 19) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

export const TABLE_META: Record<string, { label: string; cap: number; zone: string }> = {
  T1:  { label: "Stolik 1",      cap: 2, zone: "Wnętrze" },
  T2:  { label: "Stolik 2",      cap: 2, zone: "Wnętrze" },
  T3:  { label: "Stolik 3",      cap: 2, zone: "Wnętrze" },
  T4:  { label: "Stolik 4",      cap: 2, zone: "Wnętrze" },
  T5:  { label: "Stolik 5",      cap: 2, zone: "Wnętrze" },
  T6:  { label: "Stolik 6",      cap: 2, zone: "Wnętrze" },
  T7:  { label: "Stolik 7",      cap: 2, zone: "Wnętrze" },
  T8:  { label: "Stolik 8",      cap: 1, zone: "Wnętrze" },
  T9:  { label: "Stolik 9",      cap: 2, zone: "Wnętrze" },
  T10: { label: "Stolik 10", cap: 4, zone: "Strefa lounge" },
  G1:  { label: "Ogród 1",       cap: 3, zone: "Ogród" },
  G2:  { label: "Ogród 2",       cap: 3, zone: "Ogród" },
  G3:  { label: "Ogród 3",       cap: 3, zone: "Ogród" },
  G4:  { label: "Ogród 4",       cap: 3, zone: "Ogród" },
  G5:  { label: "Ogród 5",       cap: 3, zone: "Ogród" },
  G6:  { label: "Ogród 6",       cap: 3, zone: "Ogród" },
};

export const MONTH_NAMES = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];
export const WEEKDAY_NAMES = ["Pon", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
