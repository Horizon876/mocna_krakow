import { clampQty, migrateCart, readCart, writeCart } from "./cart";

function initShopCards() {
  document.querySelectorAll("[data-product-card]").forEach((card) => {
    const qtyInput = card.querySelector<HTMLInputElement>("[data-qty]");
    const minusBtn = card.querySelector<HTMLButtonElement>("[data-qty-minus]");
    const plusBtn = card.querySelector<HTMLButtonElement>("[data-qty-plus]");
    const addBtn = card.querySelector<HTMLButtonElement>("[data-add-to-cart]");
    const addDefault = addBtn?.querySelector<HTMLElement>("[data-add-default]");
    const addSuccess = addBtn?.querySelector<HTMLElement>("[data-add-success]");
    let resetTimer: number | undefined;

    if (!qtyInput || !minusBtn || !plusBtn || !addBtn) return;
    if (card.getAttribute("data-qty-ready") === "true") return;
    card.setAttribute("data-qty-ready", "true");

    const getQty = () => clampQty(parseInt(qtyInput.value, 10) || 1);

    const setQty = (next: number) => {
      qtyInput.value = String(clampQty(next));
    };

    minusBtn.addEventListener("click", () => {
      setQty(getQty() - 1);
    });

    plusBtn.addEventListener("click", () => {
      setQty(getQty() + 1);
    });

    qtyInput.addEventListener("change", () => {
      setQty(parseInt(qtyInput.value, 10) || 1);
    });

    addBtn.addEventListener("click", () => {
      const id = card.getAttribute("data-product-id") ?? "";
      const name = card.getAttribute("data-product-name") ?? "";
      const price = card.getAttribute("data-product-price") ?? "";
      const image = card.getAttribute("data-product-image") ?? "";
      const qty = getQty();

      if (!id || !name) return;

      const cart = readCart();
      const existing = cart.find((item) => item.id === id);

      if (existing) {
        existing.qty = clampQty(existing.qty + qty);
        if (image) existing.image = image;
      } else {
        cart.push({
          id,
          name,
          price,
          qty,
          ...(image ? { image } : {}),
        });
      }

      writeCart(cart);
      window.dispatchEvent(new CustomEvent("mocna:cart-added"));

      if (!addDefault || !addSuccess) return;

      if (resetTimer) window.clearTimeout(resetTimer);

      addBtn.classList.add("is-added");
      addDefault.classList.add("hidden");
      addSuccess.classList.remove("hidden");
      addBtn.disabled = true;

      resetTimer = window.setTimeout(() => {
        addBtn.classList.remove("is-added");
        addDefault.classList.remove("hidden");
        addSuccess.classList.add("hidden");
        addBtn.disabled = false;
      }, 1100);
    });
  });
}

function initShop() {
  migrateCart();
  initShopCards();
}

initShop();
document.addEventListener("astro:page-load", initShop);
