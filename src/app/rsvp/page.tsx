import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPartyByCode } from "@/lib/db";
import { isRsvpOpenToEveryone } from "@/lib/config";
import { findInviteByEmail } from "./actions";

export default async function RSVPLanding({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string; ambiguous?: string }>;
}) {
  // If we remember this guest from their invite link (cookie set on arrival),
  // send them straight to their form instead of asking for anything.
  const code = (await cookies()).get("invite")?.value;
  if (code && getPartyByCode(code)) {
    redirect(`/rsvp/${encodeURIComponent(code)}`);
  }

  const { notfound, ambiguous } = await searchParams;

  // Guest list still going in: don't offer email sign-in to someone who very
  // likely isn't in it yet — "we couldn't find you" is worse than "check your
  // email". Anyone with their link is already past this page.
  if (!isRsvpOpenToEveryone()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center my-16">
        <h1
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: "#cc00cc" }}
        >
          ~*~ RSVP ~*~
        </h1>
        <p className="comic text-base mb-6" style={{ color: "#666666" }}>
          Invitations are on their way! Each one comes with its own personalized
          RSVP link.
          <br />
          <br />
          Keep an eye on your inbox &mdash; and if you think we missed you, just
          email us and we&apos;ll get you sorted.
        </p>
        <Link href="/">&lt;&lt; Back to Home &gt;&gt;</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 text-center my-16">
      <h1
        className="text-3xl md:text-4xl font-bold mb-4"
        style={{ color: "#cc00cc" }}
      >
        ~*~ RSVP ~*~
      </h1>

      <div className="bevel-in p-6 my-6">
        <p className="comic text-base mb-4" style={{ color: "#666666" }}>
          Enter your email address to RSVP.
        </p>

        <form action={findInviteByEmail} className="flex flex-col items-center gap-3">
          <input
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Your email address"
            className="bevel-in px-3 py-2 text-base text-center w-full max-w-xs"
          />
          <button type="submit" className="btn-90s">
            Continue &raquo;
          </button>
        </form>

        {notfound && (
          <p className="comic text-sm mt-4" style={{ color: "#cc0000" }}>
            &#10007; We couldn&apos;t find that address on our guest list. Try
            any other address you might have given us &mdash; or email us and
            we&apos;ll sort it out!
          </p>
        )}

        {ambiguous && (
          <p className="comic text-sm mt-4" style={{ color: "#cc0000" }}>
            &#10007; That address is on more than one invite, so we can&apos;t
            tell which one is yours. Email us and we&apos;ll sort it out!
          </p>
        )}
      </div>

      <Link href="/">&lt;&lt; Back to Home &gt;&gt;</Link>
    </div>
  );
}
