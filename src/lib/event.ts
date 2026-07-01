/** Czy termin wydarzenia już minął (sprzedaż biletów zamknięta). */
export function isEventPast(eventDate: Date | string, now = new Date()): boolean {
  return new Date(eventDate).getTime() <= now.getTime();
}
