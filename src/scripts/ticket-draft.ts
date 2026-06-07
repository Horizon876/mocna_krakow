const DRAFT_KEY = 'mocna-ticket-draft';

export type TicketDraft = {
  eventId: string;
  quantity: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function readTicketDraft(): Partial<TicketDraft> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function patchTicketDraft(patch: Partial<TicketDraft>): void {
  const current = readTicketDraft();
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearTicketDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function isTicketDraftComplete(draft: Partial<TicketDraft>): draft is TicketDraft {
  return !!(
    draft.eventId &&
    draft.quantity &&
    draft.quantity >= 1 &&
    draft.firstName &&
    draft.lastName &&
    draft.email &&
    draft.phone
  );
}
