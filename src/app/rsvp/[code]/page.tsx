"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type GuestRow = { name: string; dietary: string };

type Party = {
  code: string;
  name: string;
  email: string;
  maxGuests: number;
  attending: "yes" | "no" | null;
  song: string;
  guests: GuestRow[];
  responded: boolean;
};

export default function RSVPPage() {
  const params = useParams();
  const code = params.code as string;

  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [guests, setGuests] = useState<GuestRow[]>([{ name: "", dietary: "" }]);
  const [song, setSong] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/rsvp?code=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Party) => {
        setParty(data);
        setAttending(data.attending ?? "");
        setSong(data.song || "");
        setGuests(
          data.guests && data.guests.length
            ? data.guests
            : [{ name: "", dietary: "" }]
        );
        setLoading(false);
      })
      .catch(() => {
        setInvalid(true);
        setLoading(false);
      });
  }, [code]);

  function updateGuest(i: number, field: keyof GuestRow, value: string) {
    setGuests((prev) =>
      prev.map((g, idx) => (idx === i ? { ...g, [field]: value } : g))
    );
  }
  function addGuest() {
    setGuests((prev) =>
      party && prev.length < party.maxGuests
        ? [...prev, { name: "", dietary: "" }]
        : prev
    );
  }
  function removeGuest(i: number) {
    setGuests((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!party) return;

    if (attending !== "yes" && attending !== "no") {
      setErrorMsg("Please let us know if you can make it!");
      setStatus("error");
      return;
    }

    const payloadGuests =
      attending === "yes"
        ? guests
            .map((g) => ({ name: g.name.trim(), dietary: g.dietary.trim() }))
            .filter((g) => g.name)
        : [];

    if (attending === "yes" && payloadGuests.length === 0) {
      setErrorMsg("Please add at least one guest name.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: party.code,
          attending,
          song,
          guests: payloadGuests,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save RSVP");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to save. Please try again."
      );
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

  if (invalid) {
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

  if (status === "success") {
    const declined = attending === "no";
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center my-16">
          <p className="text-4xl mb-4">
            {declined ? "\u{1F494}" : "\u{1F389}\u{1F389}\u{1F389}"}
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: declined ? "#666666" : "#cc00cc" }}
          >
            {declined ? "WE'LL MISS YOU!" : "SEE YOU THERE!!!"}
          </h1>
          <p className="comic text-lg mb-6" style={{ color: "#666666" }}>
            {declined
              ? "Thanks for letting us know. We'll be thinking of you!"
              : `Thanks ${party!.name}! We can't wait to celebrate with you.`}
          </p>
          {!declined && (
            <div className="marquee comic" style={{ color: "#009900" }}>
              <span>
                &#9829; THANK YOU &#9829; THANK YOU &#9829; THANK YOU &#9829;
                THANK YOU &#9829;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            </div>
          )}
          <p className="comic text-sm mt-6" style={{ color: "#666666" }}>
            Changed your mind? You can{" "}
            <button
              type="button"
              onClick={() => setStatus("idle")}
              style={{
                background: "none",
                border: "none",
                color: "#0000ee",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
                padding: 0,
              }}
            >
              update your RSVP
            </button>{" "}
            any time.
          </p>
          <p className="mt-4">
            <Link href="/">&lt;&lt; Back to Home &gt;&gt;</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link href="/" className="text-sm">
        &lt;&lt; Back to Home
      </Link>

      <div className="text-center my-6">
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#cc00cc" }}
        >
          ~*~ RSVP ~*~
        </h1>
        <p className="comic text-base mt-2" style={{ color: "#666666" }}>
          Hello, {party!.name}!
        </p>
        {party!.responded && (
          <p className="comic text-xs mt-1" style={{ color: "#009900" }}>
            You&apos;ve already RSVP&apos;d &mdash; feel free to update your
            answers below.
          </p>
        )}
      </div>

      <hr className="rainbow-hr my-4" />

      {status === "error" && (
        <div
          className="p-3 mb-4 text-center font-bold"
          style={{
            background: "#ffcccc",
            border: "2px solid #cc0000",
            color: "#cc0000",
          }}
        >
          {errorMsg || "Something went wrong. Please try again!"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bevel-in p-4 md:p-6">
        <p className="font-bold text-sm mb-2">Will you be joining us?</p>
        <label className="mr-4 text-sm cursor-pointer">
          <input
            type="radio"
            name="attending"
            checked={attending === "yes"}
            onChange={() => setAttending("yes")}
            className="mr-1"
          />
          Joyfully Accept
        </label>
        <label className="text-sm cursor-pointer">
          <input
            type="radio"
            name="attending"
            checked={attending === "no"}
            onChange={() => setAttending("no")}
            className="mr-1"
          />
          Regretfully Decline
        </label>

        {attending === "yes" && (
          <>
            <hr className="rainbow-hr my-4" />
            <p
              className="text-center font-bold text-sm mb-1"
              style={{ color: "#cc00cc" }}
            >
              &#9829; WHO&apos;S COMING? &#9829;
            </p>
            <p
              className="comic text-center text-xs mb-4"
              style={{ color: "#666666" }}
            >
              {party!.maxGuests > 1
                ? `Add everyone in your party (up to ${party!.maxGuests}).`
                : "Confirm your name below."}
            </p>

            {guests.map((g, i) => (
              <div key={i} className="bevel-in p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">Guest {i + 1}</span>
                  {guests.length > 1 && (
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
                <input
                  type="text"
                  value={g.name}
                  onChange={(e) => updateGuest(i, "name", e.target.value)}
                  placeholder="Full name"
                  className="w-full mb-2"
                />
                <input
                  type="text"
                  value={g.dietary}
                  onChange={(e) => updateGuest(i, "dietary", e.target.value)}
                  placeholder="Dietary restrictions (optional)"
                  className="w-full"
                />
              </div>
            ))}

            {guests.length < party!.maxGuests && (
              <div className="text-center mb-2">
                <button type="button" onClick={addGuest} className="btn-90s text-sm">
                  + Add guest
                </button>
              </div>
            )}

            <hr className="rainbow-hr my-4" />
            <p className="font-bold text-sm mb-2">Song Request:</p>
            <input
              type="text"
              value={song}
              onChange={(e) => setSong(e.target.value)}
              className="w-full"
              placeholder="What should we play at the afterparty?"
            />
          </>
        )}

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
