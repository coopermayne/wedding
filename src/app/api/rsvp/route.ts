import { NextResponse } from "next/server";
import { getPartyByCode, hasResponded, submitRsvp, type Guest } from "@/lib/db";
import { RSVP_EVENT_KEYS, type RsvpEventKey } from "@/lib/events";

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
    plusOnes: party.plusOnes,
    guests: party.guests,
    events: party.events,
    song: party.song,
    responded: hasResponded(party),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, song, guests, events } = body;

    if (!code) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Take only the events we know about, and only fully-answered ones.
    const cleanEvents: Partial<
      Record<RsvpEventKey, { attending: "yes" | "no"; attendees: string[] }>
    > = {};
    for (const key of RSVP_EVENT_KEYS) {
      const answer = events?.[key];
      if (answer?.attending !== "yes" && answer?.attending !== "no") continue;
      cleanEvents[key] = {
        attending: answer.attending,
        attendees: (Array.isArray(answer.attendees) ? answer.attendees : []).map(
          (n: unknown) => String(n ?? "").trim()
        ),
      };
    }

    if (Object.keys(cleanEvents).length === 0) {
      return NextResponse.json(
        { error: "Please tell us which events you can make." },
        { status: 400 }
      );
    }

    // Keep the roster rows as-sent (don't drop empty names here): the store
    // treats index 0 as the invitee and derives their name authoritatively, so
    // the submitted first-row name doesn't matter. Trailing blank plus-one rows
    // are dropped inside submitRsvp.
    const cleanGuests: Guest[] = (Array.isArray(guests) ? guests : []).map((g) => ({
      name: String(g?.name || "").trim(),
      dietary: String(g?.dietary || "").trim(),
    }));

    const result = submitRsvp(code, {
      song: song || "",
      guests: cleanGuests,
      events: cleanEvents,
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
