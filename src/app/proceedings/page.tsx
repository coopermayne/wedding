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

      {/* The Wedding */}
      <div className="my-8 text-center">
        <div className="inline-block mb-4" style={{ borderBottom: "3px double #0000cc" }}>
          <h2 className="text-2xl md:text-3xl font-bold px-4 pb-1" style={{ color: "#0000cc" }}>
            <span style={{ color: "#ffcc00", fontSize: "1.2em" }}>&#10038;</span>
            {" "}THE WEDDING{" "}
            <span style={{ color: "#ffcc00", fontSize: "1.2em" }}>&#10038;</span>
          </h2>
        </div>
      </div>

      <div className="my-4 p-1" style={{ background: "#0000cc" }}>
        <div className="p-4" style={{ background: "#eeeeff" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td className="font-bold text-center p-3 align-middle" style={{ background: "#ccccee", border: "2px ridge #9999cc", width: "110px" }}>
                  Time
                </td>
                <td className="p-3" style={{ border: "2px ridge #9999cc" }}>
                  <span className="text-lg font-bold" style={{ color: "#000066" }}>3:30 p.m. &ndash; 8:00 p.m.</span>
                </td>
              </tr>
              <tr>
                <td className="font-bold text-center p-3 align-middle" style={{ background: "#ccccee", border: "2px ridge #9999cc" }}>
                  Location
                </td>
                <td className="p-3" style={{ border: "2px ridge #9999cc" }}>
                  Dear family friend <b>Aaron Walton</b>&apos;s beautiful backyard
                  in the <b>Hancock Park</b> neighborhood of Los Angeles
                </td>
              </tr>
              <tr>
                <td className="font-bold text-center p-3 align-middle" style={{ background: "#ccccee", border: "2px ridge #9999cc" }}>
                  Address
                </td>
                <td className="p-3 courier" style={{ border: "2px ridge #9999cc" }}>
                  322 S. Las Palmas Ave.
                  <br />
                  Los Angeles, CA 90020
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center my-2">
        <p className="comic text-xs" style={{ color: "#999999" }}>
          (it&apos;s a really nice backyard, trust us)
        </p>
      </div>

      <hr className="rainbow-hr my-6" />

      {/* The Afterparty */}
      <div className="my-8 text-center">
        <div className="inline-block mb-4" style={{ borderBottom: "3px double #cc6600" }}>
          <h2 className="text-2xl md:text-3xl font-bold px-4 pb-1" style={{ color: "#cc6600" }}>
            <span style={{ color: "#cc0000", fontSize: "1.2em" }}>&#10038;</span>
            {" "}THE AFTERPARTY{" "}
            <span style={{ color: "#cc0000", fontSize: "1.2em" }}>&#10038;</span>
          </h2>
        </div>
      </div>

      <div className="my-4 p-1" style={{ background: "#cc6600" }}>
        <div className="p-4" style={{ background: "#fff5ee" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td className="font-bold text-center p-3 align-middle" style={{ background: "#ffe0c0", border: "2px ridge #cc9966", width: "110px" }}>
                  Time
                </td>
                <td className="p-3" style={{ border: "2px ridge #cc9966" }}>
                  <span className="text-lg font-bold" style={{ color: "#663300" }}>8:30 p.m. &ndash; ???</span>
                </td>
              </tr>
              <tr>
                <td className="font-bold text-center p-3 align-middle" style={{ background: "#ffe0c0", border: "2px ridge #cc9966" }}>
                  Location
                </td>
                <td className="p-3 text-lg font-bold" style={{ border: "2px ridge #cc9966", color: "#663300" }}>
                  Thai Angel
                </td>
              </tr>
              <tr>
                <td className="font-bold text-center p-3 align-middle" style={{ background: "#ffe0c0", border: "2px ridge #cc9966" }}>
                  Address
                </td>
                <td className="p-3 courier" style={{ border: "2px ridge #cc9966" }}>
                  149 N. Western Ave
                  <br />
                  Los Angeles, CA 90004
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center my-2">
        <p className="comic text-xs" style={{ color: "#999999" }}>
          8 min drive from the wedding &middot; rideshare pls!!
        </p>
      </div>

      <hr className="rainbow-hr my-6" />

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
        <p className="text-xl font-bold blink" style={{ color: "#ff00ff" }}>
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
