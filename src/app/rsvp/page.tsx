import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPartyByCode } from "@/lib/db";

export default async function RSVPLanding() {
  // If we remember this guest from their invite link (cookie set on arrival),
  // send them straight to their form instead of asking for the link again.
  const code = (await cookies()).get("invite")?.value;
  if (code && getPartyByCode(code)) {
    redirect(`/rsvp/${encodeURIComponent(code)}`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 text-center my-16">
      <h1
        className="text-3xl md:text-4xl font-bold mb-4"
        style={{ color: "#cc00cc" }}
      >
        ~*~ RSVP ~*~
      </h1>
      <p className="comic text-base mb-6" style={{ color: "#666666" }}>
        Please use the personalized link from your invite email to RSVP.
        <br />
        <br />
        If you can&apos;t find it, email us and we&apos;ll send it again!
      </p>
      <Link href="/">&lt;&lt; Back to Home &gt;&gt;</Link>
    </div>
  );
}
