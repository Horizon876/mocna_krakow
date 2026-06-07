/** Wspólna konfiguracja Resend — import.meta.env (Astro) + process.env (Vercel runtime). */
export function getResendConfig() {
  const apiKey =
    import.meta.env.RESEND_API_KEY ||
    (typeof process !== 'undefined' ? process.env.RESEND_API_KEY : undefined);

  const fromRaw =
    import.meta.env.RESEND_FROM_EMAIL?.trim() ||
    (typeof process !== 'undefined' ? process.env.RESEND_FROM_EMAIL?.trim() : undefined);

  const testTo =
    import.meta.env.RESEND_TEST_TO?.trim() ||
    (typeof process !== 'undefined' ? process.env.RESEND_TEST_TO?.trim() : undefined);

  return {
    apiKey,
    from: fromRaw && fromRaw.includes('@') ? fromRaw : 'MOCna! <onboarding@resend.dev>',
    /** W dev z onboarding@resend.dev Resend pozwala wysłać tylko na ten adres */
    testTo: testTo || undefined,
  };
}

/** W trybie dev/test przekieruj odbiorcę, jeśli Resend blokuje wysyłkę na obce adresy. */
export function resolveEmailRecipient(to: string, from: string, testTo?: string) {
  const isDev = import.meta.env.DEV;
  const isSandboxFrom = from.includes('onboarding@resend.dev');

  if (isDev && isSandboxFrom && testTo && to.toLowerCase() !== testTo.toLowerCase()) {
    return { to: testTo, subjectPrefix: `[TEST — oryginalnie: ${to}] ` };
  }
  return { to, subjectPrefix: '' };
}
