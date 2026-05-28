import Image from "next/image";
import Link from "next/link";
import { getPartyByCode } from "@/lib/db";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ i?: string }>;
}) {
  // Personalized invite links land here as /?i=<code>. If the code resolves to
  // an invite, we greet them by name and point the RSVP button at their form.
  const { i } = await searchParams;
  const party = i ? getPartyByCode(i) : null;
  const rsvpHref = party ? `/rsvp/${party.code}` : "/rsvp";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Title */}
      <div className="text-center mb-2">
        <p className="text-sm">~*~*~*~*~*~*~*~*~*~*~*~*~*~</p>
        <h1 className="text-4xl md:text-5xl font-bold my-3">
          <span style={{ color: "#cc0000" }}>E</span>
          <span style={{ color: "#ff6600" }}>m</span>
          <span style={{ color: "#cccc00" }}>i</span>
          <span style={{ color: "#009900" }}>l</span>
          <span style={{ color: "#0000cc" }}>y</span>
          <span className="text-2xl mx-2">&amp;</span>
          <span style={{ color: "#9900cc" }}>M</span>
          <span style={{ color: "#cc0000" }}>a</span>
          <span style={{ color: "#ff6600" }}>x</span>
        </h1>
        <p className="comic text-lg" style={{ color: "#cc00cc" }}>
          are getting married!!!
        </p>
        <p className="text-sm">~*~*~*~*~*~*~*~*~*~*~*~*~*~</p>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Marquee */}
      <div className="marquee my-4 text-lg font-bold" style={{ color: "#cc0000" }}>
        <span>
          &#9829; October 24, 2026 &bull; Los Angeles, California &bull; 3:30 p.m. &nbsp;&nbsp;&nbsp;
          &#9829; October 24, 2026 &bull; Los Angeles, California &bull; 3:30 p.m. &nbsp;&nbsp;&nbsp;
        </span>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Photo */}
      <div className="text-center my-6">
        <div className="bevel-out inline-block p-2">
          <div className="relative w-[280px] h-[210px] md:w-[400px] md:h-[300px]">
            <Image
              src="/images/couple-golden-hour-trees.jpg"
              alt="Emily and Max"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        <p className="comic text-xs mt-2" style={{ color: "#666666" }}>
          ^ that&apos;s us!! ^
        </p>
      </div>

      {/* Navigation links */}
      <div className="text-center my-8">
        <p className="font-bold text-lg mb-4 underline">
          CLICK HERE FOR MORE INFO:
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Link href="/proceedings" className="highlight-red text-sm no-underline link-glow">
            THE PROCEEDINGS
          </Link>
          <Link href="/transportation" className="highlight-blue text-sm no-underline link-glow">
            TRANSPORTATION
          </Link>
          <Link href="/where-to-stay" className="highlight-green text-sm no-underline link-glow">
            WHERE TO STAY
          </Link>
        </div>
        <div>
          <Link
            href={rsvpHref}
            className="highlight-magenta text-base no-underline blink link-glow"
          >
            &#9829; RSVP HERE &#9829;
          </Link>
          {party && (
            <p className="comic text-xs mt-2" style={{ color: "#666666" }}>
              {party.attending !== null ? "✓ RSVP received — " : ""}
              for {party.name}
            </p>
          )}
        </div>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Cat photo */}
      <div className="text-center my-6">
        <div className="bevel-out inline-block p-2">
          <div className="relative w-[250px] h-[190px] md:w-[350px] md:h-[260px]">
            <Image
              src="/images/couple-with-cat-selfie.jpg"
              alt="Emily, Max, and their cat"
              fill
              className="object-cover"
            />
          </div>
        </div>
        <p className="comic text-xs mt-2" style={{ color: "#666666" }}>
          us + our cat (the real star)
        </p>
      </div>

      {/* Info blurb */}
      <div className="bevel-in p-4 my-6 text-center">
        <p className="text-base mb-2">
          We both arrived in Los Angeles in the summer of 2023 and met and fell
          in love here.
        </p>
        <p className="text-base">
          We&apos;re excited for you to enjoy it and celebrate with us.
        </p>
      </div>

      {/* Visitor counter */}
      <div className="text-center my-6">
        <p className="text-xs mb-1">You are visitor number:</p>
        <span className="counter">000{200 + Math.floor(Math.random() * 501)}</span>
      </div>

      {/* Footer */}

      <div className="text-center text-xs my-4" style={{ color: "#808080" }}>
        <p>
          <span className="spin">&#9733;</span> Best viewed in Netscape
          Navigator 4.0 at 800x600{" "}
          <span className="spin">&#9733;</span>
        </p>
        <p className="mt-1">
          Made with &#9829; on a Macintosh
        </p>
        <p className="mt-1 courier">
          &copy; 2026 Emily &amp; Max&apos;s Wedding Homepage
        </p>
      </div>
    </div>
  );
}
