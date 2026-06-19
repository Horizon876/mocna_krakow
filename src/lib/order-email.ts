import { Resend } from "resend";
import { BRAND, COLORS } from "../data/site";
import { getResendConfig, resolveEmailRecipient } from "./resend-config";

const BRAND_HEADING = `
  <p style="margin:0 0 10px;font-size:44px;font-weight:700;line-height:1;letter-spacing:-0.03em;text-align:center;">
    <span style="color:${COLORS.blue};">M</span><span style="color:${COLORS.red};">O</span><span style="color:${COLORS.yellow};">C</span><span style="color:${COLORS.green};">n</span><span style="color:${COLORS.pink};">a</span><span style="color:${COLORS.blue};">!</span>
  </p>`;

export type OrderEmailData = {
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  shippingMethod: string;
  paymentMethod: string;
  totalAmount: number; // w groszach
  items: Array<{ name: string; qty: number; price: string }>;
  paczkomatPoint?: string | null; // JSON string
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Złożone",
  paid: "Opłacone",
  confirmed: "Potwierdzone",
  processing: "W realizacji",
  shipped: "Wysłane",
  cancelled: "Anulowane",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#2c5ea9",
  paid: "#00955e",
  confirmed: "#00955e",
  processing: "#2c5ea9",
  shipped: "#2c5ea9",
  cancelled: "#de3c42",
};

const SHIPPING_LABELS: Record<string, string> = {
  courier: "Kurier",
  paczkomat: "Paczkomat InPost",
};

const PAYMENT_LABELS: Record<string, string> = {
  online: "Płatność online",
  cod: "Za pobraniem",
};

function formatPln(grosze: number) {
  return (grosze / 100).toFixed(2).replace(".", ",") + " zł";
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
) {
  const { apiKey, from, testTo } = getResendConfig();
  if (!apiKey) {
    console.warn("[order-email] Brak RESEND_API_KEY — e-mail pominięty.");
    return { ok: false, skipped: true as const };
  }

  const { to: recipient, subjectPrefix } = resolveEmailRecipient(
    to,
    from,
    testTo,
  );
  if (subjectPrefix) {
    console.info(
      `[order-email] DEV: wysyłka przekierowana ${to} → ${recipient}`,
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: recipient,
    subject: subjectPrefix + subject,
    html,
    text: subjectPrefix ? `${subjectPrefix}${text}` : text,
  });
  if (error) {
    console.error("[order-email] Błąd wysyłki:", JSON.stringify(error));
    return { ok: false, skipped: false as const, error };
  }
  return { ok: true };
}

function buildDeliveryBlock(data: OrderEmailData): string {
  const shippingLabel =
    SHIPPING_LABELS[data.shippingMethod] ?? data.shippingMethod;
  let paczkomatInfo = "";

  if (data.shippingMethod === "paczkomat" && data.paczkomatPoint) {
    try {
      const p = JSON.parse(data.paczkomatPoint);
      const name = p.name ?? p.id ?? "";
      const addr = [p.address?.line1, p.address?.city]
        .filter(Boolean)
        .join(", ");
      paczkomatInfo = `<strong>Paczkomat:</strong> ${name}${addr ? " — " + addr : ""}<br>`;
    } catch {
      paczkomatInfo = `<strong>Paczkomat:</strong> ${data.paczkomatPoint}<br>`;
    }
  }

  const addressLine =
    data.shippingMethod !== "paczkomat"
      ? `<strong>Adres dostawy:</strong> ${data.address}, ${data.zipCode} ${data.city}<br>`
      : "";

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:1px solid #f0e6d8;margin-top:16px;">
      <tr>
        <td style="padding:16px 20px;font-size:14px;line-height:1.9;color:#333;">
          <strong>Dostawa:</strong> ${shippingLabel}<br>
          ${paczkomatInfo}
          ${addressLine}
          <strong>Płatność:</strong> ${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}
        </td>
      </tr>
    </table>`;
}

function buildItemsTable(data: OrderEmailData): string {
  const rows = data.items
    .map(
      (it) => `
    <tr>
      <td style="padding:6px 8px;font-size:13px;color:#333;">${it.qty}× ${it.name}</td>
      <td style="padding:6px 8px;font-size:13px;color:#555;text-align:right;">${it.price}</td>
    </tr>`,
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;font-size:12px;text-align:left;color:#666;font-weight:600;">Produkt</th>
          <th style="padding:8px;font-size:12px;text-align:right;color:#666;font-weight:600;">Cena</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="border-top:2px solid #eee;">
          <td style="padding:10px 8px;font-size:15px;font-weight:700;color:#1c1c1c;">Razem</td>
          <td style="padding:10px 8px;font-size:15px;font-weight:700;color:#1c1c1c;text-align:right;">${formatPln(data.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>`;
}

function buildStatusBadge(status: string): string {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? "#333333";
  return `<span style="display:inline-block;padding:6px 14px;border-radius:0;background:${color};color:#ffffff;font-weight:700;font-size:13px;border:2px solid ${color};">${label}</span>`;
}

type StatusMessageConfig = {
  subject: string;
  heading: string;
  message: string;
  accentColor: string;
  showDelivery: boolean;
  showItems: boolean;
};

function getStatusConfig(
  status: string,
  data: OrderEmailData,
): StatusMessageConfig {
  switch (status) {
    case "pending":
      return {
        subject: `Zamówienie złożone #${data.orderId} — MOCna!`,
        heading: "Dziękujemy za zamówienie!",
        message: `Twoje zamówienie zostało przyjęte i oczekuje na płatność. Zaraz zostaniesz przekierowany/a do płatności (lub paczka zostanie wysłana za pobraniem).`,
        accentColor: COLORS.blue,
        showDelivery: true,
        showItems: true,
      };
    case "paid":
      return {
        subject: `Zamówienie opłacone #${data.orderId} — MOCna!`,
        heading: "Płatność potwierdzona!",
        message: `Świetnie! Twoja płatność została zaksięgowana. Przygotowujemy Twoje zamówienie do wysyłki.`,
        accentColor: COLORS.green,
        showDelivery: true,
        showItems: true,
      };
    case "confirmed":
      return {
        subject: `Zamówienie potwierdzone #${data.orderId} — MOCna!`,
        heading: "Zamówienie potwierdzone!",
        message: `Twoje zamówienie za pobraniem zostało potwierdzone.`,
        accentColor: COLORS.green,
        showDelivery: true,
        showItems: true,
      };
    case "processing":
      return {
        subject: `Zamówienie w realizacji #${data.orderId} — MOCna!`,
        heading: "Twoje zamówienie jest w realizacji",
        message: `Nasz zespół właśnie przygotowuje Twoje zamówienie. Wkrótce zostanie ono nadane do wysyłki.`,
        accentColor: COLORS.blue,
        showDelivery: true,
        showItems: false,
      };
    case "shipped":
      return {
        subject: `Zamówienie wysłane #${data.orderId} — MOCna!`,
        heading: "Paczka w drodze!",
        message: `Twoje zamówienie zostało nadane i jest w drodze do Ciebie. W razie pytań skontaktuj się z nami.`,
        accentColor: COLORS.blue,
        showDelivery: true,
        showItems: false,
      };
    case "cancelled":
      return {
        subject: `Zamówienie anulowane #${data.orderId} — MOCna!`,
        heading: "Zamówienie anulowane",
        message: `Informujemy, że Twoje zamówienie zostało anulowane. Jeśli masz pytania lub chcesz złożyć nowe zamówienie, napisz do nas.`,
        accentColor: COLORS.red,
        showDelivery: false,
        showItems: true,
      };
    default:
      return {
        subject: `Aktualizacja zamówienia #${data.orderId} — MOCna!`,
        heading: "Status zamówienia zaktualizowany",
        message: `Status Twojego zamówienia został zmieniony na: ${STATUS_LABELS[status] ?? status}.`,
        accentColor: COLORS.blue,
        showDelivery: false,
        showItems: false,
      };
  }
}

function buildOrderHtml(data: OrderEmailData, status: string): string {
  const cfg = getStatusConfig(status, data);
  return `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff8f0;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#fff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:4px solid ${cfg.accentColor};text-align:center;">
              ${BRAND_HEADING}
              <p style="margin:8px 0 0;font-size:14px;color:#666;">${cfg.heading}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 8px;font-size:16px;">Cześć <strong>${data.firstName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">${cfg.message}</p>

              <p style="margin:0 0 8px;font-size:13px;color:#666;">
                Status zamówienia: ${buildStatusBadge(status)}&nbsp;&nbsp;
                <span style="color:#aaa;">nr #${data.orderId}</span>
              </p>

              ${cfg.showItems ? buildItemsTable(data) : ""}
              ${cfg.showDelivery ? buildDeliveryBlock(data) : ""}

              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#999;">
                Pytania? Napisz na
                <a href="mailto:${BRAND.email}" style="color:${COLORS.blue};">${BRAND.email}</a>
                lub zadzwoń: ${BRAND.phone}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #eee;font-size:12px;color:#aaa;text-align:center;">
              MOCna! — ${BRAND.address}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrderText(data: OrderEmailData, status: string): string {
  const cfg = getStatusConfig(status, data);
  const itemsLines = data.items
    .map((it) => `  ${it.qty}× ${it.name} — ${it.price}`)
    .join("\n");
  return [
    `Cześć ${data.firstName},`,
    "",
    cfg.message,
    "",
    `Status: ${STATUS_LABELS[status] ?? status}`,
    `Nr zamówienia: #${data.orderId}`,
    "",
    cfg.showItems && itemsLines ? `Produkty:\n${itemsLines}` : "",
    `Razem: ${formatPln(data.totalAmount)}`,
    "",
    cfg.showDelivery
      ? `Dostawa: ${SHIPPING_LABELS[data.shippingMethod] ?? data.shippingMethod}`
      : "",
    cfg.showDelivery && data.shippingMethod !== "paczkomat"
      ? `Adres: ${data.address}, ${data.zipCode} ${data.city}`
      : "",
    "",
    `Kontakt: ${BRAND.email} | ${BRAND.phone}`,
    "MOCna! — " + BRAND.address,
  ]
    .filter((l) => l !== undefined && l !== null && !(l === "" && false))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export async function sendOrderEmail(data: OrderEmailData, status: string) {
  const cfg = getStatusConfig(status, data);
  return sendEmail(
    data.email,
    cfg.subject,
    buildOrderHtml(data, status),
    buildOrderText(data, status),
  );
}
