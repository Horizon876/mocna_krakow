import type { APIRoute } from "astro";
import { cancelReservationByToken } from "../../../lib/reservations";

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { success: false, message: "Nieprawidłowe żądanie." },
      400,
    );
  }

  const token = body.token?.trim();
  if (!token) {
    return jsonResponse(
      { success: false, message: "Brak tokenu anulowania." },
      400,
    );
  }

  const reservation = await cancelReservationByToken(token);
  if (!reservation) {
    return jsonResponse(
      {
        success: false,
        message: "Rezerwacja nie istnieje, jest już anulowana lub link wygasł.",
      },
      404,
    );
  }

  return jsonResponse({
    success: true,
    tableId: reservation.tableId,
    date: reservation.reservationDate,
    time: reservation.reservationTime,
  });
};
