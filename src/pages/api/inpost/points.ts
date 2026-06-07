import type { APIRoute } from 'astro';

const SHIPX_BASE = 'https://api-shipx-pl.easypack24.net/v1/points';

function normalizePostCode(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 5) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return value.trim();
}

/** Publiczne API InPost ShipX — wyszukiwanie paczkomatów (bez klucza, tylko odczyt). */
export const GET: APIRoute = async ({ url }) => {
  const name = url.searchParams.get('name')?.trim().toUpperCase();
  const city = url.searchParams.get('city')?.trim();
  const postCodeRaw = url.searchParams.get('post_code')?.trim();
  const postCode = postCodeRaw ? normalizePostCode(postCodeRaw) : undefined;

  if (!name && !city && !postCode) {
    return new Response(JSON.stringify({ error: 'Podaj miejscowość, kod pocztowy lub kod paczkomatu.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const params = new URLSearchParams({
    per_page: city || postCode ? '25' : '10',
    type: 'parcel_locker',
  });
  if (name) params.set('name', name);
  if (city) params.set('city', city);
  if (postCode) params.set('post_code', postCode);

  try {
    const res = await fetch(`${SHIPX_BASE}?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Błąd API InPost' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const items = (data.items ?? []).map((p: Record<string, unknown>) => ({
      name: p.name,
      display_name: p.display_name,
      status: p.status,
      address: p.address,
      address_details: p.address_details,
      location_description: p.location_description,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Nie udało się połączyć z API InPost' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
