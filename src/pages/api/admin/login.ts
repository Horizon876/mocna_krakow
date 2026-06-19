import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import {
  createSessionToken,
  COOKIE_NAME_EXPORT,
  SESSION_DURATION_SEC,
} from '../../../lib/session';
import { getServerEnv } from '../../../lib/env-server';

export const prerender = false;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  Pragma: 'no-cache',
};

function loginRedirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      ...NO_CACHE_HEADERS,
    },
  });
}

async function readPassword(request: Request): Promise<string> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const body = await request.text();
    return new URLSearchParams(body).get('password') || '';
  }
  const formData = await request.formData();
  return String(formData.get('password') || '');
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const password = await readPassword(request);

  if (!password) {
    return loginRedirect('/admin/login?error=empty');
  }

  const hashAdminB64 = getServerEnv('ADMIN_PASSWORD_HASH_B64');
  const hashPracownikB64 = getServerEnv('PRACOWNIK_PASSWORD_HASH_B64');

  if (!hashAdminB64) {
    return loginRedirect('/admin/login?error=config');
  }

  let role: 'admin' | 'pracownik' | null = null;

  // Sprawdź hasło administratora
  try {
    const storedAdminHash = Buffer.from(hashAdminB64, 'base64').toString('utf8');
    if (storedAdminHash.startsWith('$2') && await bcrypt.compare(password, storedAdminHash)) {
      role = 'admin';
    }
  } catch {
    return loginRedirect('/admin/login?error=config');
  }

  // Sprawdź hasło pracownika (jeśli jest skonfigurowane)
  if (!role && hashPracownikB64) {
    try {
      const storedPracownikHash = Buffer.from(hashPracownikB64, 'base64').toString('utf8');
      if (storedPracownikHash.startsWith('$2') && await bcrypt.compare(password, storedPracownikHash)) {
        role = 'pracownik';
      }
    } catch {
      // ignoruj błędy dekodowania i porównywania dla pracownika
    }
  }

  if (!role) {
    await new Promise((r) => setTimeout(r, 500));
    return loginRedirect('/admin/login?error=invalid');
  }

  const token = await createSessionToken(role);
  cookies.set(COOKIE_NAME_EXPORT, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SEC,
    path: '/',
  });

  return loginRedirect('/admin/dashboard');
};
