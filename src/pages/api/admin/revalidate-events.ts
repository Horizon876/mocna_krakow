import type { APIRoute } from "astro";
import { COOKIE_NAME_EXPORT, verifySessionToken } from "../../../lib/session";
import { revalidateEventsPage } from "../../../lib/revalidate-pages";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get(COOKIE_NAME_EXPORT)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const origin = new URL(request.url).origin;
  const ok = await revalidateEventsPage(origin);

  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 502,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
    },
  });
};
