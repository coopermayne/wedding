import { listParties } from "@/lib/db";

function csvField(value: string): string {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    return new Response("Not found", { status: 404 });
  }

  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const linkFor = (code: string) =>
    siteUrl ? `${siteUrl}/rsvp/${code}` : `/rsvp/${code}`;

  const header = [
    "Name",
    "Email",
    "Max Guests",
    "Invite Code",
    "Invite Link",
    "Status",
    "Attending Count",
    "Guests",
    "Dietary",
    "Song",
    "Responded At",
    "Updated At",
  ];

  const rows = listParties().map((p) => {
    const status =
      p.attending === "yes"
        ? "Attending"
        : p.attending === "no"
          ? "Declined"
          : "No response";
    const guestNames = p.guests.map((g) => g.name).join("; ");
    const dietary = p.guests
      .filter((g) => g.dietary)
      .map((g) => `${g.name}: ${g.dietary}`)
      .join("; ");

    return [
      p.name,
      p.email,
      String(p.maxGuests),
      p.code,
      linkFor(p.code),
      status,
      p.attending === "yes" ? String(p.guests.length) : "0",
      guestNames,
      dietary,
      p.song,
      p.respondedAt || "",
      p.updatedAt || "",
    ]
      .map(csvField)
      .join(",");
  });

  // Prepend a BOM so Excel reads UTF-8 (names with accents) correctly.
  const csv = "﻿" + [header.map(csvField).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding-guests.csv"',
    },
  });
}
