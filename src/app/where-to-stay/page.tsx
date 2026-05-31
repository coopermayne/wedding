import Image from "next/image";
import Link from "next/link";

const neighborhoods = [
  {
    name: "Echo Park / Silverlake",
    color: "#cc0000",
    bg: "#fff0f0",
    description:
      "A gentrified Mexican-American and now yuppy/hipster/creative area oriented around Sunset Blvd., which has tons of great restaurants, taco stands, bars, cafes, and stores. Lots of cute hillside homes with lush trees and golden light. We live near Elysian Park and love it — you can do small hikes with views of the city. There's also Echo Park Lake and Silverlake Reservoir for walking around and people watching.",
    hotels: ["Silverlake Hotel + Pool", "Noon on Sunset Hill"],
    vibe: "WHERE WE LIVE",
  },
  {
    name: "Los Feliz / East Hollywood",
    color: "#0000cc",
    bg: "#f0f0ff",
    description:
      'Beautiful historic neighborhood with old Hollywood charm. Creative, with cafes, a great theater and bookstore. Our first date was at a dive bar there called the Drawing Room where you will be shamed if you order a martini, as we learned the hard way. Close to Griffith Park. East Hollywood ranges from Thai Town to Little Armenia and the hipsterdom of Virgil Village, where you can wait at least 30 minutes for a Courage Bagel.',
    hotels: ["Cara Hotel", "Hotel Covell"],
    vibe: "FIRST DATE TERRITORY",
  },
  {
    name: "Koreatown",
    color: "#009900",
    bg: "#f0fff0",
    description:
      "City, gritty, incredible food, horrific parking, a few excellent bars, plentiful spas and karaoke. This is where Max's bachelor pad was. Close to the wedding.",
    hotels: ["The Line", "Hotel Normandie"],
    vibe: "MAX'S OLD TURF",
  },
  {
    name: "West Hollywood",
    color: "#cc6600",
    bg: "#fff8f0",
    description:
      "Close to the wedding site in Hancock Park, home of the storied Sunset Strip (think River Phoenix overdose, Almost Famous, and Riot House Hotel). A gayborhood. Bustling, commercial, lots of hotels.",
    hotels: ["1 Hotel", "Petit Hermitage", "W Hollywood"],
    vibe: "NEAR THE WEDDING",
  },
  {
    name: "Larchmont Village",
    color: "#990099",
    bg: "#fff0ff",
    description:
      "Closest area to the wedding. Very walkable and family friendly. Beyond yuppy. A very cute strip with great food, cafes, and a bookstore we really like.",
    hotels: [],
    hotelNote: "We don't think there are hotels here lol",
    vibe: "WEDDING-ADJACENT",
  },
];

const otherAreas = [
  "Highland Park", "Eagle Rock", "Mid-City", "West Adams",
  "Mount Washington", "Glassel Park", "Atwater Village", "Frogtown",
  "Historic Filipinotown", "Venice", "Santa Monica",
];

export default function WhereToStay() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      <Link href="/" className="text-sm">
        &lt;&lt; Back to Home
      </Link>

      <div className="text-center my-6">
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#006600" }}
        >
          WHERE TO STAY
        </h1>
        <p className="text-sm">~*~*~*~*~*~*~*~*~*~*~</p>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Beach photo */}
      <div className="text-center my-6">
        <div className="bevel-out inline-block p-2">
          <div className="relative w-[280px] h-[190px] md:w-[420px] md:h-[280px]">
            <Image
              src="/images/couple-beach-ocean.jpg"
              alt="Emily and Max at the beach"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="bevel-in p-4 my-6">
        <p className="text-base">
          LA is sprawling with lots of gem villages that have distinct
          personalities. We live on the east side in{" "}
          <b>Echo Park</b>. The wedding is in <b>Hancock Park</b>, which is
          central. As the wedding approaches, we&apos;ll send more detailed recs
          for eating/drinking/activities.
        </p>
      </div>

      <div className="text-center my-4">
        <span className="highlight-yellow text-sm">
          &#11088; NEIGHBORHOOD GUIDE &#11088;
        </span>
      </div>

      {/* Neighborhoods */}
      {neighborhoods.map((hood) => (
        <div
          key={hood.name}
          className="my-6 p-4"
          style={{ background: hood.bg, border: `2px solid ${hood.color}` }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h2
              className="text-xl md:text-2xl font-bold"
              style={{ color: hood.color }}
            >
              {hood.name}
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5"
              style={{ background: hood.color, color: "#ffffff" }}
            >
              {hood.vibe}
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: "#333333" }}>
            {hood.description}
          </p>
          <p className="text-xs font-bold mb-1">
            Hotels:
          </p>
          {hood.hotels.length > 0 ? (
            <p className="text-sm courier">
              {hood.hotels.join(" | ")}
            </p>
          ) : (
            <p className="text-sm comic italic" style={{ color: "#999999" }}>
              {(hood as { hotelNote?: string }).hotelNote}
            </p>
          )}
        </div>
      ))}

      <hr className="rainbow-hr my-4" />

      {/* Other areas */}
      <div className="text-center mb-3">
        <span className="highlight-purple text-sm">
          OTHER GREAT AREAS
        </span>
      </div>
      <div className="bevel-in p-4 my-4 text-center">
        <p className="text-xs mb-3" style={{ color: "#666666" }}>
          A bit further from the wedding, but all worth exploring:
        </p>
        <p className="text-sm">
          {otherAreas.join(" • ")}
        </p>
        <p className="text-xs mt-3 comic" style={{ color: "#999999" }}>
          (Venice &amp; Santa Monica if you want to be near beach)
        </p>
      </div>


      <div className="text-center my-4">
        <Link href="/transportation" className="text-sm">
          &lt;&lt; Transportation
        </Link>
        {" | "}
        <Link href="/" className="text-sm">
          Home
        </Link>
        {" | "}
        <Link href="/rsvp" className="text-sm">
          RSVP!! &gt;&gt;
        </Link>
      </div>
    </div>
  );
}
