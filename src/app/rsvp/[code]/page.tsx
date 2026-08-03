"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { stripDisallowedChars } from "@/lib/sanitize";
import { RSVP_EVENTS, WEEKEND, type RsvpEventKey } from "@/lib/events";
import { startOver } from "../actions";

type GuestRow = { name: string; dietary: string };
type StoredEvent = { attending: "yes" | "no" | null; attendees: string[] };

type Party = {
  code: string;
  name: string;
  email: string;
  plusOnes: number;
  guests: GuestRow[];
  events: Record<RsvpEventKey, StoredEvent>;
  song: string;
  responded: boolean;
};

// Labels for the additional guests beyond the invitee.
const PLUS_LABELS = ["Plus One", "Plus Two", "Plus Three", "Plus Four", "Plus Five"];

/**
 * Greetings read better on a first name ("Thanks, Jake!"). Household invites
 * are the exception — "The Thompsons" would become "The" — so those stay whole.
 */
function greetingName(name: string): string {
  const trimmed = name.trim();
  if (/^the\b/i.test(trimmed)) return trimmed;
  return trimmed.split(/\s+/)[0] || trimmed;
}

/**
 * Escape hatch for whoever isn't the person this browser is remembered as —
 * a forwarded invite link, or a computer two guests share.
 */
function NotYou({ name }: { name: string }) {
  return (
    <form action={startOver} className="text-center mt-2">
      <button
        type="submit"
        style={{
          background: "none",
          border: "none",
          color: "#666666",
          textDecoration: "underline",
          cursor: "pointer",
          font: "inherit",
          fontSize: "0.75rem",
          padding: 0,
        }}
      >
        Not {name}? Start over
      </button>
    </form>
  );
}

type Answers = Record<RsvpEventKey, "yes" | "no" | "">;
/** Who's coming to each event, as flags lined up with the roster rows. */
type Attendance = Record<RsvpEventKey, boolean[]>;

function blankAnswers(): Answers {
  const out = {} as Answers;
  for (const event of RSVP_EVENTS) out[event.key] = "";
  return out;
}

/** Build a per-event record without losing the key types. */
function byEvent<T>(make: (key: RsvpEventKey) => T): Record<RsvpEventKey, T> {
  const out = {} as Record<RsvpEventKey, T>;
  for (const event of RSVP_EVENTS) out[event.key] = make(event.key);
  return out;
}

export default function RSVPPage() {
  const params = useParams();
  const code = params.code as string;

  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  // "summary" = show what they submitted (with an Update button);
  // "form" = the editable RSVP form.
  const [mode, setMode] = useState<"summary" | "form">("form");

  const [guests, setGuests] = useState<GuestRow[]>([{ name: "", dietary: "" }]);
  const [answers, setAnswers] = useState<Answers>(blankAnswers);
  // Tracked by roster position rather than by name, so ticking a box doesn't
  // come undone when someone edits the spelling of a name afterwards.
  const [attendance, setAttendance] = useState<Attendance>(() =>
    byEvent<boolean[]>(() => [])
  );
  const [song, setSong] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /** Rebuild the editable state from whatever the server has stored. */
  function hydrate(data: Party) {
    const roster =
      data.guests && data.guests.length
        ? data.guests
        : [{ name: data.name, dietary: "" }];
    setGuests(roster);
    setSong(data.song || "");

    const nextAnswers = blankAnswers();
    for (const event of RSVP_EVENTS) {
      nextAnswers[event.key] = data.events?.[event.key]?.attending ?? "";
    }
    setAnswers(nextAnswers);
    setAttendance(
      byEvent((key) => {
        const stored = data.events?.[key];
        const coming = new Set(stored?.attendees || []);
        // Default everyone to "coming" until they've said otherwise.
        return roster.map((g) =>
          stored?.attending === "yes" ? coming.has(g.name) : true
        );
      })
    );
  }

  useEffect(() => {
    fetch(`/api/rsvp?code=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Party) => {
        setParty(data);
        hydrate(data);
        // If they've already responded, land on the summary so a refresh or a
        // second visit shows what they submitted rather than a blank form.
        setMode(data.responded ? "summary" : "form");
        setLoading(false);
      })
      .catch(() => {
        setInvalid(true);
        setLoading(false);
      });
  }, [code]);

  function startEditing() {
    if (!party) return;
    hydrate(party);
    setStatus("idle");
    setErrorMsg("");
    setMode("form");
  }

  // ---- roster editing ----
  function updateGuest(i: number, field: keyof GuestRow, value: string) {
    const clean = stripDisallowedChars(value);
    setGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, [field]: clean } : g)));
  }
  function addGuest() {
    if (!party || guests.length >= party.plusOnes + 1) return;
    setGuests((prev) => [...prev, { name: "", dietary: "" }]);
    // A newly added person defaults to coming to everything they're invited to.
    setAttendance((prev) => byEvent((key) => [...(prev[key] || []), true]));
  }
  function removeGuest(i: number) {
    if (guests.length <= 1) return;
    setGuests((prev) => prev.filter((_, idx) => idx !== i));
    setAttendance((prev) =>
      byEvent((key) => (prev[key] || []).filter((_, idx) => idx !== i))
    );
  }

  // ---- per-event answers ----
  function setAnswer(key: RsvpEventKey, value: "yes" | "no") {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }
  function toggleAttendee(key: RsvpEventKey, i: number) {
    setAttendance((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((on, idx) => (idx === i ? !on : on)),
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!party) return;

    // The roster as it will be stored: invitee first (name always from the
    // invite), then any plus-ones who were actually named.
    const roster = guests
      .map((g, idx) => ({
        name: idx === 0 ? party.name : g.name.trim(),
        dietary: g.dietary.trim(),
        idx,
      }))
      .filter((g) => g.name);

    for (const event of RSVP_EVENTS) {
      if (answers[event.key] !== "yes" && answers[event.key] !== "no") {
        setErrorMsg(`Please let us know about ${event.title}.`);
        setStatus("error");
        return;
      }
    }

    const payloadEvents: Record<string, { attending: string; attendees: string[] }> = {};
    for (const event of RSVP_EVENTS) {
      const attending = answers[event.key];
      const attendees =
        attending === "yes"
          ? roster.filter((g) => attendance[event.key]?.[g.idx]).map((g) => g.name)
          : [];
      if (attending === "yes" && attendees.length === 0) {
        setErrorMsg(`Please pick who's coming to ${event.title}.`);
        setStatus("error");
        return;
      }
      payloadEvents[event.key] = { attending, attendees };
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: party.code,
          song,
          guests: roster.map((g) => ({ name: g.name, dietary: g.dietary })),
          events: payloadEvents,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save RSVP");
      }

      // Update local state so the summary reflects what we just saved.
      const savedEvents = byEvent<StoredEvent>((key) => ({
        attending: payloadEvents[key].attending as "yes" | "no",
        attendees: payloadEvents[key].attendees,
      }));

      setParty({
        ...party,
        song,
        guests: roster.map((g) => ({ name: g.name, dietary: g.dietary })),
        events: savedEvents,
        responded: true,
      });
      setStatus("idle");
      setMode("summary");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save. Please try again.");
      setStatus("error");
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center my-16">
        <p className="comic text-lg" style={{ color: "#666666" }}>
          Loading your invite...
        </p>
      </div>
    );
  }

  if (invalid || !party) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center my-16">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "#cc0000" }}>
          Hmm, that link doesn&apos;t look right
        </h1>
        <p className="comic text-base mb-6" style={{ color: "#666666" }}>
          Please use the link from your invite email.
          <br />
          If you&apos;re having trouble, email us directly!
        </p>
        <Link href="/">&lt;&lt; Back to Home &gt;&gt;</Link>
      </div>
    );
  }

  const afterparty = WEEKEND.find((e) => e.key === "afterparty");

  // ---- Summary view (already responded) ----
  if (mode === "summary") {
    const comingToAnything = RSVP_EVENTS.some(
      (e) => party.events[e.key]?.attending === "yes"
    );
    const dietaryNotes = party.guests.filter((g) => g.dietary);

    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link href="/" className="text-sm">
          &lt;&lt; Back to Home
        </Link>

        <div className="text-center my-6">
          <p className="text-4xl mb-2">{comingToAnything ? "\u{1F389}" : "\u{1F494}"}</p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ color: comingToAnything ? "#cc00cc" : "#666666" }}
          >
            {comingToAnything ? "YOU'RE ALL SET!" : "WE'LL MISS YOU!"}
          </h1>
          <p className="comic text-base mt-2" style={{ color: "#666666" }}>
            {comingToAnything
              ? `Thanks, ${greetingName(party.name)}! Here's what we have for you:`
              : `Thanks for letting us know, ${greetingName(party.name)}.`}
          </p>
          <NotYou name={greetingName(party.name)} />
        </div>

        <hr className="rainbow-hr my-4" />

        {RSVP_EVENTS.map((event) => {
          const answer = party.events[event.key];
          const yes = answer?.attending === "yes";
          return (
            <div key={event.key} className="bevel-in p-4 mb-3">
              <p className="font-bold text-sm" style={{ color: "#cc00cc" }}>
                {event.title}
              </p>
              <p className="text-xs mb-2" style={{ color: "#666666" }}>
                {event.when}
              </p>
              {yes ? (
                <ul className="text-sm">
                  {answer.attendees.map((name, i) => (
                    <li key={i}>&#9829; {name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: "#666666" }}>
                  Not attending
                </p>
              )}
            </div>
          );
        })}

        {dietaryNotes.length > 0 && (
          <div className="bevel-in p-4 mb-3">
            <p className="font-bold text-sm mb-2" style={{ color: "#cc00cc" }}>
              Dietary needs
            </p>
            <ul className="text-sm">
              {dietaryNotes.map((g, i) => (
                <li key={i}>
                  <span className="font-bold">{g.name}</span>
                  {" — "}
                  <span style={{ color: "#cc0000" }}>{g.dietary}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {party.song && (
          <div className="bevel-in p-4 mb-3">
            <p className="text-sm">
              <span className="font-bold">Song request:</span> {party.song}
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <button onClick={startEditing} className="btn-90s text-base">
            [ Update my RSVP ]
          </button>
        </div>

        {comingToAnything && (
          <div className="marquee comic mt-6" style={{ color: "#009900" }}>
            <span>
              &#9829; THANK YOU &#9829; THANK YOU &#9829; THANK YOU &#9829; THANK
              YOU &#9829;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        )}

        <div className="text-center my-4">
          <Link href="/" className="text-sm">
            Home
          </Link>
        </div>
      </div>
    );
  }

  // Roster rows that can be ticked for an event: the invitee plus any named
  // plus-ones. Unnamed rows are still being filled in, so they're not offered.
  const namedRoster = guests
    .map((g, idx) => ({ name: idx === 0 ? party.name : g.name.trim(), idx }))
    .filter((g) => g.name);

  // ---- Form view ----
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link href="/" className="text-sm">
        &lt;&lt; Back to Home
      </Link>

      <div className="text-center my-6">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "#cc00cc" }}>
          ~*~ RSVP ~*~
        </h1>
      </div>

      <hr className="rainbow-hr my-4" />

      {status === "error" && (
        <div
          className="p-3 mb-4 text-center font-bold"
          style={{ background: "#ffcccc", border: "2px solid #cc0000", color: "#cc0000" }}
        >
          {errorMsg || "Something went wrong. Please try again!"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bevel-in p-4 md:p-6">
        <h2
          className="text-xl md:text-2xl font-bold text-center"
          style={{ color: "#cc00cc" }}
        >
          Hello, {greetingName(party.name)}!
        </h2>
        {party.responded && (
          <p className="comic text-xs text-center mt-1" style={{ color: "#009900" }}>
            Updating your previous RSVP.
          </p>
        )}
        <NotYou name={greetingName(party.name)} />

        <hr className="rainbow-hr my-4" />

        {/* ---- Step 1: who's in the party ---- */}
        <p className="text-center font-bold text-sm mb-1" style={{ color: "#cc00cc" }}>
          &#9829; WHO&apos;S IN YOUR PARTY? &#9829;
        </p>
        <p className="comic text-center text-xs mb-4" style={{ color: "#666666" }}>
          {party.plusOnes > 0
            ? `Add everyone coming with you — you can bring up to ${party.plusOnes} ${
                party.plusOnes === 1 ? "guest" : "guests"
              }. You'll pick who's coming to what below.`
            : "Add any dietary needs below."}
        </p>

        {guests.map((g, i) => {
          const isPrimary = i === 0;
          return (
            <div key={i} className="bevel-in p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">
                  {isPrimary ? party.name : PLUS_LABELS[i - 1] || `Plus ${i}`}
                </span>
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => removeGuest(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#cc0000",
                      textDecoration: "underline",
                      cursor: "pointer",
                      font: "inherit",
                      fontSize: "0.8rem",
                      padding: 0,
                    }}
                  >
                    [ remove ]
                  </button>
                )}
              </div>
              {!isPrimary && (
                <>
                  <label className="block font-bold text-xs mb-1">Name</label>
                  <input
                    type="text"
                    value={g.name}
                    onChange={(e) => updateGuest(i, "name", e.target.value)}
                    placeholder="Full name"
                    className="w-full mb-2"
                    maxLength={100}
                  />
                </>
              )}
              <label className="block font-bold text-xs mb-1">
                Dietary restrictions / allergies{" "}
                <span style={{ fontWeight: 400, color: "#666666" }}>
                  (for the wedding dinner)
                </span>
              </label>
              <input
                type="text"
                value={g.dietary}
                onChange={(e) => updateGuest(i, "dietary", e.target.value)}
                placeholder="e.g. vegetarian, gluten free, none"
                className="w-full"
                maxLength={150}
              />
            </div>
          );
        })}

        {guests.length < party.plusOnes + 1 && (
          <div className="text-center mb-2">
            <button type="button" onClick={addGuest} className="btn-90s text-sm">
              + Add a guest
            </button>
          </div>
        )}

        {/* ---- Step 2: one answer per event ---- */}
        {RSVP_EVENTS.map((event) => (
          <div key={event.key}>
            <hr className="rainbow-hr my-4" />
            <p className="font-bold text-base" style={{ color: "#cc00cc" }}>
              {event.title}
            </p>
            <p className="text-xs mb-1" style={{ color: "#000066" }}>
              {event.when}
            </p>
            <p className="text-xs mb-3" style={{ color: "#666666" }}>
              {event.place}
              <br />
              <span className="courier">{event.address}</span>
            </p>

            <p className="font-bold text-sm mb-2">Attending?</p>
            <label className="mr-4 text-sm cursor-pointer">
              <input
                type="radio"
                name={`attending-${event.key}`}
                checked={answers[event.key] === "yes"}
                onChange={() => setAnswer(event.key, "yes")}
                className="mr-1"
              />
              Joyfully Accept
            </label>
            <label className="text-sm cursor-pointer">
              <input
                type="radio"
                name={`attending-${event.key}`}
                checked={answers[event.key] === "no"}
                onChange={() => setAnswer(event.key, "no")}
                className="mr-1"
              />
              Regretfully Decline
            </label>

            {answers[event.key] === "yes" && (
              <div className="mt-3">
                <p className="font-bold text-sm mb-2">Who&apos;s coming to this one?</p>
                {namedRoster.length === 0 ? (
                  <p className="comic text-xs" style={{ color: "#cc0000" }}>
                    Add names above first.
                  </p>
                ) : (
                  namedRoster.map((g) => (
                    <label key={g.idx} className="block text-sm cursor-pointer mb-1">
                      <input
                        type="checkbox"
                        checked={Boolean(attendance[event.key]?.[g.idx])}
                        onChange={() => toggleAttendee(event.key, g.idx)}
                        className="mr-2"
                      />
                      {g.name}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {/* ---- The afterparty: no RSVP, just a heads-up ---- */}
        {afterparty && (
          <>
            <hr className="rainbow-hr my-4" />
            <div className="bevel-in p-3">
              <p className="font-bold text-base" style={{ color: "#cc6600" }}>
                {afterparty.title}
              </p>
              <p className="text-xs mb-1" style={{ color: "#663300" }}>
                {afterparty.when}
              </p>
              <p className="text-xs mb-2" style={{ color: "#666666" }}>
                {afterparty.place}
                <br />
                <span className="courier">{afterparty.address}</span>
              </p>
              <p className="comic text-sm" style={{ color: "#cc6600" }}>
                No RSVP required &mdash; be there or be square!
              </p>
            </div>
          </>
        )}

        <hr className="rainbow-hr my-4" />
        <label className="block font-bold text-sm mb-2">Song Request:</label>
        <input
          type="text"
          value={song}
          onChange={(e) => setSong(stripDisallowedChars(e.target.value))}
          className="w-full"
          maxLength={120}
          placeholder="What should we play at the afterparty?"
        />

        <div className="text-center mt-6">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn-90s text-base"
            style={status === "submitting" ? { opacity: 0.6 } : {}}
          >
            {status === "submitting" ? "[ Submitting... ]" : "[ Submit RSVP ]"}
          </button>
        </div>
      </form>

      <div className="text-center my-4">
        <Link href="/" className="text-sm">
          Home
        </Link>
      </div>
    </div>
  );
}
