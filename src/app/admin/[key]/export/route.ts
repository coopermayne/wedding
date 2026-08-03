import { hasResponded, listParties, matchesFilter } from "@/lib/db";
import { isRsvpEventKey, RSVP_EVENTS } from "@/lib/events";

function csvField(value: string): string {
  let s = String(value ?? "");
  // Defense-in-depth against spreadsheet formula injection: a leading = + - @
  // (or tab/CR) makes Excel/Sheets treat the cell as a formula. Inputs are
  // already sanitized on the way in; this guards any value regardless.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvResponse(header: string[], rows: string[][], filename: string) {
  const body = [header, ...rows].map((r) => r.map(csvField).join(",")).join("\r\n");
  // Prepend a BOM so Excel reads UTF-8 (names with accents) correctly.
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * One row per human, for handing to the restaurant or the caterer — as opposed
 * to the mailmerge export, which is one row per invite. Plus-ones get their own
 * line with a "Guest of" pointing back to whoever is bringing them.
 */
function attendeeList(eventKey: string) {
  const event = RSVP_EVENTS.find((e) => e.key === eventKey)!;
  const rows: string[][] = [];

  for (const party of [...listParties()].sort((a, b) => a.name.localeCompare(b.name))) {
    const answer = party.events[event.key];
    if (answer.attending !== "yes") continue;

    for (const name of answer.attendees) {
      const dietary = party.guests.find((g) => g.name === name)?.dietary || "";
      rows.push([
        name,
        // The invitee is bringing themselves; only plus-ones name a host.
        name === party.name ? "" : party.name,
        dietary,
        party.email,
      ]);
    }
  }

  return {
    header: ["Name", "Guest of", "Dietary restrictions", "Invite email"],
    rows,
    filename: `wedding-${event.key}-attendees.csv`,
  };
}

/** Names and song requests, for whoever is running the afterparty playlist. */
function songList() {
  const rows = [...listParties()]
    .filter((p) => p.song)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => [p.name, p.song]);

  return {
    header: ["Requested by", "Song"],
    rows,
    filename: "wedding-song-requests.csv",
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    return new Response("Not found", { status: 404 });
  }

  const search = new URL(request.url).searchParams;

  // Per-person exports for the vendors, rather than the per-invite mailmerge.
  const attendeesOf = search.get("attendees");
  if (attendeesOf && isRsvpEventKey(attendeesOf)) {
    const { header, rows, filename } = attendeeList(attendeesOf);
    return csvResponse(header, rows, filename);
  }
  if (search.get("songs")) {
    const { header, rows, filename } = songList();
    return csvResponse(header, rows, filename);
  }

  const status = search.get("status") || "all";

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
      ];
    });

  const filename =
    status === "all" ? "wedding-guests.csv" : `wedding-guests-${status}.csv`;

  return csvResponse(header, rows, filename);
}
