"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_OPTIONS,
  COOKIE_NAME,
  makeAuthToken,
  sanitizeNext,
  verifyPassword,
} from "@/lib/auth";

export async function unlock(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? "/"));

  if (!verifyPassword(password)) {
    redirect(`/gate?next=${encodeURIComponent(next)}&error=1`);
  }

  const token = makeAuthToken();
  if (token) {
    (await cookies()).set(COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  }

  redirect(next);
}
