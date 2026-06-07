import { Resend } from 'resend';
import { BRAND, COLORS } from '../data/site';
import { getResendConfig, resolveEmailRecipient } from './resend-config';
import { extractBase64FromDataUrl } from './ticket-generator';

const BRAND_HEADING = `
  <p style="margin:0 0 10px;font-size:44px;font-weight:700;line-height:1;letter-spacing:-0.03em;text-align:center;">
    <span style="color:${COLORS.blue};">M</span><span style="color:${COLORS.red};">O</span><span style="color:${COLORS.yellow};">C</span><span style="color:${COLORS.green};">n</span><span style="color:${COLORS.pink};">a</span><span style="color:${COLORS.orange};">!</span>
  </p>`;

export type TicketEmailData = {
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  eventTitle: string;
  eventDate: Date;
  quantity: number;
  totalAmount: number; // w groszach
  tickets: Array<{ ticketNumber: string; qrDataUrl: string }>;
};

function qrContentId(ticketNumber: string): string {
  return `qr-${ticketNumber}`;
}

function formatPln(grosze: number) {
  return (grosze / 100).toFixed(2).replace('.', ',') + ' zł';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildTicketsHtml(tickets: TicketEmailData['tickets']): string {
  return tickets.map((t, i) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${COLORS.blue};margin-top:12px;background:#f8faff;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#666;letter-spacing:0.1em;text-transform:uppercase;">
            Bilet ${i + 1} z ${tickets.length}
          </p>
          <p style="margin:0 0 12px;font-size:22px;font-weight:900;color:#1c1c1c;letter-spacing:0.15em;font-family:monospace;">
            ${t.ticketNumber.replace(/(.{3})(.{3})(.{3})/, '$1 $2 $3')}
          </p>
          <img src="cid:${qrContentId(t.ticketNumber)}" alt="QR kod biletu ${t.ticketNumber}" width="160" height="160"
            style="display:block;border:1px solid #e5e5e5;" />
          <p style="margin:8px 0 0;font-size:11px;color:#999;">
            Pokaż ten kod QR lub podaj numer przy wejściu.
          </p>
        </td>
      </tr>
    </table>`).join('');
}

function buildEmailHtml(data: TicketEmailData): string {
  const ticketsBlock = buildTicketsHtml(data.tickets);
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
            <td style="padding:28px 32px 20px;border-bottom:4px solid ${COLORS.blue};text-align:center;">
              ${BRAND_HEADING}
              <p style="margin:8px 0 0;font-size:14px;color:#666;">Twoje bilety są gotowe!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 8px;font-size:16px;">Cześć <strong>${data.firstName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
                Dziękujemy za zakup biletów! Poniżej znajdziesz swoje bilety na wydarzenie.
                Pokaż kod QR lub podaj 9-cyfrowy numer przy wejściu.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border:1px solid #dce4ff;margin-bottom:16px;">
                <tr>
                  <td style="padding:16px 20px;font-size:14px;line-height:1.9;color:#333;">
                    <strong>Wydarzenie:</strong> ${data.eventTitle}<br>
                    <strong>Data:</strong> ${formatDate(data.eventDate)}<br>
                    <strong>Liczba biletów:</strong> ${data.quantity}<br>
                    <strong>Łącznie zapłacono:</strong> ${formatPln(data.totalAmount)}<br>
                    <strong>Nr zamówienia:</strong> <span style="color:#aaa;">#${data.orderId.split('-')[0]}</span>
                  </td>
                </tr>
              </table>

              ${ticketsBlock}

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

function buildEmailText(data: TicketEmailData): string {
  const ticketLines = data.tickets.map((t, i) =>
    `Bilet ${i + 1}/${data.tickets.length}: ${t.ticketNumber}`
  ).join('\n');

  return [
    `Cześć ${data.firstName},`,
    '',
    `Twoje bilety na wydarzenie "${data.eventTitle}" są gotowe!`,
    '',
    `Data: ${formatDate(data.eventDate)}`,
    `Liczba biletów: ${data.quantity}`,
    `Łącznie: ${formatPln(data.totalAmount)}`,
    `Nr zamówienia: #${data.orderId.split('-')[0]}`,
    '',
    'Twoje numery biletów (pokaż przy wejściu):',
    ticketLines,
    '',
    `Kontakt: ${BRAND.email} | ${BRAND.phone}`,
    'MOCna! — ' + BRAND.address,
  ].join('\n');
}

export async function sendTicketEmail(data: TicketEmailData): Promise<{ ok: boolean }> {
  const { apiKey, from, testTo } = getResendConfig();
  if (!apiKey) {
    console.warn('[ticket-email] Brak RESEND_API_KEY — e-mail pominięty.');
    return { ok: false };
  }

  const { to: recipient, subjectPrefix } = resolveEmailRecipient(data.email, from, testTo);
  const subject = `${subjectPrefix}Twoje bilety: ${data.eventTitle} — MOCna!`;

  const attachments = data.tickets.map((t, i) => ({
    filename: `bilet-${i + 1}-${t.ticketNumber}.png`,
    content: extractBase64FromDataUrl(t.qrDataUrl),
    contentType: 'image/png',
    contentId: qrContentId(t.ticketNumber),
  }));

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: recipient,
    subject,
    html: buildEmailHtml(data),
    text: buildEmailText(data),
    attachments,
  });

  if (error) {
    console.error('[ticket-email] Błąd wysyłki:', JSON.stringify(error));
    return { ok: false };
  }
  return { ok: true };
}

export async function sendTicketPendingEmail(data: {
  firstName: string;
  email: string;
  eventTitle: string;
  quantity: number;
  totalAmount: number;
  orderId: string;
}): Promise<{ ok: boolean }> {
  const { apiKey, from, testTo } = getResendConfig();
  if (!apiKey) {
    console.warn('[ticket-email] Brak RESEND_API_KEY — e-mail pominięty.');
    return { ok: false };
  }

  const { to: recipient, subjectPrefix } = resolveEmailRecipient(data.email, from, testTo);
  const subject = `${subjectPrefix}Zamówienie biletów złożone — MOCna!`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff8f0;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#fff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:4px solid ${COLORS.orange};text-align:center;">
              ${BRAND_HEADING}
              <p style="margin:8px 0 0;font-size:14px;color:#666;">Zamówienie przyjęte!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 8px;font-size:16px;">Cześć <strong>${data.firstName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
                Twoje zamówienie zostało przyjęte i oczekuje na płatność. Za chwilę zostaniesz przekierowany/a do Stripe.
                Po opłaceniu wyślemy Ci bilety z kodami QR.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:1px solid #f0e6d8;margin-top:16px;">
                <tr>
                  <td style="padding:16px 20px;font-size:14px;line-height:1.9;color:#333;">
                    <strong>Wydarzenie:</strong> ${data.eventTitle}<br>
                    <strong>Liczba biletów:</strong> ${data.quantity}<br>
                    <strong>Do zapłaty:</strong> ${(data.totalAmount / 100).toFixed(2).replace('.', ',')} zł<br>
                    <strong>Nr zamówienia:</strong> <span style="color:#aaa;">#${data.orderId.split('-')[0]}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#999;">
                Pytania? Napisz na
                <a href="mailto:${BRAND.email}" style="color:${COLORS.blue};">${BRAND.email}</a>.
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

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to: recipient, subject, html });
  if (error) {
    console.error('[ticket-email] Błąd pending email:', JSON.stringify(error));
    return { ok: false };
  }
  return { ok: true };
}
