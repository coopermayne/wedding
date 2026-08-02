import { createHmac, timingSafeEqual } from "node:crypto";

// Site-wide password gate. The single shared password lives in SITE_PASSWORD.
// We never store the password in the cookie — instead the cookie holds an HMAC
// token derived from it, so a visitor can only present a valid cookie if they
// once knew the password. Changing SITE_PASSWORD invalidates every cookie.

export const COOKIE_NAME = "site_auth";
const TOKEN_MESSAGE = "emily-max-site-auth-v1";

/** How the auth cookie is written, wherever it's set (gate form or invite link). */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
} as const;

function tokenFor(password: string): string {
  return createHmac("sha256", password).update(TOKEN_MESSAGE).digest("hex");
}

/** The cookie value to hand out once a visitor enters the right password. */
export function makeAuthToken(): string | null {
  const pw = process.env.SITE_PASSWORD;
  return pw ? tokenFor(pw) : null;
}

/** True only if `token` matches the token derived from the current password. */
export function isValidAuthToken(token: string | undefined | null): boolean {
  const pw = process.env.SITE_PASSWORD;
  if (!pw || !token) return false;
  return safeEqual(token, tokenFor(pw));
}

/** Constant-time check of a submitted password against SITE_PASSWORD. */
export function verifyPassword(candidate: string): boolean {
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return false;
  return safeEqual(candidate, pw);
}

export function isConfigured(): boolean {
  return Boolean(process.env.SITE_PASSWORD);
}

// Only allow same-site absolute paths as a post-login destination, so the
// `next` param can't be turned into an open redirect to another origin.
export function sanitizeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
