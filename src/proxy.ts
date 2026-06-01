import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, isValidAuthToken } from "@/lib/auth";

// Site-wide password gate + invite-code convenience.
//
// 1. Gate: every matched route requires a valid auth cookie. Visitors without
//    one are redirected to /gate before the requested route is ever rendered,
//    so the page's HTML and RSC payload are never sent — you can't read the
//    content from "view source". The cookie is an HMAC token (see lib/auth),
//    so it can't be forged without knowing SITE_PASSWORD.
//
// 2. Invite: once authenticated, capture a guest's personalized code (from
//    /?i=<code> or /rsvp/<code>) into a cookie so the rest of the site still
//    knows who they are as they navigate. The email link stays the source of
//    truth; this is just a convenience layer.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isGate = pathname === "/gate";
  const authed = isValidAuthToken(request.cookies.get(COOKIE_NAME)?.value);

  // Unauthenticated: bounce everything except the gate itself to the gate,
  // remembering where they were headed so we can return them after they unlock.
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

  // ---- invite-code capture (authenticated traffic only) ----
  const res = NextResponse.next();
  const fromQuery = request.nextUrl.searchParams.get("i");
  const fromPath = pathname.match(/^\/rsvp\/([^/]+)$/)?.[1];
  const code = fromQuery || (fromPath ? decodeURIComponent(fromPath) : null);

  if (code) {
    res.cookies.set("invite", code, {
      maxAge: 60 * 60 * 24 * 365, // a year
      sameSite: "lax",
      path: "/",
    });
  }

  return res;
}

export const config = {
  // Run on page routes only; skip API and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
