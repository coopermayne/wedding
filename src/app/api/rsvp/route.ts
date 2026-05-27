import { NextResponse } from "next/server";
import { getPartyByCode, submitRsvp, type Guest } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const party = getPartyByCode(code);
  if (!party) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Return everything the form needs, including any existing response so the
  // guest can come back and edit what they previously submitted.
  return NextResponse.json({
    code: party.code,
    name: party.name,
    email: party.email,
    maxGuests: party.maxGuests,
    attending: party.attending,
    song: party.song,
    guests: party.guests,
    responded: party.attending !== null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, attending, song, guests } = body;

    if (!code || (attending !== "yes" && attending !== "no")) {
      return NextResponse.json(
        { error: "Please tell us whether you can make it." },
        { status: 400 }
      );
    }

    const cleanGuests: Guest[] = (Array.isArray(guests) ? guests : [])
      .map((g) => ({
        name: String(g?.name || "").trim(),
        dietary: String(g?.dietary || "").trim(),
      }))
      .filter((g) => g.name.length > 0);

    if (attending === "yes" && cleanGuests.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one guest name." },
        { status: 400 }
      );
    }

    const result = submitRsvp(code, {
      attending,
      song: song || "",
      guests: cleanGuests,
    });

    if (!result) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("RSVP save error:", err);
    return NextResponse.json(
      {
        error:
          "We couldn't save your RSVP. Please try again, or email us directly.",
      },
      { status: 500 }
    );
  }
}
