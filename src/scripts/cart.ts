export const CART_KEY = "mocna-cart";

export type CartItem = {
  id: string;
  name: string;
  price: string;
  qty: number;
  image?: string;
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CartItem;
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.name === "string" &&
    item.name.length > 0 &&
    typeof item.price === "string" &&
    typeof item.qty === "number" &&
    item.qty > 0
  );
}

export function clampQty(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.round(value)));
}

function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

function sanitizeCart(items: CartItem[]) {
  return items.filter(isCartItem);
}

function persistCart(items: CartItem[], notify = true) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  if (notify) {
    window.dispatchEvent(new CustomEvent("mocna:cart-updated"));
  }
}

/** Usuwa stare wpisy (np. product-0) i zapisuje tylko aktualne produkty ze sklepu. */
export function migrateCart() {
  const items = parseStoredCart(localStorage.getItem(CART_KEY));
  const sanitized = sanitizeCart(items);
  if (JSON.stringify(items) !== JSON.stringify(sanitized)) {
    persistCart(sanitized);
  }
  return sanitized;
}

export function readCart(): CartItem[] {
  return sanitizeCart(parseStoredCart(localStorage.getItem(CART_KEY)));
}

export function writeCart(items: CartItem[]) {
  persistCart(sanitizeCart(items));
}

export function removeCartItem(id: string) {
  writeCart(readCart().filter((item) => item.id !== id));
}

export function setCartItemQty(id: string, qty: number) {
  if (!Number.isFinite(qty) || qty < 1) {
    removeCartItem(id);
    return;
  }

  const cart = readCart();
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.qty = clampQty(qty);
  writeCart(cart);
}

export function parsePriceAmount(price: string): number | null {
  const match = price.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

export function formatPln(amount: number) {
  return `${amount.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} zł`;
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const unit = parsePriceAmount(item.price);
    if (unit === null) return sum;
    return sum + unit * item.qty;
  }, 0);
}

export function isSklepPath(pathname: string) {
  return pathname === "/sklep" || pathname.startsWith("/sklep/");
}
