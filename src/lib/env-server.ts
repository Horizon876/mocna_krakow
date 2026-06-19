/** Odczyt zmiennych serwerowych — Astro build + Vercel runtime. */
export function getServerEnv(name: string): string | undefined {
  const fromImport = (import.meta.env as Record<string, string | undefined>)[
    name
  ];
  if (fromImport?.trim()) return fromImport.trim();

  if (typeof process !== "undefined") {
    const fromProcess = process.env[name];
    if (fromProcess?.trim()) return fromProcess.trim();
  }

  return undefined;
}
