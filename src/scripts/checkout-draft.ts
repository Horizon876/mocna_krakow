export const CHECKOUT_DRAFT_KEY = "mocna-checkout-draft";

const COURIER_SHIPPING_COST = 20;
const PACZKOMAT_SHIPPING_COST = 15;
const COD_FEE = 5;

export type CheckoutDraft = {
  shippingMethod?: "courier" | "paczkomat";
  paymentMethod?: "online" | "cod";
  paczkomatPoint?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
};

export type CompleteCheckoutDraft = Required<
  Pick<
    CheckoutDraft,
    | "shippingMethod"
    | "paymentMethod"
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "address"
    | "zipCode"
    | "city"
  >
> &
  Pick<CheckoutDraft, "paczkomatPoint">;

export function shippingCostFor(method: string) {
  return method === "paczkomat"
    ? PACZKOMAT_SHIPPING_COST
    : COURIER_SHIPPING_COST;
}

export function paymentCostFor(method: string) {
  return method === "cod" ? COD_FEE : 0;
}

function saveCheckoutDraft(draft: CheckoutDraft) {
  sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
}

export function patchCheckoutDraft(partial: Partial<CheckoutDraft>) {
  const existing = readCheckoutDraft() ?? {};
  const next: CheckoutDraft = { ...existing, ...partial };

  if (partial.shippingMethod === "courier") {
    delete next.paczkomatPoint;
  }

  saveCheckoutDraft(next);
}

export function readCheckoutDraft(): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

export function isCheckoutDraftComplete(
  draft: CheckoutDraft | null,
): draft is CompleteCheckoutDraft {
  if (!draft?.shippingMethod || !draft.paymentMethod) return false;
  if (!draft.firstName || !draft.lastName || !draft.email || !draft.phone)
    return false;
  if (draft.shippingMethod === "courier") {
    return !!(draft.address && draft.zipCode && draft.city);
  }
  return !!draft.paczkomatPoint;
}

export function checkoutResumeUrl(draft: CheckoutDraft | null): string {
  if (!draft?.shippingMethod) return "/checkout";
  if (!draft.paymentMethod) return "/checkout/platnosc";
  if (!isCheckoutDraftComplete(draft)) return "/checkout/dane";
  return "/checkout/podsumowanie";
}
