import { listParties } from "@/lib/db";

function csvField(value: string): string {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Which segment to export. Drives the mailmerge use cases:
//   pending   -> reminder emails ("you haven't RSVP'd!")
//   attending -> confirmation emails ("you're all set!")
//   declined  -> the regrets list
//   responded -> everyone who has answered either way
//   all       -> everyone (default)
function matchesStatus(attending: "yes" | "no" | null, status: string): boolean {
  switch (status) {
    case "pending":
      return attending === null;
    case "attending":
      return attending === "yes";
    case "declined":
      return attending === "no";
    case "responded":
      return attending !== null;
    default:
      return true;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    return new Response("Not found", { status: 404 });
  }

  const status = new URL(request.url).searchParams.get("status") || "all";

  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  // Invite link lands on the personalized home page (which routes to the form).
  const linkFor = (code: string) =>
    siteUrl ? `${siteUrl}/?i=${code}` : `/?i=${code}`;

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

  const rows = listParties()
    .filter((p) => matchesStatus(p.attending, status))
    .map((p) => {
      const statusText =
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
        statusText,
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

  const filename =
    status === "all" ? "wedding-guests.csv" : `wedding-guests-${status}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
