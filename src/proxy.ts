import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_OPTIONS,
  COOKIE_NAME,
  isValidAuthToken,
  makeAuthToken,
} from "@/lib/auth";
import { getPartyByCode } from "@/lib/db";

const INVITE_COOKIE = "invite";
const INVITE_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365, // a year
  sameSite: "lax",
  path: "/",
} as const;

// Site-wide gate + invite-code convenience.
//
// There are two ways in:
//
// 1. A personalized invite link (/?i=<code> or /rsvp/<code>). The code is
//    looked up in the guest list; if it matches a real invite, that IS the
//    credential — no password needed. Guests who click the link in their email
//    never see the gate.
// 2. The shared password on /gate, for anyone arriving without a code.
//
// Either way we hand out the same HMAC auth cookie (see lib/auth), so it can't
// be forged without knowing SITE_PASSWORD, and the rest of the site behaves
// identically. Requests with neither are redirected before the route ever
// renders, so the page's HTML and RSC payload are never sent — you can't read
// the content from "view source".
//
// The invite cookie is separate and grants nothing on its own: it only
// remembers *which* guest this is, so the RSVP link stays personalized as they
// navigate away from the coded URL.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isGate = pathname === "/gate";

  // The code carried by this request, if any.
  const fromQuery = request.nextUrl.searchParams.get("i");
  const fromPath = pathname.match(/^\/rsvp\/([^/]+)$/)?.[1];
  const rawCode = fromQuery || (fromPath ? decodeURIComponent(fromPath) : null);

  // Only honor a code that matches a real invite — otherwise any made-up code
  // would be a way past the gate.
  const invitedCode = rawCode && getPartyByCode(rawCode) ? rawCode : null;

  const authed =
    isValidAuthToken(request.cookies.get(COOKIE_NAME)?.value) ||
    Boolean(invitedCode);

  // Neither cookie nor valid code: bounce to the gate, remembering where they
  // were headed so we can return them after they unlock.
  if (!authed && !isGate) {
    const url = request.nextUrl.clone();
    url.pathname = "/gate";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Already in? No reason to sit on the gate page.
  if (authed && isGate) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();

  if (invitedCode) {
    // Landing on a recognized invite link unlocks the site for this browser,
    // so the guest stays in after they navigate away from the coded URL.
    const token = makeAuthToken();
    if (token) res.cookies.set(COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    res.cookies.set(INVITE_COOKIE, invitedCode, INVITE_COOKIE_OPTIONS);
  }

  return res;
}

export const config = {
  // Run on page routes only; skip API and static assets. `images` is the
  // public photo folder: the next/image optimizer fetches those originals
  // server-side without the user's auth cookie, so gating them would bounce
  // the optimizer to /gate and break every <Image> on the site.
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt).*)",
  ],
};
