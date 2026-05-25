import Link from "next/link";

export default function Transportation() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      <Link href="/" className="text-sm">
        &lt;&lt; Back to Home
      </Link>

      <div className="text-center my-6">
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#0000cc" }}
        >
          TRANSPORTATION
        </h1>
        <p className="text-sm">~*~*~*~*~*~*~*~*~*~*~</p>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Airports */}
      <div className="text-center mb-4">
        <span className="highlight-blue text-base">FLYING IN</span>
      </div>

      <table className="retro-table w-full my-4">
        <thead>
          <tr style={{ background: "#c0c0c0" }}>
            <th className="font-bold text-left">Airport</th>
            <th className="font-bold text-left">Vibe</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: "#ffffff" }}>
            <td className="font-bold">LAX</td>
            <td>More options, more hectic. The classic LA airport experience.</td>
          </tr>
          <tr style={{ background: "#f0f0f0" }}>
            <td className="font-bold">Hollywood Burbank</td>
            <td>
              More relaxed, more expensive. If you value your sanity.
            </td>
          </tr>
        </tbody>
      </table>

      <hr className="rainbow-hr my-4" />

      {/* Getting Around */}
      <div className="text-center mb-4">
        <span className="highlight-green text-base">GETTING AROUND</span>
      </div>

      <div className="bevel-in p-4 my-4">
        <p className="text-base mb-3">
          If you&apos;re looking to bop around the city, we recommend{" "}
          <b>renting a car</b>. Otherwise, Ubers/Lyfts/Waymo work well.
        </p>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Day of */}
      <div className="text-center mb-4">
        <span className="highlight-red text-base">
          &#9888; DAY OF THE WEDDING &#9888;
        </span>
      </div>

      <div
        className="p-4 my-4 text-center"
        style={{
          background: "#ffffcc",
          border: "3px double #cc0000",
        }}
      >
        <p className="text-lg font-bold mb-3" style={{ color: "#cc0000" }}>
          PLEASE UBER / LYFT / WAYMO TO THE WEDDING
        </p>
        <p className="text-base mb-2">
          Parking is limited and <span className="blink font-bold" style={{ color: "#cc0000" }}>DUIs lurk</span>.
        </p>
        <p className="text-sm" style={{ color: "#666666" }}>
          The afterparty is an 8-minute drive from the ceremony.
          <br />
          Rideshare there too. You&apos;ll thank us in the morning.
        </p>
      </div>

      {/* Marquee */}
      <div className="marquee my-4 comic" style={{ color: "#009900" }}>
        <span>
          &#127695; Don&apos;t drink and drive!! &#127695; Take an Uber!!
          &#127695; Waymo is fun!! &#127695; Don&apos;t drink and drive!!
          &#127695;&nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      </div>


      <div className="text-center my-4">
        <Link href="/proceedings" className="text-sm">
          &lt;&lt; Proceedings
        </Link>
        {" | "}
        <Link href="/" className="text-sm">
          Home
        </Link>
        {" | "}
        <Link href="/where-to-stay" className="text-sm">
          Where to Stay &gt;&gt;
        </Link>
      </div>
    </div>
  );
}
