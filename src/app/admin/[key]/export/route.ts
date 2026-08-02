import { hasResponded, listParties, matchesFilter } from "@/lib/db";
import { RSVP_EVENTS } from "@/lib/events";

function csvField(value: string): string {
  let s = String(value ?? "");
  // Defense-in-depth against spreadsheet formula injection: a leading = + - @
  // (or tab/CR) makes Excel/Sheets treat the cell as a formula. Inputs are
  // already sanitized on the way in; this guards any value regardless.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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

  // Each event contributes three columns: did they answer, how many are
  // coming, and who — so the caterer and the restaurant each get their own
  // number straight out of the spreadsheet.
  const header = [
    "Name",
    "Email",
    "Plus Ones",
    "Invite Code",
    "Invite Link",
    "Responded",
    ...RSVP_EVENTS.flatMap((e) => [
      `${e.label} status`,
      `${e.label} count`,
      `${e.label} guests`,
    ]),
    "Party Roster",
    "Dietary",
    "Song",
    "Responded At",
    "Updated At",
  ];

  const rows = listParties()
    .filter((p) => matchesFilter(p, status))
    .map((p) => {
      const dietary = p.guests
        .filter((g) => g.dietary)
        .map((g) => `${g.name}: ${g.dietary}`)
        .join("; ");

      const eventCells = RSVP_EVENTS.flatMap((e) => {
        const answer = p.events[e.key];
        const statusText =
          answer.attending === "yes"
            ? "Attending"
            : answer.attending === "no"
              ? "Declined"
              : "No response";
        return [
          statusText,
          answer.attending === "yes" ? String(answer.attendees.length) : "0",
          answer.attendees.join("; "),
        ];
      });

      return [
        p.name,
        p.email,
        String(p.plusOnes),
        p.code,
        linkFor(p.code),
        hasResponded(p) ? "Yes" : "No",
        ...eventCells,
        p.guests.map((g) => g.name).join("; "),
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
