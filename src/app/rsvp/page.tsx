"use client";

import Link from "next/link";
import { useState } from "react";

export default function RSVP() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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
            We can&apos;t wait to celebrate with you.
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
        <p className="comic text-sm mt-2" style={{ color: "#666666" }}>
          Sign our guestbook!! (jk it&apos;s an RSVP form)
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

          const form = e.currentTarget;
          const formData = new FormData(form);

          try {
            const res = await fetch("/api/rsvp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: formData.get("name"),
                email: formData.get("email"),
                attending: formData.get("attending"),
                guests: formData.get("guests"),
                dietary: formData.get("dietary"),
                song: formData.get("song"),
              }),
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Failed to save RSVP");
            }

            setStatus("success");
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to save. Please try again.");
            setStatus("error");
          }
        }}
        className="bevel-in p-4 md:p-6"
      >
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 12px" }}>
          <tbody>
            <tr>
              <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                Your Name:
              </td>
              <td>
                <input type="text" name="name" required className="w-full" />
              </td>
            </tr>
            <tr>
              <td className="font-bold text-sm align-top pr-3 pt-1 whitespace-nowrap">
                Email:
              </td>
              <td>
                <input type="email" name="email" required className="w-full" />
              </td>
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
                # Guests:
              </td>
              <td>
                <select name="guests" className="w-32">
                  <option value="1">Just me</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
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
        <Link href="/where-to-stay" className="text-sm">
          &lt;&lt; Where to Stay
        </Link>
        {" | "}
        <Link href="/" className="text-sm">
          Home
        </Link>
      </div>
    </div>
  );
}
