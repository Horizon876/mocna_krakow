import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import {
  createSessionToken,
  COOKIE_NAME_EXPORT,
  SESSION_DURATION_SEC,
} from "../../../lib/session";
import { getServerEnv } from "../../../lib/env-server";

export const prerender = false;

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
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

async function readLoginForm(request: Request): Promise<{
  password: string;
  role: string;
}> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const body = await request.text();
    const params = new URLSearchParams(body);
    return {
      password: params.get("password") || "",
      role: params.get("role") || "",
    };
  }
  const formData = await request.formData();
  return {
    password: String(formData.get("password") || ""),
    role: String(formData.get("role") || ""),
  };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const { password, role } = await readLoginForm(request);

  if (!password) {
    return loginRedirect("/admin/login?error=empty");
  }

  if (role !== "admin" && role !== "pracownik") {
    return loginRedirect("/admin/login?error=invalid");
  }

  const hashAdminB64 = getServerEnv("ADMIN_PASSWORD_HASH_B64");
  const hashPracownikB64 = getServerEnv("PRACOWNIK_PASSWORD_HASH_B64");

  if (!hashAdminB64) {
    return loginRedirect("/admin/login?error=config");
  }

  let matchedRole: "admin" | "pracownik" | null = null;

  if (role === "admin") {
    try {
      const storedAdminHash = Buffer.from(hashAdminB64, "base64").toString(
        "utf8",
      );
      if (
        storedAdminHash.startsWith("$2") &&
        (await bcrypt.compare(password, storedAdminHash))
      ) {
        matchedRole = "admin";
      }
    } catch {
      return loginRedirect("/admin/login?error=config");
    }
  } else if (hashPracownikB64) {
    try {
      const storedPracownikHash = Buffer.from(
        hashPracownikB64,
        "base64",
      ).toString("utf8");
      if (
        storedPracownikHash.startsWith("$2") &&
        (await bcrypt.compare(password, storedPracownikHash))
      ) {
        matchedRole = "pracownik";
      }
    } catch {
      return loginRedirect("/admin/login?error=config");
    }
  }

  if (!matchedRole) {
    await new Promise((r) => setTimeout(r, 500));
    return loginRedirect("/admin/login?error=invalid");
  }

  const token = await createSessionToken(matchedRole);
  cookies.set(COOKIE_NAME_EXPORT, token, {
    httpOnly: true,
    secure: getServerEnv("VERCEL") === "1" || import.meta.env.PROD,
    sameSite: "lax",
    maxAge: SESSION_DURATION_SEC,
    path: "/",
  });

  return loginRedirect("/admin/dashboard");
};
