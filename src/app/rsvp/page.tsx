import Link from "next/link";

export default function RSVPLanding() {
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
