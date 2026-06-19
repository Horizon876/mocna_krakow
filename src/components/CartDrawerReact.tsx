import { useEffect, useState, useRef, useCallback } from "react";
import { PRODUCTS, COLORS } from "@data/site";
import {
  readCart,
  cartTotal,
  clampQty,
  formatPln,
  migrateCart,
  parsePriceAmount,
  removeCartItem,
  setCartItemQty,
  type CartItem,
} from "../scripts/cart";

function normalizePath(pathname: string) {
  const path = pathname.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

function isCheckoutPath(pathname?: string) {
  const path = normalizePath(pathname ?? window.location.pathname);
  return path === "/checkout" || path.startsWith("/checkout/");
}

function linePrice(item: CartItem) {
  const unit = parsePriceAmount(item.price);
  return unit !== null ? formatPln(unit * item.qty) : item.price;
}

function enrichItem(
  item: CartItem,
): CartItem & { emoji: string; color: string; image?: string } {
  const p = PRODUCTS.find((x) => x.id === item.id);
  return {
    ...item,
    emoji: item.emoji || p?.emoji || "🛍️",
    color:
      item.color || (p ? COLORS[p.color as keyof typeof COLORS] : "#2c5ea9"),
    image: item.image || p?.image,
  };
}

export default function CartDrawerReact() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const loadCart = useCallback(() => {
    setItems(readCart());
  }, []);

  const closeCartDrawer = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
    if (lastFocus.current) {
      lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, []);

  const openCartDrawer = useCallback(() => {
    if (isCheckoutPath()) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
    document.body.style.overflow = "hidden";
    loadCart();
    // Focus the close button after a short delay to allow rendering
    setTimeout(() => {
      closeRef.current?.focus();
    }, 10);
  }, [loadCart]);

  useEffect(() => {
    migrateCart();
    loadCart();
    setIsCheckout(isCheckoutPath());

    const win = window as any;
    win.mocnaOpenCart = openCartDrawer;
    win.__mocnaCartDrawerReady = true;

    const handleOpen = () => openCartDrawer();
    const handleUpdate = () => loadCart();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mocna-cart") loadCart();
    };
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeCartDrawer();
    };

    window.addEventListener("mocna:open-cart", handleOpen);
    window.addEventListener("mocna:cart-updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("mocna:open-cart", handleOpen);
      window.removeEventListener("mocna:cart-updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [openCartDrawer, closeCartDrawer, isOpen, loadCart]);

  if (isCheckout) {
    return null;
  }

  const total = cartTotal(items);

  return (
    <div
      id="cart-drawer"
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isOpen
          ? "visible opacity-100 pointer-events-auto"
          : "invisible opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
      {...(!isOpen ? { inert: "" } : {})}
    >
      <button
        type="button"
        className="absolute inset-0 border-0 bg-graphite/50 backdrop-blur-[2px] cursor-pointer"
        onClick={closeCartDrawer}
        aria-label="Zamknij koszyk"
      />

      <aside
        id="cart-drawer-panel"
        className={`absolute top-0 right-0 flex h-full w-[min(100vw,36rem)] flex-col bg-[#f9f6f1] shadow-[-20px_0_60px_-10px_rgba(20,20,20,0.25)] transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* ── Nagłówek ── */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-[#f0ece6] bg-white px-6 py-[1.35rem]">
          <div className="flex items-center gap-2.5">
            <svg
              className="h-[1.4rem] w-[1.4rem] shrink-0 text-orange"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
              <path d="M6 6l-1.2-3H2" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <h2
              id="cart-drawer-title"
              className="m-0 text-[1.35rem] font-bold leading-none tracking-[-0.025em] text-[#1c1c1c]"
            >
              Koszyk
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="grid h-[2.4rem] w-[2.4rem] shrink-0 place-items-center rounded-[0.6rem] text-[#777] transition-colors duration-150 hover:bg-[#f0ece6] hover:text-[#1c1c1c]"
            onClick={closeCartDrawer}
            aria-label="Zamknij koszyk"
          >
            <svg
              className="h-[1.2rem] w-[1.2rem]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* ── Lista produktów ── */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-orange">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-0 px-4 pt-12 pb-4 text-center">
              <div
                className="grid h-20 w-20 place-items-center bg-white border-[1.5px] border-[#e8e4de] text-[#bbb]"
                aria-hidden="true"
              >
                <svg
                  className="h-9 w-9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
                  <path d="M6 6l-1.2-3H2" strokeLinecap="round" />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                </svg>
              </div>
              <p className="mt-5 text-[1.1rem] font-bold text-[#1c1c1c]">
                Koszyk jest pusty
              </p>
              <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#888]">
                Dodaj produkty ze sklepu MOCnej,
                <br />
                aby złożyć zamówienie.
              </p>
              <a
                href="/sklep"
                onClick={closeCartDrawer}
                className="btn-orange mt-6 min-w-[14rem] justify-center"
              >
                Przejdź do sklepu
              </a>
            </div>
          ) : (
            <ul className="m-0 flex flex-col gap-[0.85rem] p-0 list-none">
              {items.map((raw) => {
                const item = enrichItem(raw);
                return (
                  <li
                    key={item.id}
                    className="group grid grid-cols-[5.5rem_1fr] grid-rows-[auto_auto] overflow-hidden bg-white border-[1.5px] border-[#e8e4de] shadow-[0_4px_16px_-8px_rgba(20,20,20,0.12)] transition-shadow duration-200 hover:shadow-[0_6px_20px_-8px_rgba(20,20,20,0.18)]"
                  >
                    <div
                      className="col-start-1 row-span-2 grid min-h-[7rem] place-items-center border-r-[1.5px] border-[#e8e4de]"
                      style={{ background: `${item.color}1a` }}
                      aria-hidden="true"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="block h-full w-full object-cover"
                        />
                      ) : (
                        <span className="select-none text-[2.4rem] leading-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.08)]">
                          {item.emoji}
                        </span>
                      )}
                    </div>
                    <div className="col-start-2 row-start-1 flex min-w-0 items-start justify-between gap-2 px-[0.95rem] pb-[0.4rem] pt-[0.85rem]">
                      <div className="min-w-0 flex-1">
                        <h3 className="m-0 text-[0.9375rem] font-bold leading-[1.3] text-[#1c1c1c]">
                          {item.name}
                        </h3>
                        <p className="mt-[0.2rem] text-[0.8125rem] text-[#888]">
                          {item.price} / szt.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="grid h-[1.9rem] w-[1.9rem] shrink-0 place-items-center rounded-none border-[1.5px] border-[#de3c42] bg-[#de3c42] text-white cursor-pointer hover:bg-[#c2343a] hover:border-[#c2343a]"
                        onClick={() => removeCartItem(item.id)}
                        aria-label={`Usuń ${item.name} z koszyka`}
                      >
                        <svg
                          className="h-[0.9rem] w-[0.9rem]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-between gap-2 border-t border-dashed border-[#ede9e3] px-[0.95rem] pb-[0.85rem] pt-[0.6rem]">
                      <div className="inline-flex items-center overflow-hidden border-[1.5px] border-[#ddd8d0] bg-[#f9f6f1]">
                        <button
                          type="button"
                          className="grid h-[2.1rem] w-[2.1rem] place-items-center bg-transparent text-[1.15rem] leading-none text-[#444] transition-colors duration-150 cursor-pointer hover:bg-[#ede9e3]"
                          onClick={() => setCartItemQty(item.id, item.qty - 1)}
                          aria-label={`Zmniejsz ilość — ${item.name}`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          step="1"
                          inputMode="numeric"
                          className="h-[2.1rem] w-[3rem] appearance-none border-y-0 border-x-[1.5px] border-x-[#ddd8d0] bg-white text-center text-[0.9rem] font-bold text-[#1c1c1c] focus:outline-none focus:ring-[inset_0_0_0_2px_rgba(44,94,169,0.2)]"
                          value={item.qty}
                          onChange={(e) =>
                            setCartItemQty(
                              item.id,
                              clampQty(parseInt(e.target.value, 10) || 1),
                            )
                          }
                          aria-label={`Ilość — ${item.name}`}
                        />
                        <button
                          type="button"
                          className="grid h-[2.1rem] w-[2.1rem] place-items-center bg-transparent text-[1.15rem] leading-none text-[#444] transition-colors duration-150 cursor-pointer hover:bg-[#ede9e3]"
                          onClick={() => setCartItemQty(item.id, item.qty + 1)}
                          aria-label={`Zwiększ ilość — ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="whitespace-nowrap text-[1.1rem] font-extrabold tracking-[-0.025em] text-[#1c1c1c]">
                        {linePrice(item)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Stopka ── */}
        {items.length > 0 && (
          <footer className="flex shrink-0 flex-col gap-[0.85rem] border-t-2 border-[#f0ece6] bg-white px-6 pb-6 pt-5">
            <div className="flex items-center justify-between gap-4 border-[1.5px] border-[#00955e] bg-[#00955e] px-[1.1rem] py-[0.85rem]">
              <span className="text-[0.875rem] font-bold text-white">
                Razem do zapłaty
              </span>
              <span className="text-[1.45rem] font-extrabold tracking-[-0.03em] text-white">
                {formatPln(total)}
              </span>
            </div>
            <a
              href="/checkout"
              className="btn-orange flex min-h-[3.1rem] items-center justify-center gap-[0.6rem] text-[1rem]"
              onClick={closeCartDrawer}
            >
              <svg
                className="h-[1.15rem] w-[1.15rem]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
              </svg>
              Przejdź do kasy
            </a>
          </footer>
        )}
      </aside>
    </div>
  );
}
