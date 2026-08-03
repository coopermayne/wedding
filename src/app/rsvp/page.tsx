import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPartyByCode } from "@/lib/db";
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
          Lost your personalized link? No problem &mdash; type the email address
          your invite was sent to and we&apos;ll find you.
        </p>

        <form action={findInviteByEmail} className="flex flex-col items-center gap-3">
          <input
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="The email your invite was sent to"
            className="bevel-in px-3 py-2 text-base text-center w-full max-w-xs"
          />
          <button type="submit" className="btn-90s">
            Find my invite &raquo;
          </button>
        </form>

        {notfound && (
          <p className="comic text-sm mt-4" style={{ color: "#cc0000" }}>
            &#10007; We couldn&apos;t find an invite for that address. Try any
            other address you might have given us &mdash; or email us and
            we&apos;ll send your link right over.
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
