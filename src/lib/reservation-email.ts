import { Resend } from 'resend';
import { BRAND, COLORS } from '../data/site';

/** Kolorowy nagłówek MOCna! — jak na stronie głównej */
const BRAND_HEADING = `
  <p style="margin:0 0 10px;font-size:44px;font-weight:700;line-height:1;letter-spacing:-0.03em;text-align:center;">
    <span style="color:${COLORS.blue};">M</span><span style="color:${COLORS.red};">O</span><span style="color:${COLORS.yellow};">C</span><span style="color:${COLORS.green};">n</span><span style="color:${COLORS.pink};">a</span><span style="color:${COLORS.orange};">!</span>
  </p>`;

const TABLE_LABELS: Record<string, string> = {
  T1: 'Stolik 1', T2: 'Stolik 2', T3: 'Stolik 3', T4: 'Stolik 4', T5: 'Stolik 5',
  T6: 'Stolik 6', T7: 'Stolik 7', T8: 'Stolik 8', T9: 'Stolik 9', T10: 'Stolik 10 (lounge)',
  G1: 'Ogród 1', G2: 'Ogród 2', G3: 'Ogród 3', G4: 'Ogród 4', G5: 'Ogród 5', G6: 'Ogród 6',
};

export type ReservationEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  tableId: string;
  reservationDate: string;
  reservationTime: string;
  phone?: string | null;
  notes?: string | null;
  cancelToken?: string;
};

function siteUrl() {
  return import.meta.env.SITE ?? 'https://mocna.org';
}

function formatDate(date: string) {
  return date.split('-').reverse().join('.');
}

function formatEndTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const end = new Date(0, 0, 0, h + 1, m);
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
}

function reservationDetailsBlock(data: ReservationEmailData) {
  const tableLabel = TABLE_LABELS[data.tableId] ?? data.tableId;
  const dateLabel = formatDate(data.reservationDate);
  const endTime = formatEndTime(data.reservationTime);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:1px solid #f0e6d8;">
      <tr>
        <td style="padding:20px 24px;font-size:15px;line-height:1.8;">
          <strong>Stolik:</strong> ${tableLabel}<br>
          <strong>Data:</strong> ${dateLabel}<br>
          <strong>Godzina:</strong> ${data.reservationTime} – ${endTime}<br>
          <strong>Adres:</strong> ${BRAND.address}
        </td>
      </tr>
    </table>`;
}

function buildConfirmationHtml(data: ReservationEmailData) {
  const cancelUrl = data.cancelToken
    ? `${siteUrl()}/rezerwacja/anuluj?token=${encodeURIComponent(data.cancelToken)}`
    : null;

  return `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff8f0;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:4px solid #f39200;text-align:center;">
              ${BRAND_HEADING}
              <p style="margin:0;font-size:14px;color:#666;">Potwierdzenie rezerwacji stolika</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
                Cześć <strong>${data.firstName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
                Twoja rezerwacja w kawiarni MOCna! została potwierdzona. Poniżej szczegóły:
              </p>
              ${reservationDetailsBlock(data)}
              ${data.notes ? `<p style="margin:20px 0 0;font-size:14px;color:#666;"><strong>Uwagi:</strong> ${data.notes}</p>` : ''}
              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#666;">
                Rezerwacja obowiązuje przez 1 godzinę. W razie pytań napisz na
                <a href="mailto:${BRAND.email}" style="color:#2c5ea9;">${BRAND.email}</a>
                lub zadzwoń: ${BRAND.phone}.
              </p>
              ${cancelUrl ? `
              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#666;">
                Nie możesz przyjść? Możesz
                <a href="${cancelUrl}" style="color:#de3c42;font-weight:600;">anulować rezerwację online</a>.
              </p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #eee;font-size:12px;color:#999;">
              Do zobaczenia w MOCnej!<br>
              ${BRAND.address}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildConfirmationText(data: ReservationEmailData) {
  const tableLabel = TABLE_LABELS[data.tableId] ?? data.tableId;
  const dateLabel = formatDate(data.reservationDate);
  const endTime = formatEndTime(data.reservationTime);
  const cancelUrl = data.cancelToken
    ? `${siteUrl()}/rezerwacja/anuluj?token=${data.cancelToken}`
    : null;

  return [
    `Cześć ${data.firstName},`,
    '',
    'Twoja rezerwacja w kawiarni MOCna! została potwierdzona.',
    '',
    `Stolik: ${tableLabel}`,
    `Data: ${dateLabel}`,
    `Godzina: ${data.reservationTime} – ${endTime}`,
    `Adres: ${BRAND.address}`,
    data.notes ? `Uwagi: ${data.notes}` : '',
    '',
    `Kontakt: ${BRAND.email} | ${BRAND.phone}`,
    cancelUrl ? `Anuluj rezerwację: ${cancelUrl}` : '',
    '',
    'Do zobaczenia w MOCnej!',
  ].filter(Boolean).join('\n');
}

function buildCancellationHtml(data: ReservationEmailData) {
  return `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff8f0;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:4px solid #de3c42;text-align:center;">
              ${BRAND_HEADING}
              <p style="margin:0;font-size:14px;color:#666;">Rezerwacja anulowana</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
                Cześć <strong>${data.firstName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
                Informujemy, że Twoja rezerwacja w kawiarni MOCna! została anulowana:
              </p>
              ${reservationDetailsBlock(data)}
              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#666;">
                Stolik jest ponownie dostępny dla innych gości. Jeśli chcesz zarezerwować nowy termin,
                odwiedź <a href="${siteUrl()}/rezerwacja" style="color:#2c5ea9;">stronę rezerwacji</a>.
              </p>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#666;">
                Pytania? Napisz na
                <a href="mailto:${BRAND.email}" style="color:#2c5ea9;">${BRAND.email}</a>
                lub zadzwoń: ${BRAND.phone}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #eee;font-size:12px;color:#999;">
              MOCna!<br>
              ${BRAND.address}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildCancellationText(data: ReservationEmailData) {
  const tableLabel = TABLE_LABELS[data.tableId] ?? data.tableId;
  const dateLabel = formatDate(data.reservationDate);
  const endTime = formatEndTime(data.reservationTime);

  return [
    `Cześć ${data.firstName},`,
    '',
    'Twoja rezerwacja w kawiarni MOCna! została anulowana.',
    '',
    `Stolik: ${tableLabel}`,
    `Data: ${dateLabel}`,
    `Godzina: ${data.reservationTime} – ${endTime}`,
    `Adres: ${BRAND.address}`,
    '',
    `Nowa rezerwacja: ${siteUrl()}/rezerwacja`,
    `Kontakt: ${BRAND.email} | ${BRAND.phone}`,
  ].join('\n');
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[reservation-email] Brak RESEND_API_KEY — e-mail pominięty.');
    return { ok: false, skipped: true as const };
  }

  const from = import.meta.env.RESEND_FROM_EMAIL ?? 'MOCna! <onboarding@resend.dev>';
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({ from, to, subject, html, text });

  if (error) {
    console.error('[reservation-email] Błąd wysyłki:', error);
    return { ok: false, skipped: false as const, error };
  }

  return { ok: true };
}

export async function sendReservationConfirmation(data: ReservationEmailData) {
  return sendEmail(
    data.email,
    `Potwierdzenie rezerwacji – MOCna! (${formatDate(data.reservationDate)}, ${data.reservationTime})`,
    buildConfirmationHtml(data),
    buildConfirmationText(data),
  );
}

export async function sendReservationCancellation(data: ReservationEmailData) {
  return sendEmail(
    data.email,
    `Rezerwacja anulowana – MOCna! (${formatDate(data.reservationDate)}, ${data.reservationTime})`,
    buildCancellationHtml(data),
    buildCancellationText(data),
  );
}
