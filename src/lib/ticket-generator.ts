import QRCode from 'qrcode';
import { db } from '../db';
import { tickets } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function generateTicketNumber(): Promise<string> {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const num = String(Math.floor(100000000 + Math.random() * 900000000));
    const existing = await db.select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.ticketNumber, num))
      .limit(1);
    if (existing.length === 0) return num;
  }
  throw new Error('Nie udało się wygenerować unikalnego numeru biletu.');
}

export async function generateTicketQR(ticketNumber: string): Promise<string> {
  return QRCode.toDataURL(ticketNumber, {
    width: 256,
    margin: 2,
    color: { dark: '#1c1c1c', light: '#ffffff' },
  });
}

export function extractBase64FromDataUrl(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/png;base64,/, '');
}
