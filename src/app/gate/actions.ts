"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
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
    (await cookies()).set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  redirect(next);
}
