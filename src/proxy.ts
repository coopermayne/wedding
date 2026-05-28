import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Remember which guest is browsing. When someone arrives via their personalized
// email link (/?i=<code>, or directly at /rsvp/<code>), capture the code in a
// cookie so the rest of the site — including the RSVP page they reach through
// normal navigation — still knows who they are. The email link stays the source
// of truth; this is just a convenience layer (re-clicking it re-sets the cookie).
export function proxy(request: NextRequest) {
  const res = NextResponse.next();

  const fromQuery = request.nextUrl.searchParams.get("i");
  const fromPath = request.nextUrl.pathname.match(/^\/rsvp\/([^/]+)$/)?.[1];
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
