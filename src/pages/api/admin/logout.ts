import type { APIRoute } from "astro";
import { COOKIE_NAME_EXPORT } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(COOKIE_NAME_EXPORT, { path: "/" });
  return redirect("/admin/login");
};

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(COOKIE_NAME_EXPORT, { path: "/" });
  return redirect("/admin/login");
};
