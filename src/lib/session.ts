/**
 * Moduł zarządzania sesjami admina.
 * Używa HttpOnly cookie z HMAC-SHA256 do weryfikacji tokenu.
 * Cały kod działa wyłącznie po stronie serwera.
 */

const COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8; // 8 godzin

/**
 * Tworzy podpisany token sesji: timestamp.HMAC
 */
export async function createSessionToken(): Promise<string> {
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET nie jest ustawiony w .env');

  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `admin:${expires}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );

  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}.${sigHex}`;
}

/**
 * Weryfikuje podpisany token sesji.
 * Zwraca true jeśli token jest prawidłowy i nie wygasł.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = import.meta.env.SESSION_SECRET;
    if (!secret) return false;

    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return false;

    const payload = token.substring(0, lastDot);
    const sigHex = token.substring(lastDot + 1);

    // Sprawdź wygaśnięcie
    const parts = payload.split(':');
    if (parts.length !== 2 || parts[0] !== 'admin') return false;
    const expires = parseInt(parts[1], 10);
    if (isNaN(expires) || Date.now() > expires) return false;

    // Weryfikuj podpis HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = new Uint8Array(
      sigHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payload)
    );

    return valid;
  } catch {
    return false;
  }
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
export const SESSION_DURATION_SEC = SESSION_DURATION_MS / 1000;
