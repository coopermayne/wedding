"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Guest = {
  code: string;
  name: string;
  email: string;
  plusOneAllowed: boolean;
};

export default function RSVPPage() {
  const params = useParams();
  const code = params.code as string;

  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/rsvp?code=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setGuest(data);
        setLoading(false);
      })
      .catch(() => {
        setInvalid(true);
        setLoading(false);
      });
  }, [code]);

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
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center my-16">
          <p className="text-4xl mb-4">&#127881;&#127881;&#127881;</p>
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: "#cc00cc" }}
          >
            SEE YOU THERE!!!
          </h1>
          <p className="comic text-lg mb-6" style={{ color: "#666666" }}>
            Thanks {guest?.name.split(" ")[0]}! We can&apos;t wait to celebrate with you.
          </p>
          <div className="marquee comic" style={{ color: "#009900" }}>
            <span>
              &#9829; THANK YOU &#9829; THANK YOU &#9829; THANK YOU &#9829;
              THANK YOU &#9829;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
          <p className="mt-8">
            <Link href="/">
              &lt;&lt; Back to Home &gt;&gt;
            </Link>
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
          Hey {guest!.name.split(" ")[0]}!
        </p>
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

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus("submitting");
          setErrorMsg("");

          const formData = new FormData(e.currentTarget);

          try {
            const res = await fetch("/api/rsvp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: guest!.code,
                name: guest!.name,
                email: guest!.email,
                attending: formData.get("attending"),
                dietary: formData.get("dietary"),
                song: formData.get("song"),
                plusOneName: formData.get("plusOneName") || "",
                plusOneDietary: formData.get("plusOneDietary") || "",
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
        }}
        className="bevel-in p-4 md:p-6"
      >
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 12px" }}>
          <tbody>
            <tr>
              <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                Name:
              </td>
              <td className="text-sm font-bold">{guest!.name}</td>
            </tr>
            <tr>
              <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                Attending?
              </td>
              <td>
                <label className="mr-4 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    value="yes"
                    required
                    className="mr-1"
                  />
                  Joyfully Accept
                </label>
                <label className="text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    className="mr-1"
                  />
                  Regretfully Decline
                </label>
              </td>
            </tr>
            <tr>
              <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                Dietary:
              </td>
              <td>
                <textarea
                  name="dietary"
                  rows={2}
                  className="w-full"
                  placeholder="Allergies, vegetarian, etc."
                />
              </td>
            </tr>
            <tr>
              <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                Song Request:
              </td>
              <td>
                <input
                  type="text"
                  name="song"
                  className="w-full"
                  placeholder="What should we play at the afterparty?"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Plus One Section */}
        {guest!.plusOneAllowed && (
          <>
            <hr className="rainbow-hr my-4" />
            <p className="text-center font-bold text-sm mb-4" style={{ color: "#cc00cc" }}>
              &#9829; YOU GET A PLUS ONE! &#9829;
            </p>
            <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 12px" }}>
              <tbody>
                <tr>
                  <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                    +1 Name:
                  </td>
                  <td>
                    <input
                      type="text"
                      name="plusOneName"
                      className="w-full"
                      placeholder="Your guest's full name"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                    +1 Dietary:
                  </td>
                  <td>
                    <textarea
                      name="plusOneDietary"
                      rows={2}
                      className="w-full"
                      placeholder="Their dietary restrictions"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
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
