/** Normalizacja danych adresowych paczkomatu InPost (ShipX API / GeoWidget). */
export type InPostPointLike = {
  name?: string;
  display_name?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    post_code?: string;
    zipCode?: string;
  };
  address_details?: {
    city?: string;
    post_code?: string;
    street?: string;
    building_number?: string;
  };
};

export function parseInPostPointAddress(point: InPostPointLike) {
  const addr = point.address ?? {};
  const details = point.address_details ?? {};

  let zipCode = (
    details.post_code ||
    addr.post_code ||
    addr.zipCode ||
    ""
  ).trim();
  let city = (details.city || addr.city || "").trim();

  // ShipX często zwraca kod i miasto w line2: "31-801 Kraków"
  if (!zipCode || !city) {
    const line2 = (addr.line2 || "").trim();
    const match = line2.match(/^(\d{2}-\d{3})\s+(.+)$/);
    if (match) {
      zipCode = zipCode || match[1];
      city = city || match[2];
    }
  }

  const streetFromDetails = [details.street, details.building_number]
    .filter(Boolean)
    .join(" ")
    .trim();
  const address = (addr.line1 || streetFromDetails || point.name || "").trim();

  return { address, zipCode, city };
}
