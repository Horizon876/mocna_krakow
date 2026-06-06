import type { MiddlewareHandler } from 'astro';
import { verifySessionToken, COOKIE_NAME_EXPORT } from './lib/session';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;

  // Chroń wszystkie trasy /admin/* oprócz strony logowania
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  if (isAdminRoute && !isLoginPage) {
    const token = context.cookies.get(COOKIE_NAME_EXPORT)?.value;

    if (!token) {
      return context.redirect('/admin/login');
    }

    const isValid = await verifySessionToken(token);
    if (!isValid) {
      // Usuń przeterminowane/nieprawidłowe ciasteczko
      context.cookies.delete(COOKIE_NAME_EXPORT, { path: '/' });
      return context.redirect('/admin/login?expired=1');
    }
  }

  return next();
};
