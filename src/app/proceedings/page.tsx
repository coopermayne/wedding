import Image from "next/image";
import Link from "next/link";

export default function Proceedings() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      <Link href="/" className="text-sm">
        &lt;&lt; Back to Home
      </Link>

      <div className="text-center my-6">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "#990000" }}>
          THE PROCEEDINGS
        </h1>
        <p className="text-sm">~*~*~*~*~*~*~*~*~*~*~</p>
      </div>

      <hr className="rainbow-hr my-4" />

      <div className="text-center mb-6">
        <span className="highlight-purple text-lg">OCTOBER 24, 2026</span>
      </div>

      {/* Wedding */}
      <div className="bevel-in p-4 md:p-6 my-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#0000cc" }}>
          <span className="spin">&#9733;</span> THE WEDDING{" "}
          <span className="spin">&#9733;</span>
        </h2>
        <table className="retro-table w-full mt-4">
          <tbody>
            <tr>
              <td className="font-bold" style={{ background: "#f0f0f0" }}>
                Time
              </td>
              <td>3:30 p.m. &ndash; 8:00 p.m.</td>
            </tr>
            <tr>
              <td className="font-bold" style={{ background: "#f0f0f0" }}>
                Location
              </td>
              <td>
                Dear family friend Aaron Walton&apos;s beautiful backyard in the
                Hancock Park neighborhood of Los Angeles
              </td>
            </tr>
            <tr>
              <td className="font-bold" style={{ background: "#f0f0f0" }}>
                Address
              </td>
              <td className="courier">
                322 S. Las Palmas Ave., Los Angeles, CA 90020
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Afterparty */}
      <div className="bevel-in p-4 md:p-6 my-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#cc6600" }}>
          <span className="spin">&#9733;</span> THE AFTERPARTY{" "}
          <span className="spin">&#9733;</span>
        </h2>
        <table className="retro-table w-full mt-4">
          <tbody>
            <tr>
              <td className="font-bold" style={{ background: "#f0f0f0" }}>
                Time
              </td>
              <td>8:30 p.m. &ndash; ???</td>
            </tr>
            <tr>
              <td className="font-bold" style={{ background: "#f0f0f0" }}>
                Location
              </td>
              <td>Thai Angel</td>
            </tr>
            <tr>
              <td className="font-bold" style={{ background: "#f0f0f0" }}>
                Address
              </td>
              <td className="courier">
                149 N. Western Ave, Los Angeles, CA 90004
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Adults Only */}
      <div className="text-center my-8">
        <div className="bevel-out inline-block p-2 mb-3">
          <div className="relative w-[200px] h-[150px]">
            <Image
              src="/images/adults-only-neon-sign.png"
              alt="Adults Only"
              fill
              className="object-contain"
            />
          </div>
        </div>
        <p
          className="text-xl font-bold blink"
          style={{ color: "#ff00ff" }}
        >
          *** ADULTS ONLY ***
        </p>
        <p className="comic text-sm mt-2" style={{ color: "#666666" }}>
          Both the wedding and afterparty are adults only.
          <br />
          We love your kids, but this one&apos;s for the grown-ups.
        </p>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Karaoke photo */}
      <div className="text-center my-6">
        <div className="bevel-out inline-block p-2">
          <div className="relative w-[280px] h-[190px] md:w-[400px] md:h-[270px]">
            <Image
              src="/images/couple-karaoke-couch.jpg"
              alt="Emily and Max doing karaoke"
              fill
              className="object-cover"
            />
          </div>
        </div>
        <p className="comic text-xs mt-2" style={{ color: "#666666" }}>
          karaoke practice for the afterparty
        </p>
      </div>


      <div className="text-center my-4">
        <Link href="/" className="text-sm">
          &lt;&lt; Back to Home
        </Link>
        {" | "}
        <Link href="/transportation" className="text-sm">
          Transportation &gt;&gt;
        </Link>
      </div>
    </div>
  );
}
